// v1.12 动效治理校验：沉降时长 + 时间轴预置 X（杜绝贴边聚集）+ N 自适应扩展可靠性
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync('sociology-map.html', 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const code = fs.readFileSync('news-data.js', 'utf8') + '\n' + scripts.join('\n');

const noop = () => {};
const grad = { addColorStop: noop };
const ctx = new Proxy(
  { createLinearGradient: () => grad, createRadialGradient: () => grad, measureText: () => ({ width: 10 }) },
  { get: (t, p) => (p in t ? t[p] : noop), set: (t, p, v) => { t[p] = v; return true; } }
);
function el() {
  return {
    classList: { add: noop, remove: noop, contains: () => false },
    addEventListener: noop, style: {}, innerHTML: '', textContent: '',
    appendChild: noop, dataset: {}, clientWidth: 1000, clientHeight: 600,
    querySelector: () => el(), querySelectorAll: () => [], getContext: () => ctx,
    getBoundingClientRect: () => ({ width: 1000, height: 600 }),
    parentElement: { getBoundingClientRect: () => ({ width: 1000, height: 600 }) }
  };
}
const sb = {
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Proxy,
  setTimeout: () => 0, clearTimeout: () => 0, requestAnimationFrame: () => 0, cancelAnimationFrame: () => 0,
  document: {
    getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [],
    createElement: () => el(), body: el(), addEventListener: noop
  }
};
sb.window = sb; sb.globalThis = sb; sb.addEventListener = noop; sb.window.addEventListener = noop;

const harness = `
// 统计（运行于沙箱内，可直接访问 nodes/effR/yearToX/W）
function stats() {
  let wrongClamp = 0, edgeClamp = 0, xmin = 1e9, xmax = -1e9; const offs = [];
  nodes.forEach(n => {
    if (!Number.isFinite(n.year)) return;
    const m = effR(n) + 6;
    const tx = yearToX(n.year) * W;
    if (n.baseX <= m + 0.5 || n.baseX >= W - m - 0.5) {
      edgeClamp++;
      // 真正要杜绝的旧 bug：目标 X 在中间却因 overshoot 被夹到画布边缘（错置）。
      // 年份=2000/1723 等边界年份节点被夹在边缘属正常放置（目标本就靠边），不计。
      if (Math.abs(n.baseX - tx) > 80) wrongClamp++;
    }
    xmin = Math.min(xmin, n.baseX); xmax = Math.max(xmax, n.baseX);
    offs.push(Math.abs(n.baseX - tx));
  });
  offs.sort((a, b) => a - b);
  const medOff = offs.length ? +offs[Math.floor(offs.length / 2)].toFixed(1) : 0;
  return { wrongClamp, edgeClamp, xspan: +(xmax - xmin).toFixed(1), medOff, W };
}

// ---- 基础规模 ----
initNodes();
const N = nodes.length;
const decay0 = ALPHA_DECAY, alpha0 = alpha;
let settle = -1;
for (let i = 0; i < 2000; i++) { tick(); if (alpha <= 0.04) { settle = i; break; } }

// 时间轴：忠实复刻开关 handler（预置 X 到位）
timeAxisOn = true;
nodes.forEach(n => { if (Number.isFinite(n.year)) n.baseX = yearToX(n.year) * W; n.vx = 0; n.vy = 0; });
reheat(0.4);
const founders = ['econ_smith','saint_simon','econ_malthus','econ_ricardo','comte'];
const pre = {}; founders.forEach(id => { const n = getNode(id); pre[id] = +(yearToX(n.year) * W).toFixed(2); });
for (let i = 0; i < 400; i++) tick();
const st = stats();
const out = founders.map(id => { const n = getNode(id); return { id, year: n.year, bx: +n.baseX.toFixed(1), tgt: pre[id], x1800: +(yearToX(1800) * W).toFixed(1) }; });
globalThis.__r1 = JSON.stringify({ N, decay0, alpha0, settle, st, out });

// ---- 扩展规模：CONCEPTS 扩到 ~3x 再 initNodes ----
const fakeCount = nodes.length * 2;
for (let k = 0; k < fakeCount; k++) { CONCEPTS.push({ id: '_ext_' + k, name: 'E' + k, era: 'con', disc: 'soc', years: '' }); }
initNodes();
const N3 = nodes.length;
const decay3 = ALPHA_DECAY, alpha3 = alpha;
timeAxisOn = true;
nodes.forEach(n => { if (Number.isFinite(n.year)) n.baseX = yearToX(n.year) * W; n.vx = 0; n.vy = 0; });
reheat(0.4);
for (let i = 0; i < 400; i++) tick();
const st3 = stats();
const f3 = ['econ_smith','saint_simon'];
const out3 = f3.map(id => { const n = getNode(id); return { id, bx: +n.baseX.toFixed(1), tgt: +(yearToX(n.year) * W).toFixed(2), x1800: +(yearToX(1800) * W).toFixed(1) }; });
globalThis.__r3 = JSON.stringify({ N3, decay3, alpha3, st3, out3 });
`;
vm.runInNewContext(code + '\n' + harness, sb, { timeout: 60000 });

const r1 = JSON.parse(sb.__r1), r3 = JSON.parse(sb.__r3);
let fails = 0;
function ok(c, m) { if (c) console.log('  ✓ ' + m); else { console.log('  ✗ ' + m); fails++; } }

console.log('=== 基础规模 (N=' + r1.N + ') ===');
console.log('  ALPHA_DECAY=' + r1.decay0 + '  alpha0=' + r1.alpha0 + '  沉降帧数(settle, alpha→0.04)=' + r1.settle + '  (~' + (r1.settle / 60).toFixed(2) + 's @60fps)');
ok(r1.settle > 0 && r1.settle <= 45, '沉降 ≤ ~0.75s（目标 ≤40 帧）→ 进入页面不长时间乱动');
console.log('  时间轴收敛后：wrongClamp=' + r1.st.wrongClamp + ' (边界年份正常夹取 edgeClamp=' + r1.st.edgeClamp + ')  X跨度=' + r1.st.xspan + '/' + r1.st.W + '  年份带中位偏移=' + r1.st.medOff + 'px（软约束固有抖动，非回归）');
ok(r1.st.wrongClamp === 0, '无节点被错置夹取到画布边缘（杜绝贴角/贴边聚集）');
ok(r1.st.xspan > 0.6 * r1.st.W, 'X 铺满画布（跨度>' + (0.6 * r1.st.W).toFixed(0) + '）→ 未塌缩到角落');
const smith = r1.out.find(o => o.id === 'econ_smith');
ok(smith.bx < smith.x1800 - 30, '最早创始人 econ_smith(1723) 明显在 1800 刻度左侧 (bx=' + smith.bx + ' < ' + smith.x1800 + ')');
console.log('  早期创始人：');
r1.out.forEach(n => console.log('    ' + n.id + '(' + n.year + '): baseX=' + n.bx + ' target=' + n.tgt + ' x1800=' + n.x1800));

console.log('=== 扩展规模 (N=' + r3.N3 + ', ~3x) ===');
console.log('  ALPHA_DECAY=' + r3.decay3.toFixed(4) + '  alpha3=' + r3.alpha3 + '  wrongClamp=' + r3.st3.wrongClamp + ' (edgeClamp=' + r3.st3.edgeClamp + ')  X跨度=' + r3.st3.xspan + '/' + r3.st3.W + '  中位偏移=' + r3.st3.medOff + 'px');
ok(r3.decay3 < r1.decay0, '大图冷却更慢(decay ' + r1.decay0 + '→' + r3.decay3.toFixed(4) + ')，给更多迭代预算');
ok(r3.alpha3 > r1.alpha0, '大图初始温度更高(alpha ' + r1.alpha0 + '→' + r3.alpha3 + ')，收敛更充分');
ok(r3.decay3 <= 0.12 && r3.alpha3 <= 0.7, '自适应上限生效(decay≤0.12, alpha≤0.7)');
ok(r3.st3.wrongClamp === 0, '大图时间轴无误置贴边聚集');
ok(r3.st3.xspan > 0.6 * r3.st3.W, '大图 X 仍铺满画布');
const smith3 = r3.out3.find(o => o.id === 'econ_smith');
ok(smith3.bx < smith3.x1800 - 30, '大图最早创始人 econ_smith 仍在 1800 左侧 (bx=' + smith3.bx + ' < ' + smith3.x1800 + ')');
console.log('  早期创始人：');
r3.out3.forEach(n => console.log('    ' + n.id + ': baseX=' + n.bx + ' target=' + n.tgt + ' x1800=' + n.x1800));

console.log('\n' + (fails === 0 ? '✅ 全部通过' : '❌ 失败 ' + fails + ' 项'));
process.exit(fails ? 1 : 0);
