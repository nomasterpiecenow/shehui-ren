const fs = require('fs'); const vm = require('vm');
const html = fs.readFileSync('sociology-map.html', 'utf8');
let scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
let code = fs.readFileSync('news-data.js', 'utf8') + '\n' + scripts.join('\n');
code = code.replace('let timeAxisOn = false;', 'let timeAxisOn = true;');
const noop = () => {};
const grad = { addColorStop: noop };
const ctx = new Proxy({ createLinearGradient: () => grad, createRadialGradient: () => grad, measureText: () => ({ width: 10 }) }, { get: (t, p) => (p in t ? t[p] : noop), set: (t, p, v) => { t[p] = v; return true; } });
function el() { return { classList: { add: noop, remove: noop, contains: () => false }, addEventListener: noop, style: {}, innerHTML: '', textContent: '', appendChild: noop, dataset: {}, clientWidth: 1000, clientHeight: 600, querySelector: () => el(), querySelectorAll: () => [], getContext: () => ctx, getBoundingClientRect: () => ({ width: 1000, height: 600 }), parentElement: { getBoundingClientRect: () => ({ width: 1000, height: 600 }) } }; }
const sb = { console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Proxy, setTimeout: () => 0, clearTimeout: () => 0, requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0, document: { getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], createElement: () => el(), body: el(), addEventListener: noop } };
sb.window = sb; sb.globalThis = sb; sb.addEventListener = noop; sb.window.addEventListener = noop;

const extra = `
initNodes();
for (let i = 0; i < 600; i++) tick();
const pre = nodes.filter(n => Number.isFinite(n.year) && n.year < 1800)
  .map(n => n.id + '(' + n.year + ',bx=' + Math.round(n.baseX) + ')');
const ticks = [];
for (let yr = YEAR_MIN; yr <= YEAR_MAX; yr += 50) {
  if (YEAR_NODES.some(y => y >= yr && y < yr + 50)) ticks.push(yr);
}
const founders = ['saint_simon','comte','tocqueville','spencer'];
const f = founders.map(id => {
  const n = nodes.find(x => x.id === id);
  const w = (n.data && n.data.wiki) || n.wiki || '';
  return id + ':' + (w ? 'wikiOK' : 'NOWIKI');
});
globalThis.__out = JSON.stringify({ ymin: YEAR_MIN, ymax: YEAR_MAX, ticks, pre, founders: f });
`;
vm.runInNewContext(code + extra, sb, { timeout: 15000 });
const o = JSON.parse(sb.__out);
console.log('YEAR_MIN/MAX:', o.ymin, o.ymax);
console.log('DRAWN TICKS (bands with nodes):', JSON.stringify(o.ticks));
console.log('PRE-1800 NODES:', JSON.stringify(o.pre));
console.log('NEW FOUNDERS:', JSON.stringify(o.founders));
