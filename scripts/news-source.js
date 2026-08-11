/* scripts/news-source.js — 候选新闻来源
 * 目标：在云端（无本机值守）也能拿到当日候选热点，喂给大模型写结构化卡片。
 *
 * 策略：先尝试抓公开热榜 JSON（实时、新鲜）；任一成功且数量足够即采用；
 *       全部失败则回退 sample-candidates.json（离线兜底，保证云端任务永不硬失败）。
 *
 * 已知权衡（v1）：
 *   公开热榜通常只给「标题」，不给正文。本管线让大模型基于标题 + 通用知识撰写
 *   解读，thread 以结构性背景脉络为主，不编造具体日期/单一确凿事件。
 *   若未来要更高保真，可在此接入「按 url 抓取正文」的抓取器（扩展点）。
 */
const fs = require('fs');
const path = require('path');

// —— 公开热榜端点（可继续扩充；任一可用即可）——
const ENDPOINTS = [
  {
    name: 'weibo',
    url: 'https://weibo.com/ajax/side/hotSearch',
    parse: (j) => {
      const list = (j && (j.data && (j.data.hotgovs || j.data.realtime))) || j.data || [];
      return (Array.isArray(list) ? list : [])
        .map((it) => ({
          title: it.word || it.title || it.query || '',
          source: '微博热搜',
          url: 'https://s.weibo.com/weibo?q=' + encodeURIComponent(it.word || it.title || ''),
          platforms: ['微博热搜'],
        }))
        .filter((it) => it.title);
    },
  },
];

async function fetchHotList() {
  for (const ep of ENDPOINTS) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(ep.url, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!r.ok) continue;
      const j = await r.json();
      const items = ep.parse(j);
      if (items.length >= 15) {
        console.log('[source] ' + ep.name + ' 实时热榜获取 ' + items.length + ' 条');
        return items;
      }
    } catch (e) {
      console.warn('[source] ' + ep.name + ' 获取失败: ' + e.message);
    }
  }
  return null;
}

function loadSample() {
  const p = path.join(__dirname, 'sample-candidates.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * 取得候选新闻数组（每条 {title, source, url, platforms?}），数量尽量 >= 18。
 */
async function getCandidates() {
  const live = await fetchHotList();
  if (live && live.length >= 15) return live;
  const s = loadSample();
  console.log('[source] 回退样例候选 ' + s.length + ' 条');
  return s;
}

module.exports = { getCandidates, fetchHotList, loadSample };
