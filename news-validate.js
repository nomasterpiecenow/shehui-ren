/* news-validate.js — C2 新闻数据校验（对应 NEWS_REVIEW_STANDARD.md S1/S2/S3/S4/S6/S7）
 * 用法: node news-validate.js
 * 退出码: 0 = 全部通过; 1 = 有硬性失败
 * 设计: 在同一 vm 沙箱中先加载 news-data.js(定义 NEWS_DATA 全局),
 *       再加载主 HTML 的全部脚本并调用 initNodes() 拿到真实图谱节点集,
 *       据此校验每条新闻引用的 theory id 是否合法、条数/字段/学科覆盖等。
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const DIR = __dirname;
const html = fs.readFileSync(path.join(DIR, 'sociology-map.html'), 'utf8');
const newsCode = fs.readFileSync(path.join(DIR, 'news-data.js'), 'utf8');

// 主 HTML 内联脚本（news-data.js 已外链，其 <script src> 内容为空，不影响）
const htmlScripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');

function makeCtx() {
  const noop = () => {};
  const grad = { addColorStop: noop };
  return new Proxy({
    createLinearGradient: () => grad, createRadialGradient: () => grad,
    measureText: () => ({ width: 10 }),
    setLineDash: noop, save: noop, restore: noop, clearRect: noop,
    beginPath: noop, arc: noop, fill: noop, stroke: noop, moveTo: noop,
    lineTo: noop, quadraticCurveTo: noop, fillRect: noop, fillText: noop,
  }, {
    get: (t, p) => (p in t ? t[p] : (typeof p === 'string' ? (t[p] = (t[p] !== undefined ? t[p] : noop)) : noop)),
    set: (t, p, v) => { t[p] = v; return true; }
  });
}
const ctx = makeCtx();
function elStub() {
  return {
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {}, style: {}, innerHTML: '', textContent: '',
    appendChild: () => {}, dataset: {}, clientWidth: 1000, clientHeight: 600,
    querySelector: () => elStub(), querySelectorAll: () => [],
    getContext: () => ctx, getBoundingClientRect: () => ({ width: 1000, height: 600 }),
    parentElement: { getBoundingClientRect: () => ({ width: 1000, height: 600 }) }
  };
}
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Proxy,
  setTimeout: () => 0, clearTimeout: () => 0,
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0,
  document: { getElementById: () => elStub(), querySelector: () => elStub(), querySelectorAll: () => [], createElement: () => elStub(), body: elStub(), addEventListener: () => {} },
};
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};
sandbox.globalThis = sandbox;

const harness = `
;initNodes();
globalThis.__nodes = nodes;
globalThis.__NEWS = (typeof NEWS_DATA !== 'undefined') ? NEWS_DATA : null;
`;
try {
  vm.runInNewContext(newsCode + '\n' + htmlScripts + '\n' + harness, sandbox, { timeout: 15000 });
} catch (e) {
  console.error('RUN ERROR:', e.message);
  process.exit(1);
}

const nodes = sandbox.__nodes;
const NEWS = sandbox.__NEWS;
if (!nodes || !Array.isArray(nodes)) { console.error('图谱节点未生成'); process.exit(1); }
if (!NEWS || typeof NEWS !== 'object') { console.error('NEWS_DATA 未加载'); process.exit(1); }

const nodeIds = new Set(nodes.map(n => n.id));
const discOf = {};
nodes.forEach(n => { discOf[n.id] = n.disc; });

let fail = 0, warn = 0;
function ok(cond, msg) { if (cond) { /* pass */ } else { fail++; console.log('  ✗ FAIL: ' + msg); } }
function warnf(cond, msg) { if (!cond) { warn++; console.log('  ⚠ WARN: ' + msg); } }

const REQUIRED = ['id', 'title', 'source', 'url', 'theories'];

// 来源可信度软告警（S0 来源分层）：命中下列模式的 url 疑似 UGC 个人帖，须人工复核
// 注意：微博热榜索引页 s.weibo.com/top/summary 属"热榜指数"来源（标准 S2 允许），不在此列
const UGC_PATTERNS = [
  /\/toutiao\.com\/w\//i,                                  // 微头条 个人帖
  /xiaohongshu\.com/i, /douyin\.com/i, /iesdouyin\.com/i,  // 小红书/抖音 个人内容
  /\/weibo\.com\/\d{4,}\//i, /\/weibo\.com\/[A-Za-z0-9_]+\/status/i, /\/m\.weibo\.cn\/(detail|status)\//i, // 微博 个人帖子
  /\/zhihu\.com\/(question|answer|people)\//i,             // 知乎 回答/个人
];
function looksUGC(url) { return UGC_PATTERNS.some(re => re.test(url || '')); }

const dates = Object.keys(NEWS).sort((a, b) => b.localeCompare(a));

console.log('核查 NEWS_DATA, 共 ' + dates.length + ' 个日期, 图谱节点 ' + nodes.length + ' 个 (唯一id ' + nodeIds.size + ')\n');

// S7 留存: 日期数 <=7
warnf(dates.length <= 7, '日期数=' + dates.length + ' (>7, 建议按 S7 修剪旧日期)');

// 整体学科覆盖 (S3 宽松, 跨全部数据)
const allDiscs = new Set();
dates.forEach(d => NEWS[d].forEach(it => (it.theories || []).forEach(t => { if (discOf[t.id]) allDiscs.add(discOf[t.id]); })));
warnf(allDiscs.size === 3, '整体学科覆盖=' + [...allDiscs].sort().join('/') + ' (期望 soc/econ/psy 三科)');

dates.forEach(date => {
  const arr = NEWS[date];
  console.log('• ' + date + ' (' + arr.length + ' 条)');

  // S1 条数精确=15
  ok(arr.length === 15, date + ': 应为15条, 实际 ' + arr.length);

  // 批次内 id / title 唯一
  const ids = arr.map(it => it.id);
  const titles = arr.map(it => (it.title || '').trim());
  ok(new Set(ids).size === ids.length, date + ': 存在重复 item.id');
  ok(new Set(titles).size === titles.length, date + ': 存在重复 title');

  // 单日期学科覆盖 (S3)
  const dDiscs = new Set();
  arr.forEach(it => (it.theories || []).forEach(t => { if (discOf[t.id]) dDiscs.add(discOf[t.id]); }));
  warnf(dDiscs.size === 3, date + ': 学科覆盖=' + [...dDiscs].sort().join('/') + ' (期望三科)');

  // 逐条校验：基础字段 + url + theories(始终需要); 结构二选一（新/旧）
  arr.forEach((it, i) => {
    const tag = date + '#' + (it.id ?? i);
    REQUIRED.forEach(f => ok(it[f] !== undefined && it[f] !== null && it[f] !== '', tag + ': 缺字段 ' + f));
    // url 形如 http(s)
    ok(typeof it.url === 'string' && /^https?:\/\//.test(it.url.trim()), tag + ': url 非法 -> ' + it.url);
    // S0 来源分层(软告警)：疑似 UGC 个人源，提示人工复核是否为可核验编辑源
    if (looksUGC(it.url)) warnf(false, tag + ': url 疑似 UGC 个人源 (' + it.url + ')，请复核其是否为可核验编辑源');
    // theories 数组 + id 合法
    ok(Array.isArray(it.theories) && it.theories.length >= 1, tag + ': theories 为空');
    let validLink = 0;
    (it.theories || []).forEach(t => {
      ok(t && nodeIds.has(t.id), tag + ': theory id 不在图谱节点集 -> ' + (t && t.id));
      if (t && nodeIds.has(t.id)) validLink++;
    });
    // S4/S6: 至少 1 个有效链接
    ok(validLink >= 1, tag + ': 无有效理论链接');
    // S2: major 必须有链接
    if (it.major === true) ok(validLink >= 1, tag + ': 标记为特大(major)但无有效链接');

    const isNew = Array.isArray(it.interpretations) && it.interpretations.length;
    const isOld = Array.isArray(it.perspectives) && it.perspectives.length;

    if (isNew) {
      // 新结构（v1.16）：gist / thread / interpretations（疑问驱动）
      ok(typeof it.gist === 'string' && it.gist.trim().length > 0, tag + ': 新结构缺 gist(立论)');
      ok(Array.isArray(it.thread) && it.thread.length >= 1, tag + ': 新结构 thread(事件脉络)为空');
      if (Array.isArray(it.thread)) it.thread.forEach((s, si) => ok(s && typeof s.t === 'string' && typeof s.x === 'string', tag + '.thread[' + si + '] 缺 t/x'));
      ok(isNew, tag + ': interpretations 为空');
      it.interpretations.forEach((p, pi) => {
        const pt = tag + '.interpretations[' + pi + ']';
        ok(p && typeof p.q === 'string' && p.q.trim(), pt + ': 缺 q(读者真问题)');
        ok(p && typeof p.naive === 'string' && p.naive.trim(), pt + ': 缺 naive(常识误判)');
        ok(p && typeof p.lens === 'string' && p.lens.trim(), pt + ': 缺 lens(理论标签)');
        ok(p && typeof p.lensId === 'string' && nodeIds.has(p.lensId), pt + ': lensId 不在图谱节点集 -> ' + (p && p.lensId));
        ok(p && typeof p.body === 'string' && p.body.trim(), pt + ': 缺 body(解读)');
        ok(p && typeof p.aha === 'string' && p.aha.trim(), pt + ': 缺 aha(顿悟收尾)');
        // S9 前沿研究（可选，best-effort，嵌套于 interpretation）
        if (p && p.research) {
          const r = p.research, rt = pt + '.research';
          warnf(typeof r.url === 'string' && /^https?:\/\//.test((r.url || '').trim()), rt + ': url 非法 -> ' + r.url);
          warnf(r.fromNode && nodeIds.has(r.fromNode), rt + ': fromNode 不在图谱节点集 -> ' + (r && r.fromNode));
          if (r.year !== undefined) warnf(Number(r.year) >= 1990 && Number(r.year) <= 2027, rt + ': year 超出合理范围 -> ' + r.year);
        }
      });
    } else if (isOld) {
      // 旧结构兼容降级（历史日期）
      ['background', 'event', 'outcome'].forEach(f => ok(it[f] !== undefined && it[f] !== null && it[f] !== '', tag + ': 旧结构缺 ' + f));
      ok(Array.isArray(it.perspectives) && it.perspectives.length >= 1, tag + ': perspectives 为空');
      it.perspectives.forEach((p, pi) => {
        const pt = tag + '.perspectives[' + pi + ']';
        if (p && p.research) {
          const r = p.research, rt = pt + '.research';
          warnf(typeof r.url === 'string' && /^https?:\/\//.test((r.url || '').trim()), rt + ': url 非法 -> ' + r.url);
          warnf(r.fromNode && nodeIds.has(r.fromNode), rt + ': fromNode 不在图谱节点集 -> ' + (r && r.fromNode));
          if (r.year !== undefined) warnf(Number(r.year) >= 1990 && Number(r.year) <= 2027, rt + ': year 超出合理范围 -> ' + r.year);
        }
      });
    } else {
      fail++;
      console.log('  ✗ FAIL: ' + tag + ': 既无 interpretations 也无 perspectives，结构无法识别');
    }
  });
});

console.log('\n========================================');
console.log('FAIL = ' + fail + '   WARN = ' + warn);
console.log(fail === 0 ? '✅ 校验通过（无硬性失败）' : '❌ 存在硬性失败，请修复后再发布');
console.log('========================================');
process.exit(fail === 0 ? 0 : 1);
