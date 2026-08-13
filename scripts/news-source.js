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
  const live = await fetchHotLists();
  if (live.length >= 15) {
    const filtered = qualityFilter(live);
    console.log('[source] 实时候选 ' + live.length + ' 条 → 质量过滤后 ' + filtered.length + ' 条');
    return filtered;
  }
  if (opts.allowSample) {
    const s = loadSample();
    console.log('[source] 回退样例候选 ' + s.length + ' 条（仅手动/调试，不进线上）');
    return s;
  }
  console.error('[source] 全部实时来源均不可用，候选不足，放弃本次生成（不发布假新闻）');
  return null;
}

module.exports = { getCandidates, fetchHotLists, qualityFilter, loadSample, ENDPOINTS };
