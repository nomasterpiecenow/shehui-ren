/* _test_research.js — 验证「前沿研究」层（v1.16 内嵌于 interpretation/疑问驱动解读）
 * 1) 向 office 新闻(id=3) 某 interpretation 内嵌 research（fromNode='work'），调用 showNewsDetail，断言：
 *    - 新结构渲染（gist / 事件脉络 / 透镜 badge / 疑问 q / 顿悟 aha）
 *    - 该解读内出现「前沿研究（直接相关）」内嵌卡（非顶层独立区块）
 *    - 研究标题/外链/溯源按钮(focusNode('work'))/出处年份渲染
 *    - 顶层不再有独立「🔬 前沿研究」区块
 * 2) 调用 buildDetailHTML('work') 断言节点卡片尾部反向聚合该研究
 * 3) 无 research 的新闻(id=1) 解读内不出现内嵌研究
 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const file = 'D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/sociology-map.html';
const newsFile = 'D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/news-data.js';
const html = fs.readFileSync(file, 'utf8');
const newsCode = fs.readFileSync(newsFile, 'utf8');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail ? (e.detail.stack || e.detail) : e.message)));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.devicePixelRatio = 1; window.innerWidth = 1280; window.innerHeight = 800;
    window.addEventListener('error', e => errors.push('window.error: ' + (e.error ? e.error.stack : e.message)));
    window.addEventListener('unhandledrejection', e => errors.push('unhandledrejection: ' + e.reason));
    const ctxStub = new Proxy({}, { get(t, p) {
      if (p === 'measureText') return () => ({ width: 10 });
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return (...a) => { if (a.some(v => !Number.isFinite(v))) throw new Error('IndexSizeError'); return { addColorStop() {} }; };
      if (p === 'getImageData') return () => ({ data: [] });
      if (p === 'canvas') return { width: 1280, height: 800 };
      if (p in t) return t[p];
      return () => {};
    }, set(t, p, v) { t[p] = v; return true; } });
    try { window.eval(newsCode); } catch (e) { errors.push('news-data eval: ' + e.stack); }
    window.HTMLCanvasElement.prototype.getContext = function () { return ctxStub; };
    window.requestAnimationFrame = function () { return 0; };
    window.cancelAnimationFrame = function () {};
  }
});

const { window } = dom;
const document = window.document;

let fail = 0;
function ok(cond, msg) { if (cond) console.log('  ✓ ' + msg); else { fail++; console.log('  ✗ FAIL: ' + msg); } }

setTimeout(() => {
  try {
    console.log('最新日期 =', window.eval('Object.keys(NEWS_DATA).sort((a,b)=>b.localeCompare(a))[0];'));

    // 注入：在某视角内嵌 research（fromNode='work'），模拟 S9 挂载
    const injected = window.eval(`
      (function(){
        const d = Object.keys(NEWS_DATA).sort((a,b)=>b.localeCompare(a))[0];
        const it = NEWS_DATA[d].find(n=>n.id===3);
        if(!it || !it.interpretations || !it.interpretations.length) return false;
        it.interpretations[0].research = {
          title:'Workplace silence and employee well-being: a daily diary study',
          authors:'Baer et al.', year:2023,
          venue:'Journal of Occupational Health Psychology',
          url:'https://example.org/paper/123',
          summary:'研究发现职场沉默与较低的归属感正相关，长期沉默会削弱团队信任与心理安全。',
          fromNode:'work'
        };
        return true;
      })();
    `);
    ok(injected === true, '向 office 新闻某 interpretation 内嵌 research(源节点 work)');

    // ---- 1) 新闻详情 showNewsDetail(3) ----
    window.eval('showNewsDetail(3);');
    const body = document.getElementById('newsPanelBody').innerHTML;

    // ---- 1b) 新结构渲染（gist / 事件脉络 / 疑问驱动解读）----
    ok(body.includes('dp-gist'), '新结构 gist 立论块渲染');
    ok(body.includes('事件脉络'), '新结构 事件脉络(thread) 渲染');
    ok(body.includes('用「'), '新结构 透镜 badge(用「X」解读) 渲染');
    ok(body.includes('dp-interp-q'), '新结构 疑问驱动 q 渲染');
    ok(body.includes('dp-interp-aha'), '新结构 顿悟 aha 渲染');
    ok(body.includes('前沿研究（直接相关）'), '视角内出现内嵌「前沿研究（直接相关）」');
    ok(body.includes('Workplace silence and employee well-being'), '研究标题渲染');
    ok(body.includes('https://example.org/paper/123'), '研究外链 url 渲染');
    ok(body.includes('溯源 →') && body.includes("focusNode('work')"), '出现「溯源 →」按钮且跳转 fromNode(work)');
    ok(body.includes('Journal of Occupational Health Psychology'), '研究出处/年份渲染');
    ok(!body.includes('>🔬 前沿研究 <'), '顶层不再有独立「🔬 前沿研究」区块（已内嵌视角）');

    // ---- 2) 节点聚合 buildDetailHTML(work) ----
    const nodeHTML = window.eval("buildDetailHTML(getNode('work'),'panel');");
    ok(typeof nodeHTML === 'string' && nodeHTML.includes('🔬 前沿研究'), '节点(work)卡片聚合「🔬 前沿研究」');
    ok(nodeHTML.includes('Workplace silence and employee well-being'), '节点页列出该研究标题');

    // ---- 3) 无 research 的新闻不渲染 ----
    window.eval('showNewsDetail(1);');
    const body2 = document.getElementById('newsPanelBody').innerHTML;
    ok(!body2.includes('前沿研究（直接相关）'), '无 research 的新闻(id=1)视角内不出现内嵌研究');

  } catch (e) {
    errors.push('HARNESS: ' + e.stack);
  }

  console.log('\n################ ERRORS ################');
  if (errors.length === 0) console.log('(none)');
  else errors.forEach(e => console.log('- ' + e));

  console.log('\n========================================');
  console.log(fail === 0 && errors.length === 0 ? '✅ 前沿研究层（内嵌视角）校验通过' : '❌ 存在失败，请修复');
  console.log('========================================');
  process.exit(fail === 0 && errors.length === 0 ? 0 : 1);
}, 400);
