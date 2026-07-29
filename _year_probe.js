const fs = require('fs');
const { JSDOM } = require('jsdom');
const file = 'D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/sociology-map.html';
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/<script src="news-data\.js"><\/script>/, '<script>var NEWS_DATA=[];<\/script>');

const ctxStub = new Proxy({}, { get(_t, p) {
  if (p === 'measureText') return () => ({ width: 10 });
  if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop(){} });
  if (p === 'canvas') return { width: 1000, height: 700 };
  return () => {};
}, set(){ return true; }});

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w){
  w.requestAnimationFrame = () => 0; w.cancelAnimationFrame = () => {};
  w.HTMLCanvasElement.prototype.getContext = function(){ return ctxStub; };
  Object.defineProperty(w.HTMLElement.prototype, 'offsetWidth', { get(){ return 1000; } });
  Object.defineProperty(w.HTMLElement.prototype, 'offsetHeight', { get(){ return 700; } });
}});
const w = dom.window;
setTimeout(() => {
  const nodes = w.eval('nodes');
  const years = nodes.map(n => n.year).filter(Number.isFinite);
  const min = Math.min(...years), max = Math.max(...years);
  console.log('总节点', nodes.length, '| year min', min, 'max', max);
  // distribution by rounded decade
  const dist = {};
  nodes.forEach(n => { const b = Math.round(n.year/10)*10; dist[b] = (dist[b]||0)+1; });
  console.log('年代分布:', Object.keys(dist).sort((a,b)=>a-b).map(k=>k+':'+dist[k]).join('  '));
  // theories only
  const th = nodes.filter(n => n.cat==='theory');
  const thDist = {};
  th.forEach(n => { thDist[n.year]=(thDist[n.year]||0)+1; });
  console.log('理论 year 分布:', JSON.stringify(thDist));
  // theories landing at 2000 (suspect)
  const at2000 = th.filter(n=>n.year===2000).map(n=>n.id+'('+(n.disc||'soc')+')');
  console.log('落在2000的理论('+at2000.length+'):', at2000.join(', '));
}, 300);
