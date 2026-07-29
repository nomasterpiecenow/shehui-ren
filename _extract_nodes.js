// Extract node sets from sociology-map.html -> id->name map (authoritative)
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
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

const map = {};        // id -> {name, type}
const byType = {};     // type -> [ids]
for (const name of NAMES) {
  const block = extractBlock(html, name);
  if (!block) { console.error('MISSING', name); continue; }
  const type = name.replace(/_/g, ' ').toLowerCase();
  const re = /id:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    const id = m[1], nm = m[2];
    if (map[id] && map[id].name !== nm) {
      console.error('DUP id conflict:', id, map[id].name, nm);
    }
    map[id] = { name: nm, type: name };
    (byType[name] = byType[name] || []).push(id);
  }
}

fs.writeFileSync('D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/_node_map.json',
  JSON.stringify({ count: Object.keys(map).length, map, byType }, null, 2));

console.log('TOTAL NODES:', Object.keys(map).length);
for (const name of NAMES) console.log(name, '=>', (byType[name] || []).length);
