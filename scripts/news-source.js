/* scripts/news-source.js — 候选新闻来源（真实新闻热榜 + 质量过滤）
 * 目标：在云端（Gitee Go 国内 runner）拉取国内真实新闻热榜，喂给大模型写结构化卡片。
 *
 * v1.58.2 重构（恢复新闻质量）：
 *   - 真实新闻源：头条热榜（主，稳定返回 50 条正经新闻）+ 微博热搜 / 知乎热榜（尽力，国内 IP 偶被反爬则跳过）。
 *   - 已删除抖音（娱乐视频标题）与百度实时榜（搜索联想词）—— 这两类不是新闻，会污染作文素材。
 *   - 质量过滤：黑名单（娱乐/明星/八卦/体育比分/游戏/个人 vlog 文案）剔除 + 公共议题打分排序，
 *     只保留「适合高中生写作文」的政策/经济/科技/社会/文化类议题。
 *   - 安全回退：若「全部来源」都失败，返回 null —— 绝不发布样例冒充真实新闻。
 *   - 样例文件 sample-candidates.json 仅作离线手动调试用（getCandidates({allowSample:true})），永不自动进线上。
 */
const fs = require('fs');
const path = require('path');

// 浏览器级 UA，提升搜索引擎 / 官媒页面可达性
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// fetch 兼容：部分旧 Node 无全局 fetch，用 http/https 兜底（保证任意 Node 版本可跑）
let _fetch = globalThis.fetch;
if (typeof _fetch !== 'function') {
  const https = require('https');
  const http = require('http');
  _fetch = (url, opts = {}) =>
    new Promise((resolve, reject) => {
      const lib = url.startsWith('https') ? https : http;
      const req = lib.get(
        url,
        { headers: opts.headers || { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return _fetch(res.headers.location, opts).then(resolve, reject);
          }
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () =>
            resolve({
              ok: res.statusCode === 200,
              status: res.statusCode,
              json: async () => JSON.parse(data),
              text: async () => data,
            })
          );
        }
      );
      req.on('error', reject);
      req.setTimeout(8000, () => req.destroy(new Error('timeout')));
    });
}

// —— 公开真实新闻热榜端点（国内可达）——
const ENDPOINTS = [
  {
    name: '头条热榜',
    url: 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc',
    parse: (j) => {
      const list = (j && j.data) || [];
      return (Array.isArray(list) ? list : [])
        .map((it) => {
          const title = it.Title || it.title || '';
          if (!title) return null;
          const u = it.Url || it.url || '';
          return { title, url: u.startsWith('http') ? u : 'https://www.toutiao.com/' };
        })
        .filter(Boolean);
    },
  },
  {
    name: '微博热搜',
    url: 'https://weibo.com/ajax/side/hotSearch',
    parse: (j) => {
      const list = (j && j.data && (j.data.hotgovs || j.data.realtime)) || [];
      return (Array.isArray(list) ? list : [])
        .map((it) => {
          const title = it.word || it.title || it.query || '';
          if (!title) return null;
          const w = encodeURIComponent(title);
          return { title, url: 'https://s.weibo.com/weibo?q=' + w };
        })
        .filter((it) => it.title);
    },
  },
  {
    name: '知乎热榜',
    url: 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true',
    parse: (j) => {
      const list = (j && j.data) || [];
      return (Array.isArray(list) ? list : [])
        .map((it) => {
          const t = it.target || {};
          const title = t.title || '';
          if (!title) return null;
          const u = t.url || '';
          return { title, url: u.startsWith('http') ? u : 'https://www.zhihu.com' + u };
        })
        .filter(Boolean);
    },
  },
];

// —— 质量过滤：只保留「适合高中生写作文」的真实公共议题 ——

// 命中即丢弃（娱乐/明星/八卦/体育比分/游戏/个人 vlog 文案）
const BLACKLIST = [
  '明星', '演员', '歌手', '综艺', '电视剧', '电影', '票房', '恋情', '分手', '结婚', '离婚',
  '官宣', '塌房', '选秀', '爱豆', '粉丝', '追星', '代言', '演唱会', '导演', '网红', '主播',
  '直播', '抖音', '快手', 'vlog', 'up主', '绯闻', '吃瓜', '八卦',
  '原神', '王者荣耀', '和平精英', '电竞', '赛季', '游戏',
  '夺冠', '比分', '联赛', '世界杯', '奥运', '决赛', '球员', '球队', '教练', '季后赛', '进球',
  '星座', '运势', '算命', '占卜', '迷信', '风水',
  '带你玩', '看看我', '我想去', '周末去', '旅行', '打卡', '拍照', '晚霞', '流星雨', '风景',
  '治愈', '解药', '文案', '今天也要', '生活碎片', '日常',
];

// 命中即加分（公共议题 / 适合作文）
const PREFER = [
  '政策', '改革', '发展', '经济', '科技', '创新', '教育', '文化', '社会', '民生', '就业',
  '养老', '医疗', '住房', '乡村', '环保', '生态', '法治', '治理', '数字', '人工智能', 'AI',
  '青年', '国家', '国际', '历史', '科研', '突破', '产业', '消费', '收入', '脱贫', '双减',
  '高考', '大学', '社保', '医保', '乡村振兴', '高质量', '新质生产力', '文明', '传统', '精神',
  '奋斗', '妇女', '儿童', '老人', '农业', '工业', '金融', '贸易', '外交', '法律', '道德',
];

function scoreTitle(t) {
  let s = 0;
  for (const kw of PREFER) if (t.includes(kw)) s += 2;
  return s;
}
function isBlacklisted(t) {
  const low = t.toLowerCase();
  return BLACKLIST.some((b) => low.includes(b.toLowerCase()));
}

// 标题归一化（去空白/标点/符号）用于跨源去重
function normTitle(t) {
  return (t || '').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
}

async function fetchOne(ep) {
  try {
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ac ? setTimeout(() => ac.abort(), 8000) : null;
    const r = await _fetch(ep.url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: ac ? ac.signal : undefined,
    });
    if (timer) clearTimeout(timer);
    if (!r.ok) {
      console.warn('[source] ' + ep.name + ' HTTP ' + r.status);
      return [];
    }
    const j = await r.json();
    const items = ep.parse(j).map((it) => ({ ...it, source: ep.name, platforms: [ep.name] }));
    console.log('[source] ' + ep.name + ' 获取 ' + items.length + ' 条');
    return items;
  } catch (e) {
    console.warn('[source] ' + ep.name + ' 获取失败: ' + e.message);
    return [];
  }
}

// 多源拉取 + 轮转交错合并（跨榜同题合并 platforms）
async function fetchHotLists() {
  const results = await Promise.all(ENDPOINTS.map(fetchOne));
  const perSource = results.map((r) => r.slice(0, 50));
  const maxLen = Math.max(0, ...perSource.map((r) => r.length));
  const merged = [];
  const seen = new Map();
  for (let i = 0; i < maxLen; i++) {
    for (const src of perSource) {
      const it = src[i];
      if (!it) continue;
      const k = normTitle(it.title);
      if (!k) continue;
      if (seen.has(k)) {
        const prev = seen.get(k);
        if (!prev.platforms.includes(it.source)) prev.platforms.push(it.source);
        continue;
      }
      const rec = { title: it.title, source: it.source, url: it.url, platforms: [it.source] };
      seen.set(k, rec);
      merged.push(rec);
    }
  }
  return merged;
}

// 质量过滤 + 公共议题排序：返回最适合作文的候选（最多 keepN 条）
function qualityFilter(merged, keepN = 60) {
  const clean = merged.filter((it) => !isBlacklisted(it.title));
  // 打分排序：先按公共议题得分，tie 时头条/微博/知乎优先
  const ranked = clean
    .map((it) => ({ ...it, _s: scoreTitle(it.title) + (it.source === '头条热榜' ? 1 : 0) }))
    .sort((a, b) => b._s - a._s);
  if (ranked.length >= 15) return ranked.slice(0, keepN);
  // 兜底：过滤后不足，则放宽黑名单（仍按得分排序取前 keepN），保证不空跑
  const relaxed = merged
    .map((it) => ({ ...it, _s: scoreTitle(it.title) }))
    .sort((a, b) => b._s - a._s);
  return relaxed.slice(0, keepN);
}

function loadSample() {
  const p = path.join(__dirname, 'sample-candidates.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * 取得候选新闻数组（每条 {title, source, url, platforms}），尽量 >= 18 条真实数据。
 * 全部来源失败则返回 null（调用方据此「不覆盖、不发布」）。
 * @param {{allowSample?: boolean}} [opts] allowSample=true 时允许回退离线样例（仅手动/调试）。
 */
async function getCandidates(opts = {}) {
  // 官媒定向（主源）：中国新闻网当日 RSS —— 复刻本地「官媒主题定向」
  const official = await getOfficialCandidates();
  console.log('[source] 官媒 RSS 候选 ' + official.length + ' 条');

  // 热榜（选题信号 + major 判定 + 题材补充）
  const hot = await fetchHotLists();
  const hotFiltered = qualityFilter(hot);
  console.log('[source] 热榜实时候选 ' + hot.length + ' 条 → 质量过滤 ' + hotFiltered.length + ' 条');

  // 合并：官媒为主；热榜补充未覆盖题材。目标放大到 ~55，保证回填多日去重时有足够候选
  const TARGET = 55;
  const officialTitles = new Set(official.map((o) => normTitle(o.title)));
  let merged = official.slice();
  for (const h of hotFiltered) {
    if (merged.length >= TARGET) break;
    if (officialTitles.has(normTitle(h.title))) continue; // 与官媒去重
    merged.push({ ...h, platforms: h.platforms || [h.source] });
  }

  // 给官媒候选补 major 信号：若标题也在热榜多平台出现，并入 platforms
  const hotByTitle = new Map(hotFiltered.map((h) => [normTitle(h.title), h.platforms || [h.source]]));
  for (const o of merged) {
    const hp = hotByTitle.get(normTitle(o.title));
    if (hp) o.platforms = [...new Set([...o.platforms, ...hp])];
  }

  if (merged.length >= 15) {
    console.log(
      '[source] 合并候选 ' + merged.length + ' 条（官媒 ' + official.length + ' + 热榜补 ' + (merged.length - official.length) + '）'
    );
    return merged;
  }
  if (opts.allowSample) {
    const s = loadSample();
    console.log('[source] 回退样例候选 ' + s.length + ' 条（仅手动/调试，不进线上）');
    return s;
  }
  console.error('[source] 候选不足 15 条，放弃本次生成（不发布假新闻）');
  return null;
}

// —— 官媒发现层（复刻本地「生成前联网抓官媒原文」）——
// 思路：热榜标题仅作种子；对每条标题用搜索引擎找官媒报道原文，
// 把 source/url 换成真实官媒，summary 换成官媒正文片段，喂给模型写出有厚度的卡片。
const OFFICIAL_MAP = [
  { host: 'people.com.cn', name: '人民网' },
  { host: 'xinhuanet.com', name: '新华网' },
  { host: 'news.cn', name: '新华网' },
  { host: 'cctv.com', name: '央视网' },
  { host: 'cctv.cn', name: '央视网' },
  { host: 'youth.cn', name: '中国青年网' },
  { host: 'chinanews.com.cn', name: '中国新闻网' },
  { host: 'ce.cn', name: '中国经济网' },
  { host: 'stdaily.com', name: '科技日报' },
  { host: 'cas.cn', name: '中国科学院' },
  { host: 'thepaper.cn', name: '澎湃新闻' },
  { host: 'gov.cn', name: '中国政府网' },
  { host: 'chinadaily.com.cn', name: '中国日报网' },
  { host: 'cnr.cn', name: '央广网' },
];
function officialName(host) {
  for (const m of OFFICIAL_MAP) if (host.includes(m.host)) return m.name;
  return null;
}
// 排除首页 / 门户 / 备案 / 查询类噪声链接
function isNoiseLink(u) {
  const low = u.toLowerCase();
  if (low.includes('beian.miit.gov.cn')) return true;
  if (low.includes('miit.gov.cn/dxxzsp') || low.includes('dxzhgl.miit.gov.cn')) return true;
  if (low.includes('mps.gov.cn') && low.includes('websearch')) return true;
  if (/\/(index|default)\.\w+$/i.test(u)) return true;
  if (/\/[^/]+\/$/.test(u) && u.split('/').length <= 4) return true; // 门户根 / 二级目录首页
  return false;
}
function scorePath(u) {
  let s = 0;
  if (/\/20\d{2}[/-]\d{2}/.test(u)) s += 3; // 含日期
  if (/\/(politics|news|world|tech|society|finance|cpp|local|2026|2025)\//i.test(u)) s += 2;
  if (u.split('/').length >= 6) s += 1;
  return s;
}
async function searchOfficial(title) {
  // 双源：必应网页搜索 + 必应新闻搜索（新闻源官媒覆盖更好）
  const queries = [
    'https://www.bing.com/search?q=' + encodeURIComponent(title) + '&setlang=zh-CN&cc=CN',
    'https://www.bing.com/news/search?q=' + encodeURIComponent(title) + '&setlang=zh-CN&cc=CN',
  ];
  const allLinks = [];
  for (const url of queries) {
    try {
      const r = await _fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN' }, signal: AbortSignal.timeout(10000) });
      const html = await r.text();
      const re = /href="(https?:\/\/[^"]+)"/g;
      let m;
      while ((m = re.exec(html))) allLinks.push(m[1]);
    } catch (e) {
      /* 该引擎失败，试下一个 */
    }
  }
  const official = allLinks
    .map((u) => {
      let h = '';
      try { h = new URL(u).hostname; } catch (e) {}
      return { u, name: officialName(h) };
    })
    .filter((x) => x.name && !isNoiseLink(x.u))
    .sort((a, b) => scorePath(b.u) - scorePath(a.u));
  return official.slice(0, 6);
}
async function fetchArticle(url) {
  const r = await _fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
  const html = await r.text();
  const ps = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim())
    .filter((t) => t.length > 25 && !/版权|责任编辑|扫描二维码|分享到|客户端|登录|关注我们/.test(t));
  const text = ps.join(' ').slice(0, 900);
  return text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400);
}
async function discoverOfficial(title) {
  const cand = await searchOfficial(title);
  for (const c of cand) {
    try {
      const summary = await fetchArticle(c.u);
      // 过滤掉抓到门户首页/导航的情况（正文像站点地图而非报道）
      if (summary && summary.length > 60 && !/中央人民政府|无障碍|门户网站|版权所有|主办单位|网站地图/.test(summary)) {
        return { source: c.name, url: c.u, summary };
      }
    } catch (e) {
      /* 该链接抓不到，试下一个 */
    }
  }
  return null; // 没找到官媒 → 调用方保留热榜 source 兜底
}

// —— 官媒定向主源（复刻本地「官媒主题定向」）——
// 中国新闻网当日 RSS：返回真实官媒报道（title/link/description 摘要/pubDate 均为当日），
// 自带新闻摘要，无需再 fetch 正文，稳定且零额外请求。
async function getOfficialCandidates() {
  // 中国新闻网多频道当日 RSS（国内/滚动/国际/财经/社会），合并去重 ≈100+ 条真实官媒报道
  const FEEDS = [
    'https://www.chinanews.com.cn/rss/scroll-news.xml',
    'https://www.chinanews.com.cn/rss/china.xml',
    'https://www.chinanews.com.cn/rss/world.xml',
    'https://www.chinanews.com.cn/rss/finance.xml',
    'https://www.chinanews.com.cn/rss/society.xml',
  ];
  const out = [];
  const seen = new Set();
  for (const url of FEEDS) {
    try {
      const r = await _fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
      const xml = await r.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
      for (const it of items) {
        const title = (it.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
        const link = (it.match(/<link>([\s\S]*?)<\/link>/) || [])[1];
        const desc = (it.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';
        if (!title || !link) continue;
        const k = normTitle(title);
        if (seen.has(k)) continue; // 跨频道去重
        seen.add(k);
        const summary = desc
          .replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        out.push({
          title: title.trim(),
          source: '中国新闻网',
          url: link.trim(),
          summary: summary.slice(0, 300),
          platforms: ['中国新闻网'],
        });
      }
    } catch (e) {
      /* 该 feed 失败跳过 */
    }
  }
  return out;
}

module.exports = { getCandidates, fetchHotLists, qualityFilter, loadSample, ENDPOINTS, discoverOfficial, getOfficialCandidates };
