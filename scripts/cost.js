/* scripts/cost.js — DeepSeek 成本记录（自动生成，勿手改总量）
 *
 * 设计原则（对应"成本铁律：精确算式、不拍脑袋估算"）：
 *   - 记录的是**真实 token 用量**（输入总 tokens / 缓存命中 tokens / 输出 tokens），
 *     这些是 API 每次调用返回的实测值，不是估算。
 *   - 成本 = 用量 × 单价；单价集中在本文件的 PRICING 常量。
 *   - DeepSeek 调价时只改 PRICING 一处，历史用量数据保留、可按新价重算。
 *
 * 单价来源：DeepSeek 官方定价页 api-docs.deepseek.com（2026-08 现行，V4-Flash）。
 *   峰谷定价：工作日 9:00–12:00、14:00–18:00 高峰时段价格翻倍；
 *   每日新闻流水线跑在**北京时间 02:00（夜间平峰）**，故按标准价计、不乘倍率。
 */
const fs = require('fs');
const path = require('path');

const PRICING = {
  model: 'deepseek-v4-flash',
  inputCacheHit: 0.02, // 元 / 1M tokens（缓存命中）
  inputCacheMiss: 1.0, // 元 / 1M tokens（缓存未命中）
  output: 2.0, // 元 / 1M tokens
  peakMultiplier: 2.0, // 高峰时段倍率（每日流水线 02:00 不触发）
  currency: 'CNY',
};

/** 成本（元）= 缓存命中输入×0.02 + 未命中输入×1 + 输出×2，单位均为 元/1M tokens */
function computeCost(u, { peak = false } = {}) {
  const mult = peak ? PRICING.peakMultiplier : 1;
  const cached = u.cached || 0;
  const miss = Math.max(0, (u.prompt || 0) - cached);
  const comp = u.completion || 0;
  const cost =
    (cached / 1e6) * PRICING.inputCacheHit +
    (miss / 1e6) * PRICING.inputCacheMiss +
    (comp / 1e6) * PRICING.output;
  return +(cost * mult).toFixed(6);
}

const COST_FILE = path.resolve(__dirname, '..', 'cost-data.js');

function shanghaiDate() {
  // 北京时间日期，独立于运行机时区
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function readAll() {
  try {
    const txt = fs.readFileSync(COST_FILE, 'utf8');
    const m = txt.match(/var\s+COST_DATA\s*=\s*(\[[\s\S]*?\])\s*;/);
    if (m) return JSON.parse(m[1]);
  } catch (e) {
    /* 文件不存在则视为空 */
  }
  return [];
}

/**
 * 追加一条成本记录到 cost-data.js。
 * @param {{date?:string,type?:string,usage:object,note?:string}} rec
 *   usage = { calls, prompt, cached, completion }
 */
function recordCost({ date, type, usage, note }) {
  const all = readAll();
  const cost = computeCost(usage, { peak: false }); // 流水线/手动修复均按平峰计
  all.push({
    date: date || shanghaiDate(),
    model: PRICING.model,
    type: type || 'pipeline',
    calls: usage.calls || 0,
    prompt: usage.prompt || 0,
    cached: usage.cached || 0,
    completion: usage.completion || 0,
    costCNY: cost,
    ts: new Date().toISOString(),
    note: note || '',
  });
  const header = `/* 社会人 · DeepSeek 每日成本记录（自动生成，勿手改）
 * 字段：date, model, type(pipeline|manual-fix), calls, prompt(输入总tokens),
 *       cached(缓存命中tokens), completion(输出tokens), costCNY, ts, note
 * 成本=函数(用量,单价)，单价见 支出文档.html「单价口径」。历史用量保留，调价后可重算。
 * 加载：<script src="cost-data.js"></script> 暴露全局 COST_DATA。 */
`;
  fs.writeFileSync(COST_FILE, header + 'var COST_DATA = ' + JSON.stringify(all, null, 2) + ';\n');
  return cost;
}

module.exports = { PRICING, computeCost, recordCost, readAll, shanghaiDate, COST_FILE };
