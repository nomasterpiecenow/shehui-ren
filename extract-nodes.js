// extract-nodes.js — 本地(免费)预抽取社科节点词表，避免自动化每次把整套
// sociology-map.html(386KB) 读进 AI 上下文造成 token 浪费。
// 用法: node extract-nodes.js  → 生成 node-index.json（仅 id→name 映射，约 10KB）
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const html = fs.readFileSync(path.join(ROOT, 'sociology-map.html'), 'utf8');

const ARRAYS = ['THINKERS','THEORIES','CONCEPTS','TOPICS',
  'ECON_THINKERS','ECON_THEORIES','ECON_CONCEPTS','ECON_TOPICS',
  'PSY_THINKERS','PSY_THEORIES','PSY_CONCEPTS','PSY_TOPICS'];

// 用 JS 引擎解析数组文本（稳健处理嵌套括号），只取 id/name
function extractArray(name) {
  const start = html.indexOf('const ' + name + ' = [');
  if (start < 0) { console.error('未找到数组: ' + name); return []; }
  const open = html.indexOf('[', start);
  let depth = 0, j = open;
  for (; j < html.length; j++) {
    if (html[j] === '[') depth++;
    else if (html[j] === ']') { depth--; if (depth === 0) { j++; break; } }
  }
  const body = html.slice(open, j); // 含首尾 []
  try {
    const arr = (new Function('return ' + body + ';'))();
    return arr.map(o => ({ id: o.id, name: o.name })).filter(o => o.id && o.name);
  } catch (e) {
    console.error('解析失败 ' + name + ': ' + e.message);
    return [];
  }
}

const map = {};
const byArray = {};
let dup = 0;
for (const a of ARRAYS) {
  const items = extractArray(a);
  byArray[a] = items.map(it => it.id);
  for (const it of items) {
    if (map[it.id] && map[it.id] !== it.name) dup++;
    map[it.id] = it.name;
  }
}
const out = { generatedAt: new Date().toISOString(), count: Object.keys(map).length, arrays: byArray, map };
fs.writeFileSync(path.join(ROOT, 'node-index.json'), JSON.stringify(out));
console.log('已抽取 ' + out.count + ' 个节点 → node-index.json' + (dup ? ' (警告: ' + dup + ' 个 id 跨数组重名)' : ''));
