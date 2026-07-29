// 引用完整性检查：把所有「被引用」的节点 id 对照「已定义」的 id，揪出幽灵引用（被引用但未定义 → addE 静默丢弃）。
const fs = require('fs');
const html = fs.readFileSync('sociology-map.html', 'utf8');

const defs = new Set();
let m, re = /id:'((?:[^'\\]|\\.)*)'/g;
while ((m = re.exec(html))) defs.add(m[1]);

const refs = new Set();
const strip = s => s.trim().replace(/^'|'$/g, '');
// influence:'a,b,c'
let ri = /influence:'((?:[^'\\]|\\.)*)'/g;
while ((m = ri.exec(html))) m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(t => refs.add(t));
// 二元边数组 [ 'a','b',0.5 ]
function edgesOf(name) {
  const seg = html.match(new RegExp('const ' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\];'));
  if (!seg) return;
  const r = /\[\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'/g;
  let x;
  while ((x = r.exec(seg[1]))) { refs.add(x[1]); refs.add(x[2]); }
}
['CROSS_EDGES', 'EXTRA_EDGES', 'THINKER_LINKS', 'EXTRA_CONCEPT_LINKS', 'CONCEPT_LINKS'].forEach(edgesOf);
// TOPIC_THEORIES 系：值数组里的理论 id
['TOPIC_THEORIES', 'ECON_TOPIC_THEORIES', 'PSY_TOPIC_THEORIES'].forEach(name => {
  const seg = html.match(new RegExp('const ' + name + '\\s*=\\s*\\{([\\s\\S]*?)\\};'));
  if (!seg) return;
  const r = /\[([\s\S]*?)\]/g; let y;
  while ((y = r.exec(seg[1]))) y[1].split(',').forEach(p => { const t = strip(p); if (t && /^[a-z]/.test(t) && !/^https/.test(t)) refs.add(t); });
});
// 理论对象里的 keyThinkers / concepts
let rk = /keyThinkers:\s*\[([^\]]*)\]/g; while ((m = rk.exec(html))) m[1].split(',').forEach(p => { const t = strip(p); if (t) refs.add(t); });
let rc = /concepts:\s*\[([^\]]*)\]/g; while ((m = rc.exec(html))) m[1].split(',').forEach(p => { const t = strip(p); if (t) refs.add(t); });

const missing = [...refs].filter(r => !defs.has(r)).sort();
console.log('已定义 id 数:', defs.size);
console.log('被引用唯一 id 数:', refs.size);
console.log('幽灵引用（被引用但未定义）:', missing.length);
console.log(missing.join('\n') || '（无）');
