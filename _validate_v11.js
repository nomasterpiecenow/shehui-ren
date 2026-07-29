const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('sociology-map.html', 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const newsCode = fs.readFileSync('news-data.js', 'utf8');
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
const ctxSb = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Proxy,
  setTimeout:()=>0, clearTimeout:()=>0,
  requestAnimationFrame:()=>0, cancelAnimationFrame:()=>0,
  document: { getElementById:()=>elStub(), querySelector:()=>elStub(), querySelectorAll:()=>[], createElement:()=>elStub(), body:elStub(), addEventListener:()=>{} },
};
ctxSb.window = ctxSb; ctxSb.window.addEventListener = () => {}; ctxSb.globalThis = ctxSb;

const assertions = `
;(function(){
  let pass=0, fail=0;
  function ok(c,m){ if(c){pass++;} else {fail++; console.log('  X '+m);} }

  initNodes();

  // 1. 学科分布（动态）
  const dc={}; nodes.forEach(n=>dc[n.disc]=(dc[n.disc]||0)+1);
  console.log('  disc:', JSON.stringify(dc), 'total', nodes.length);
  ok(dc.econ>=100, 'econ >=100, got '+(dc.econ||0));
  ok(dc.psy>=100, 'psy >=100, got '+(dc.psy||0));
  ok(dc.soc>=102, 'soc >=102, got '+(dc.soc||0));

  // 2. 无重复 id
  const ids={}; let dup=0; const dups=[];
  nodes.forEach(n=>{ if(ids[n.id]){dup++;dups.push(n.id);} ids[n.id]=1; });
  ok(dup===0, 'duplicate node ids: '+dup+' ['+dups.slice(0,8).join(',')+']');

  // 3. 无悬空边（两端都能解析成节点）
  let dangling=0; const dl=[];
  edges.forEach(e=>{ if(!getNode(e.from)||!getNode(e.to)){dangling++; dl.push(e.from+'->'+e.to);} });
  ok(dangling===0, 'dangling edges: '+dangling+' ['+dl.slice(0,10).join(', ')+']');

  // 4. 无孤立节点（每个节点至少有一条边）
  const deg={}; edges.forEach(e=>{ deg[e.from]=(deg[e.from]||0)+1; deg[e.to]=(deg[e.to]||0)+1; });
  const orphans = nodes.filter(n=>!deg[n.id]).map(n=>n.id);
  console.log('  edges:', edges.length, ' orphans:', orphans.length, orphans.length?('['+orphans.slice(0,15).join(',')+']'):'');
  ok(orphans.length===0, 'orphan nodes: '+orphans.length);

  // 5. 跨学科边
  const cross = edges.filter(e=>{ const a=getNode(e.from),b=getNode(e.to); return a&&b&&a.disc!==b.disc; });
  ok(cross.length>=15, 'cross edges >=15, got '+cross.length);

  // 6. 年份范围
  const yrs=nodes.map(n=>n.year).filter(Number.isFinite);
  console.log('  year range:', Math.min(...yrs), '-', Math.max(...yrs));
  ok(Math.min(...yrs)>=1700 && Math.max(...yrs)<=2025, 'year sane');

  // 7. draw 无异常
  let de=null; try{ draw(); }catch(e){ de=e.message; }
  ok(!de, 'draw() threw: '+de);

  // 8. 学科筛选隔离
  activeDiscipline='psy';
  ok(nodes.filter(isNodeVisible).every(n=>n.disc==='psy'), 'psy filter isolates');
  activeDiscipline='all';

  console.log('\\nRESULT: '+pass+' passed, '+fail+' failed');
  globalThis.__fail=fail;
})();
`;

try { vm.runInNewContext(code + assertions, ctxSb, { timeout: 8000 }); }
catch (e) { console.error('RUN ERROR:', e.message); process.exit(1); }
process.exit(ctxSb.__fail ? 1 : 0);
