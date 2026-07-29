// v1.13 混合度 + 心理学跨科连通性校验
// 1) 进入页面(全学科)布局应「混在一起」，而非「社会学上/经济学中/心理学下」三横带
// 2) 心理学节点应与其余两学科存在实质跨科边（修复 socialization 幽灵引用 + 补建桥接后）
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('sociology-map.html', 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = fs.readFileSync('news-data.js', 'utf8') + '\n' + scripts.join('\n');

const noop = () => {};
const grad = { addColorStop: noop };
const ctx = new Proxy(
  { createLinearGradient: () => grad, createRadialGradient: () => grad, measureText: () => ({ width: 10 }) },
  { get: (t, p) => (p in t ? t[p] : noop), set: (t, p, v) => { t[p] = v; return true; } }
);
function el() {
  return {
    classList: { add: noop, remove: noop, contains: () => false },
    addEventListener: noop, style: {}, innerHTML: '', textContent: '',
    appendChild: noop, dataset: {}, clientWidth: 1000, clientHeight: 600,
    querySelector: () => el(), querySelectorAll: () => [], getContext: () => ctx,
    getBoundingClientRect: () => ({ width: 1000, height: 600 }),
    parentElement: { getBoundingClientRect: () => ({ width: 1000, height: 600 }) }
  };
}
const sb = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Proxy,
  setTimeout: () => 0, clearTimeout: () => 0, requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0,
  document: { getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(), body: el(), addEventListener: noop }
};
sb.window = sb; sb.globalThis = sb; sb.addEventListener = noop; sb.window.addEventListener = noop;

const harness = `
function pct(arr, p){ const a=[...arr].sort((x,y)=>x-y); const i=Math.max(0,Math.min(a.length-1,Math.floor(p*(a.length-1)))); return a[i]; }
initNodes();
// 进入页面默认全学科：跑足够帧让布局收敛（约 2.5s）
for (let i=0;i<160;i++) tick();
const discs=['soc','econ','psy'];
const stat={};
discs.forEach(d=>{
  const ys=nodes.filter(n=>n.disc===d).map(n=>n.baseY);
  stat[d]={ min:pct(ys,0), p10:pct(ys,0.1), p90:pct(ys,0.9), max:pct(ys,1), med:pct(ys,0.5), n:ys.length };
});
// 跨科边统计
let cross=0, psyCross=0;
edges.forEach(e=>{ const a=getNode(e.from), b=getNode(e.to); if(!a||!b) return; if(a.disc!==b.disc){ cross++; if(a.disc==='psy'||b.disc==='psy') psyCross++; } });
// socialization 节点的实际度数（验证幽灵引用已修复）
const sz=getNode('socialization');
let szDeg=0, szPsy=0;
if(sz){ edges.forEach(e=>{ if(e.from==='socialization'||e.to==='socialization'){ szDeg++; const o=e.from==='socialization'?e.to:e.from; if(getNode(o)&&getNode(o).disc==='psy') szPsy++; } }); }
globalThis.__mix=JSON.stringify({ N:nodes.length, stat, cross, psyCross, sz: !!sz, szDeg, szPsy });
`;
vm.runInNewContext(code + '\n' + harness, sb, { timeout: 60000 });

const r = JSON.parse(sb.__mix);
let fails = 0;
function ok(c, m) { if (c) console.log('  ✓ ' + m); else { console.log('  ✗ ' + m); fails++; } }

console.log('=== 节点规模 N=' + r.N + ' ===');
console.log('  社会学 Y:[min=' + r.stat.soc.min.toFixed(0) + ' p10=' + r.stat.soc.p10.toFixed(0) + ' p90=' + r.stat.soc.p90.toFixed(0) + ' max=' + r.stat.soc.max.toFixed(0) + ']  n=' + r.stat.soc.n);
console.log('  经济学 Y:[min=' + r.stat.econ.min.toFixed(0) + ' p10=' + r.stat.econ.p10.toFixed(0) + ' p90=' + r.stat.econ.p90.toFixed(0) + ' max=' + r.stat.econ.max.toFixed(0) + ']  n=' + r.stat.econ.n);
console.log('  心理学 Y:[min=' + r.stat.psy.min.toFixed(0) + ' p10=' + r.stat.psy.p10.toFixed(0) + ' p90=' + r.stat.psy.p90.toFixed(0) + ' max=' + r.stat.psy.max.toFixed(0) + ']  n=' + r.stat.psy.n);

// 混合判据：三学科 Y 的 p10/p90 应相互重叠（无干净间隙），即非「上中下」三横带
const socEconOverlap = r.stat.soc.p90 >= r.stat.econ.p10;
const econPsyOverlap = r.stat.econ.p90 >= r.stat.psy.p10;
const socPsyOverlap = r.stat.soc.p90 >= r.stat.psy.p10;
ok(socEconOverlap, '社会学与经济学 Y 区间重叠（无干净间隙）→ 未分带');
ok(econPsyOverlap, '经济学与心理学 Y 区间重叠（无干净间隙）→ 未分带');
ok(socPsyOverlap, '社会学与心理学 Y 区间重叠（无干净间隙）→ 未分带');
// 中位数不应单调分离成三横带（混在一起 → 三者中位数相互接近）
const meds = [r.stat.soc.med, r.stat.econ.med, r.stat.psy.med].sort((a,b)=>a-b);
const spanRatio = (meds[2]-meds[0]) / 600;
ok(spanRatio < 0.55, '三科 Y 中位数跨度占画布比=' + spanRatio.toFixed(2) + ' (<0.55 视为混排而非三横带)');

console.log('=== 跨科连通性 ===');
console.log('  全图跨科边=' + r.cross + '  心理学跨科边=' + r.psyCross);
ok(r.cross >= 30, '全图跨科边=' + r.cross + ' (≥30，三科真正成网；其中心理学贡献 ' + r.psyCross + ' 条)');
ok(r.psyCross >= 18, '心理学跨科边=' + r.psyCross + ' (≥18，修复社会化失效 + 补建桥接后不再孤立)');
ok(r.sz === true, '「社会化(socialization)」节点已建');
ok(r.szDeg >= 8, '「社会化」节点度数=' + r.szDeg + ' (≥8，此前 4 条心理学边 + 多位思想家 influence 已复活)');
ok(r.szPsy >= 4, '「社会化」直接连心理学节点数=' + r.szPsy + ' (≥4：从众/依恋/Bandura/Erikson 等)');

console.log('\n' + (fails === 0 ? '✅ 全部通过' : '❌ 失败 ' + fails + ' 项'));
process.exit(fails ? 1 : 0);
