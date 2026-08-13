/* scripts/news-source.js — 候选新闻来源（多源真实热榜）
 * 目标：在云端（Gitee Go 国内 runner）拉取多个国内热榜，喂给大模型写结构化卡片。
 *
 * v1.58 重构（路B）：
 *   - 多源：微博 / 百度 / 知乎 / 头条 四个公开热榜 JSON 端点（国内可达，任一可用即可）。
 *   - 合并去重：同一条新闻若出现在多个热榜，合并 platforms（用于「特大 / major」判定）。
 *   - 安全回退：任一来源失败只跳过该源；若「全部来源」都失败，返回 null —— 绝不发布样例冒充真实新闻。
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

// —— 公开热榜端点（国内可达；任一可用即可）——
const ENDPOINTS = [
  {
    name: '微博热搜',
    url: 'https://weibo.com/ajax/side/hotSearch',
    parse: (j) => {
      const list = (j && j.data && (j.data.hotgovs || j.data.realtime)) || [];
      return (Array.isArray(list) ? list : [])
        .map((it) => ({
          title: it.word || it.title || it.query || '',
          url: 'https://s.weibo.com/weibo?q=' + encodeURIComponent(it.word || it.title || ''),
        }))
        .filter((it) => it.title);
    },
  },
  {
    name: '百度热搜',
    url: 'https://top.baidu.com/api/board?platform=wise&tab=realtime',
    parse: (j) => {
      const cards = (j && j.data && j.data.cards) || [];
      const items = [];
      for (const c of cards) {
        // 真实结构：cards[0].content[0].content = 热榜条目数组
        const inner = (c.content || [])[0] || {};
        for (const it of inner.content || []) {
          const title = it.word || '';
          if (!title) continue;
          const u = it.url || 'https://www.baidu.com/s?wd=' + encodeURIComponent(title);
          items.push({ title, url: u.startsWith('http') ? u : 'https://www.baidu.com/s?wd=' + encodeURIComponent(title) });
        }
      }
      return items;
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
    name: '抖音热点',
    url: 'https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/',
    parse: (j) => {
      const list = (j && j.word_list) || [];
      return (Array.isArray(list) ? list : [])
        .map((it) => {
          const title = it.word || '';
          if (!title) return null;
          return { title, url: 'https://www.douyin.com/search/' + encodeURIComponent(title) };
        })
        .filter(Boolean);
    },
  },
];

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

// 多源拉取 + 轮转交错合并（保证前 N 条跨源多样；跨榜同题合并 platforms）
async function fetchHotLists() {
  const results = await Promise.all(ENDPOINTS.map(fetchOne));
  const perSource = results.map((r) => r.slice(0, 30));
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
    console.log('[source] 实时多源候选共 ' + live.length + ' 条');
    return live;
  }
  if (opts.allowSample) {
    const s = loadSample();
    console.log('[source] 回退样例候选 ' + s.length + ' 条（仅手动/调试，不进线上）');
    return s;
  }
  console.error('[source] 全部实时来源均不可用，候选不足，放弃本次生成（不发布假新闻）');
  return null;
}

module.exports = { getCandidates, fetchHotLists, loadSample, ENDPOINTS };
