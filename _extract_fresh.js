const fs = require('fs');
const html = fs.readFileSync('sociology-map.html', 'utf8');
const names = ['THINKERS','THEORIES','CONCEPTS','TOPICS','ECON_THINKERS','ECON_THEORIES','ECON_CONCEPTS','ECON_TOPICS','PSY_THINKERS','PSY_THEORIES','PSY_CONCEPTS','PSY_TOPICS'];
const map = {};
for (const n of names) {
  const re = new RegExp('const\\s+' + n + '\\s*=\\s*\\[', 'g');
  const m = re.exec(html);
  if (!m) { console.error('MISS ' + n); continue; }
  let i = re.lastIndex - 1, depth = 0, end = -1;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = j; break; } }
  }
  const seg = html.slice(i, end + 1);
  const rr = /id:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'/g;
  let mm, cnt = 0;
  while ((mm = rr.exec(seg))) { map[mm[1]] = mm[2]; cnt++; }
  console.error(n + ': ' + cnt);
}
console.error('TOTAL: ' + Object.keys(map).length);
fs.writeFileSync('_node_map_fresh.json', JSON.stringify({ count: Object.keys(map).length, map }, null, 1));
