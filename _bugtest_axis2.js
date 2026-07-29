const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const file = 'D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/sociology-map.html';
let html = fs.readFileSync(file, 'utf8');

// 去掉外链脚本（news-data.js 在 jsdom 里不会自动执行且会抛 NEWS_DATA 未定义）
html = html.replace(/<script src="news-data\.js"><\/script>/, '<script>var NEWS_DATA=[];<\/script>');

const ctxStub = new Proxy({}, {
  get(_t, prop) {
    if (prop === 'measureText') return () => ({ width: 10 });
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
      return (...args) => { if (!args.every(Number.isFinite)) throw new Error('IndexSizeError: non-finite gradient'); return { addColorStop() {} }; };
    if (prop === 'canvas') return { width: 1000, height: 700 };
    return () => {};
  },
  set() { return true; }
});

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {};
    window.HTMLCanvasElement.prototype.getContext = function () { return ctxStub; };
    Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', { get() { return 1000; } });
    Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', { get() { return 700; } });
  }
});

const w = dom.window;
function g(expr) { try { return w.eval(expr); } catch (e) { return 'ERR:' + e.message; } }

setTimeout(() => {
  const before = g('activeDiscipline');
  const visBefore = g('(typeof isNodeVisible==="function") ? nodes.filter(isNodeVisible).length : "noFn"');
  const total = g('nodes.length');

  // 模拟点击「时间轴」按钮
  const btn = w.document.getElementById('axisToggle');
  btn.dispatchEvent(new w.window.Event('click', { bubbles: true }));

  const afterDisc = g('activeDiscipline');
  const axisOn = g('timeAxisOn');
  const visAfter = g('(typeof isNodeVisible==="function") ? nodes.filter(isNodeVisible).length : "noFn"');

  console.log('=== 点时间轴之前 ===');
  console.log('  activeDiscipline =', JSON.stringify(before), '| 总节点 =', total, '| 可见 =', visBefore);
  console.log('=== 点时间轴之后 ===');
  console.log('  timeAxisOn =', axisOn, '| activeDiscipline =', JSON.stringify(afterDisc), '| 可见 =', visAfter);

  // 默认仅概念类可见（58），判据是：点时间轴后学科筛选未被反选、可见数不归零、不增不减
  const ok = (afterDisc === 'all') && (axisOn === true) && (visAfter > 0) && (visAfter === visBefore);
  console.log('\n结果:', ok ? '✅ 修复生效：点时间轴后学科筛选未被反选，可见节点保持 ' + visAfter + '（未空白）' : '❌ 仍异常');
  process.exit(ok ? 0 : 1);
}, 300);
