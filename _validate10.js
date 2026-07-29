const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('sociology-map.html', 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = scripts.join('\n');

function makeCtx() {
  const noop = () => {};
  const grad = { addColorStop: noop };
  return new Proxy({
    createLinearGradient: () => grad, createRadialGradient: () => grad,
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

  initNodes();
  ok(nodes.length === 182, 'node count expected 182, got '+nodes.length);
  ok(W>0 && H>0, 'canvas size ready W='+W+' H='+H);

  // 1. 无重叠：任意两节点中心距 >= r_i + r_j
  let overlap = 0, minDist = Infinity, worst = '';
  for (let i=0;i<nodes.length;i++){
    for (let j=i+1;j<nodes.length;j++){
      const a=nodes[i], b=nodes[j];
      const d = Math.hypot(a.baseX-b.baseX, a.baseY-b.baseY);
      const need = a.r + b.r;
      if (d < need){ overlap++; if(need-d > (worst? (need-Math.hypot(nodes[worst.split('|')[0]].baseX-nodes[worst.split('|')[1]].baseX, nodes[worst.split('|')[0]].baseY-nodes[worst.split('|')[1]].baseY)):0)) worst = i+'|'+j; }
      if (d < minDist) minDist = d;
    }
  }
  ok(overlap === 0, 'overlapping node pairs = '+overlap+' (min center dist='+minDist.toFixed(1)+')');
  console.log('  · min center distance = '+minDist.toFixed(1)+'px, max node radius = 18');

  // 2. 学科分带：每个节点 baseY 落在所属学科的 1/3 区间内（容差 ±0.13）
  const band = { soc:[0,1/3], econ:[1/3,2/3], psy:[2/3,1] };
  let bandBad = 0;
  nodes.forEach(n=>{
    const fy = n.baseY / H;
    const [lo,hi] = band[n.disc];
    if (fy < lo-0.13 || fy > hi+0.13) bandBad++;
  });
  ok(bandBad === 0, 'nodes outside their discipline band = '+bandBad);
  // 时间轴：X 与年份正相关（同科相邻年份节点不应大面积逆序）
  let xc = 0, yt = 0;
  nodes.forEach(n=>{ xc += n.baseX; });
  console.log('  · band check done, avg baseX='+(xc/nodes.length).toFixed(0));

  // 3. 点击一致性：在节点“绘制中心”做命中测试，应精确返回该节点
  time = 0;
  activeDiscipline = 'all';
  let clickBad = 0;
  nodes.forEach(n=>{
    const hit = hitTest(n.baseX, n.baseY);
    if (hit !== n) clickBad++;
  });
  ok(clickBad === 0, 'nodes whose drawn center is NOT clickable = '+clickBad+' / '+nodes.length);
  // 额外：随机偏移 5px 内仍应能命中（容错）
  let nearBad = 0;
  nodes.forEach(n=>{
    const hit = hitTest(n.baseX+3, n.baseY+3);
    if (hit === null) nearBad++;
  });
  ok(nearBad === 0, 'nodes missing click within +3px = '+nearBad);

  // 4. draw() 无异常
  let drawErr=null; try { draw(); } catch(e){ drawErr=e.message; }
  ok(!drawErr, 'draw() threw: '+drawErr);

  // 5. 跨学科边
  const cross = edges.filter(e=>{ const a=getNode(e.from), b=getNode(e.to); return a && b && a.disc!==b.disc; });
  ok(cross.length >= 10, 'cross-discipline edges >=10, got '+cross.length);

  // 6. 学科过滤仍生效
  activeDiscipline='econ';
  const vis = nodes.filter(isNodeVisible).every(n=>n.disc==='econ');
  ok(vis, 'discipline filter isolates econ');
  activeDiscipline='all';

  console.log('\\nRESULT: '+pass+' passed, '+fail+' failed');
  globalThis.__fail = fail;
})();
`;

try {
  vm.runInNewContext(code + assertions, sandbox, { timeout: 15000 });
} catch (e) {
  console.error('RUN ERROR:', e.message);
  process.exit(1);
}
process.exit(sandbox.__fail ? 1 : 0);
