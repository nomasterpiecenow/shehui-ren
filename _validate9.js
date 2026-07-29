const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('sociology-map.html', 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
// NEWS_DATA 已外链到 news-data.js，须先加载以提供全局 NEWS_DATA
const newsCode = fs.readFileSync('news-data.js', 'utf8');
// 按文件顺序拼接所有脚本（主脚本加载时依赖首个脚本的 NEWS_DATA 等全局）
const code = newsCode + '\n' + scripts.join('\n');

function makeCtx() {
  const noop = () => {};
  const grad = { addColorStop: noop };
  return new Proxy({
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    measureText: () => ({ width: 10 }),
    setLineDash: noop, save: noop, restore: noop, clearRect: noop,
    beginPath: noop, arc: noop, fill: noop, stroke: noop, moveTo: noop,
    lineTo: noop, quadraticCurveTo: noop, fillRect: noop, fillText: noop,
  }, { get: (t, p) => (p in t ? t[p] : (typeof p === 'string' ? (t[p] = (t[p] !== undefined ? t[p] : noop)) : noop)), set: (t, p, v) => { t[p] = v; return true; } });
}
const ctx = makeCtx();
function elStub() {
  return { classList:{ add:()=>{}, remove:()=>{}, contains:()=>false },
    addEventListener:()=>{}, style:{}, innerHTML:'', textContent:'',
    appendChild:()=>{}, dataset:{}, clientWidth:1000, clientHeight:600,
    querySelector:()=>elStub(), querySelectorAll:()=>[],
    getContext:()=>ctx, getBoundingClientRect:()=>({width:1000,height:600}),
    parentElement:{ getBoundingClientRect:()=>({width:1000,height:600}) } };
}
const sandbox = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Proxy,
  setTimeout:()=>0, clearTimeout:()=>0,
  requestAnimationFrame:()=>0, cancelAnimationFrame:()=>0,
  document: { getElementById:()=>elStub(), querySelector:()=>elStub(), querySelectorAll:()=>[], createElement:()=>elStub(), body:elStub(), addEventListener:()=>{} },
};
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};
sandbox.globalThis = sandbox;

const assertions = `
;(function(){
  let pass = 0, fail = 0;
  function ok(c, m){ if(c){pass++;} else {fail++; console.log('  ✗ '+m);} }
  function exists(k){ try { const v = eval(k); if (typeof v === 'undefined') return false; return Array.isArray(v) ? v.length>0 : Object.keys(v).length>0; } catch(e){ return false; } }

  // 1. 数据数组存在
  ['THINKERS','THEORIES','CONCEPTS','TOPICS','ECON_THINKERS','ECON_THEORIES','ECON_CONCEPTS','ECON_TOPICS','PSY_THINKERS','PSY_THEORIES','PSY_CONCEPTS','PSY_TOPICS','ENRICH','NODE_META','CROSS_EDGES','ECON_TOPIC_THEORIES','PSY_TOPIC_THEORIES'].forEach(k=>ok(exists(k), 'missing/empty '+k));

  initNodes();

  ok(nodes.length === 182, 'node count expected 182, got '+nodes.length);
  ok(edges.length > 200, 'edge count > 200, got '+edges.length);

  // 2. 每个节点有 disc / year / baseX / baseY（力导向布局已由 seedPositions 赋初值）
  let bad=0;
  nodes.forEach(n=>{ if(!n.disc||n.year===undefined||!isFinite(n.baseX)||!isFinite(n.baseY)) bad++; });
  ok(bad===0, 'nodes missing disc/year/position: '+bad);

  // 3. 学科分布
  const discCount={}; nodes.forEach(n=>discCount[n.disc]=(discCount[n.disc]||0)+1);
  ok(discCount.soc===102, 'soc count 102, got '+(discCount.soc||0));
  ok(discCount.econ===40, 'econ count 40, got '+(discCount.econ||0));
  ok(discCount.psy===40, 'psy count 40, got '+(discCount.psy||0));

  // 4. 跨学科边存在
  const cross = edges.filter(e=>{ const a=getNode(e.from), b=getNode(e.to); return a && b && a.disc!==b.disc; });
  ok(cross.length >= 10, 'cross-discipline edges >=10, got '+cross.length);

  // 5. 年份范围合理
  const yrs = nodes.map(n=>n.year);
  ok(Math.min(...yrs) >= 1700 && Math.max(...yrs) <= 2025, 'year range sane: '+Math.min(...yrs)+'-'+Math.max(...yrs));

  // 6. draw() 无异常
  let drawErr=null; try { draw(); } catch(e){ drawErr=e.message; }
  ok(!drawErr, 'draw() threw: '+drawErr);

  // 7. isNodeVisible 学科过滤
  activeDiscipline='econ';
  const vis = nodes.filter(isNodeVisible).every(n=>n.disc==='econ');
  ok(vis, 'discipline filter isolates econ');
  activeDiscipline='all';

  console.log('\\nRESULT: '+pass+' passed, '+fail+' failed');
  globalThis.__fail = fail;
})();
`;

try {
  vm.runInNewContext(code + assertions, sandbox, { timeout: 8000 });
} catch (e) {
  console.error('RUN ERROR:', e.message);
  process.exit(1);
}
process.exit(sandbox.__fail ? 1 : 0);
