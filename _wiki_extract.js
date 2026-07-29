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
const ctxSb = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Proxy,
  setTimeout:()=>0, clearTimeout:()=>0,
  requestAnimationFrame:()=>0, cancelAnimationFrame:()=>0,
  document: { getElementById:()=>elStub(), querySelector:()=>elStub(), querySelectorAll:()=>[], createElement:()=>elStub(), body:elStub(), addEventListener:()=>{} },
};
ctxSb.window = ctxSb; ctxSb.window.addEventListener = () => {}; ctxSb.globalThis = ctxSb;

const dump = `
;(function(){
  initNodes();
  const out = nodes.map(n=>({ id:n.id, name:n.name||n.label||(n.data&&n.data.name)||'', en:n.en||(n.data&&n.data.en)||'', cat:n.cat, disc:n.disc, wiki:(n.data&&n.data.wiki)||'' }));
  globalThis.__out = JSON.stringify(out);
  globalThis.__keys = Object.keys(nodes[0]).join(',');
})();
`;
vm.runInNewContext(code + dump, ctxSb, { timeout: 8000 });
fs.writeFileSync('_wiki_list.json', ctxSb.__out);
const arr = JSON.parse(ctxSb.__out);
const withWiki = arr.filter(n=>n.wiki);
console.log('node keys:', ctxSb.__keys);
console.log('total nodes:', arr.length, 'with wiki:', withWiki.length, 'without:', arr.length-withWiki.length);
console.log('name populated:', arr.filter(n=>n.name).length);
