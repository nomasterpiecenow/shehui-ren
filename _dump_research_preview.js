/* _dump_research_preview.js — 把「前沿研究」层的真实渲染导出为独立预览 HTML（v1.16 疑问驱动结构）
 * 1) 调用 showNewsDetail(3)（默认最新日期的办公室新闻，新结构 interpretations[].research 已内嵌真实研究种子）
 * 2) 调用 buildDetailHTML(getNode('work')) 导出节点卡片尾部🔬聚合
 * 复用 _test_research.js 的 jsdom 加载方式，但只导出不做断言
 */
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const file = 'D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/sociology-map.html';
const newsFile = 'D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/news-data.js';
const html = fs.readFileSync(file, 'utf8');
const newsCode = fs.readFileSync(newsFile, 'utf8');

// 抽取主文件 <style> 全文，使导出文件视觉与线上一致
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const styleCss = styleMatch ? styleMatch[1] : '';

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

setTimeout(() => {
  try {
    // 1) 新闻详情面板
    window.eval('showNewsDetail(3);');
    const newsBody = document.getElementById('newsPanelBody').innerHTML;
    const hasResearch = newsBody.includes('前沿研究（直接相关）') && newsBody.includes('溯源');
    console.log('新闻视角内嵌前沿研究:', hasResearch);

    // 2) work 节点卡片（尾部🔬聚合）
    const nodeHTML = window.eval("buildDetailHTML(getNode('work'),'panel');");
    const hasNodeAgg = typeof nodeHTML === 'string' && nodeHTML.includes('🔬 前沿研究');
    console.log('work 节点卡片含🔬聚合:', hasNodeAgg);

    const out = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>前沿研究层 · 真实渲染预览</title>
<style>${styleCss}</style>
<style>
  body{margin:0;padding:32px;background:var(--bg,#f6f7f9);font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif}
  .pv-h{font-size:13px;color:var(--text-light,#888);letter-spacing:.08em;margin:0 0 10px;font-weight:600;text-transform:uppercase}
  .pv-wrap{max-width:760px;margin:0 auto 48px;background:var(--bg-card,#fff);border:1px solid var(--border-light,#eee);border-radius:var(--radius,14px);overflow:hidden}
  .pv-note{max-width:760px;margin:0 auto 12px;font-size:13px;color:var(--text-light,#888);line-height:1.7}
</style>
</head>
<body>
  <p class="pv-note">下方为 <b>「办公室三天没人说话」</b> 新闻详情面板（调用 <code>showNewsDetail(3)</code> 的真实渲染结果，最新日期）。注意「社科视角解读」的对应 interpretation 内已<strong>内嵌前沿研究</strong>（不再是独立区块），含「溯源 → work」按钮与该上游节点的一句知识解读；其上方为 v1.16 的 gist 立论块与事件脉络时间线。</p>
  <div class="pv-wrap">${newsBody}</div>

  <p class="pv-note">下方为点击「溯源 → work」后跳转到的 <b>work（工作社会学）</b> 节点卡片尾部——<b>🔬 前沿研究</b> 反向聚合了上面那条研究（新闻↔知识双向可达）。</p>
  <div class="pv-wrap">${nodeHTML}</div>
</body>
</html>`;

    fs.writeFileSync('D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/research-preview.html', out, 'utf8');
    console.log('已导出 research-preview.html');
  } catch (e) {
    errors.push('HARNESS: ' + e.stack);
  }
  if (errors.length) { console.log('\\nERRORS:'); errors.forEach(e => console.log('- ' + e)); }
  process.exit(errors.length ? 1 : 0);
}, 500);
