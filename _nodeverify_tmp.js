const fs = require('fs');
const path = 'D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/sociology-map.html';
const html = fs.readFileSync(path, 'utf8');
const NAMES = ['THINKERS','THEORIES','CONCEPTS','TOPICS','ECON_THINKERS','ECON_THEORIES','ECON_CONCEPTS','ECON_TOPICS','PSY_THINKERS','PSY_THEORIES','PSY_CONCEPTS','PSY_TOPICS'];
function extractBlock(src, name) {
  const start = src.indexOf('const ' + name + ' = [');
  if (start < 0) return null;
  let i = src.indexOf('[', start);
  let depth = 0, inStr = false, strCh = '';
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) { if (c === '\\') { i++; continue; } if (c === strCh) inStr = false; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}
const map = {};
for (const name of NAMES) {
  const block = extractBlock(html, name);
  if (!block) { console.error('MISSING', name); continue; }
  const re = /id:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(block)) !== null) { map[m[1]] = m[2]; }
}
console.log('TOTAL', Object.keys(map).length);
const suspects = ['capital_forms','reflexivity','digital','urbanization','rationalization','rationalization_theory','rationalization_concept','social_work','consumption','aging','precariat','psy_attachment','econ_welfare','institutionalism','technology'];
for (const s of suspects) console.log(s, s in map ? 'OK='+map[s] : 'MISSING');
fs.writeFileSync('D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/_node_map_verify.json', JSON.stringify(map));
