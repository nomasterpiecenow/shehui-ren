const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const file = 'D:/Users/wtianyi/WorkBuddy/2026-07-16-11-25-14/sociology-map/sociology-map.html';
const html = fs.readFileSync(file, 'utf8');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail ? (e.detail.stack || e.detail) : e.message)));

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(window) {
    window.devicePixelRatio = 1;
    window.innerWidth = 1280;
    window.innerHeight = 800;
    // capture uncaught errors
    window.addEventListener('error', e => errors.push('window.error: ' + (e.error ? e.error.stack : e.message)));
    window.addEventListener('unhandledrejection', e => errors.push('unhandledrejection: ' + e.reason));
    // stub canvas 2d context
    const ctxStub = new Proxy({}, {
      get(t, prop) {
        if (prop === 'measureText') return () => ({ width: 10 });
        // emulate REAL browser: createLinearGradient throws IndexSizeError on non-finite coords
        if (prop === 'createLinearGradient') return (...a) => {
          if (a.some(v => !Number.isFinite(v))) throw new Error('IndexSizeError: non-finite coords in createLinearGradient');
          return { addColorStop() {} };
        };
        if (prop === 'createRadialGradient') return (...a) => {
          if (a.some(v => !Number.isFinite(v))) throw new Error('IndexSizeError: non-finite coords in createRadialGradient');
          return { addColorStop() {} };
        };
        if (prop === 'getImageData') return () => ({ data: [] });
        if (prop === 'canvas') return { width: 1280, height: 800 };
        // any property read that's used as a value (e.g. globalAlpha) -> return 1-ish; but assignments go to set
        if (prop in t) return t[prop];
        return () => {};
      },
      set(t, prop, val) { t[prop] = val; return true; }
    });
    window.NEWS_DATA = { items: [], updated: '', source: 'stub' };
    window.HTMLCanvasElement.prototype.getContext = function () { return ctxStub; };
    // neutralize rAF so the loop doesn't run forever; we step manually
    window.requestAnimationFrame = function () { return 0; };
    window.cancelAnimationFrame = function () {};
  }
});

const { window } = dom;
const document = window.document;

function report(label) {
  const w = window;
  // pull internals via the global scope of the page
  const nodes = w.eval('(typeof nodes!=="undefined")?nodes:null');
  const W = w.eval('(typeof W!=="undefined")?W:null');
  const H = w.eval('(typeof H!=="undefined")?H:null');
  const timeAxisOn = w.eval('(typeof timeAxisOn!=="undefined")?timeAxisOn:null');
  console.log(`\n=== ${label} ===`);
  console.log('timeAxisOn =', timeAxisOn, ' W =', W, ' H =', H, ' nodeCount =', nodes ? nodes.length : 'n/a');
  if (!nodes) return;
  let nan = 0, off = 0, inView = 0, minX=1e9, maxX=-1e9, minY=1e9, maxY=-1e9;
  for (const n of nodes) {
    if (!Number.isFinite(n.baseX) || !Number.isFinite(n.baseY) || !Number.isFinite(n.year)) { nan++; continue; }
    minX=Math.min(minX,n.baseX); maxX=Math.max(maxX,n.baseX);
    minY=Math.min(minY,n.baseY); maxY=Math.max(maxY,n.baseY);
    if (n.baseX>=0 && n.baseX<=W && n.baseY>=0 && n.baseY<=H) inView++;
    else off++;
  }
  console.log(`finite nodes: ${nodes.length-nan}, NaN/inf: ${nan}`);
  console.log(`in-view: ${inView}, off-canvas: ${off}`);
  if (nan < nodes.length) console.log(`x range [${minX.toFixed(1)}, ${maxX.toFixed(1)}]  y range [${minY.toFixed(1)}, ${maxY.toFixed(1)}]  (canvas ${W}x${H})`);
}

setTimeout(() => {
  try {
    report('AFTER INITIAL LOAD (time axis OFF)');

    // now click the time-axis toggle
    const btn = document.getElementById('axisToggle');
    console.log('\nclicking axisToggle, current text =', btn && btn.textContent);
    btn.dispatchEvent(new window.Event('click', { bubbles: true }));

    // enable all categories to mimic a populated view
    window.eval('activeCategories = new Set(["concept","theory","thinker","topic"]); if(typeof updateNodeScale==="function") updateNodeScale();');

    // step many ticks manually to converge the simulation
    const steps = [1, 50, 200, 600];
    let last = 0;
    for (let i = 1; i <= 600; i++) {
      try { window.eval('if(typeof draw==="function") draw();'); }
      catch (e) { errors.push('draw() threw on step '+i+': ' + e.stack); break; }
      if (steps.includes(i)) {
        const snap = window.eval('(function(){let mnX=1e9,mxX=-1e9,mnY=1e9,mxY=-1e9,nan=0,tot=nodes.length;for(const n of nodes){if(!Number.isFinite(n.baseX)||!Number.isFinite(n.baseY)){nan++;continue;}mnX=Math.min(mnX,n.baseX);mxX=Math.max(mxX,n.baseX);mnY=Math.min(mnY,n.baseY);mxY=Math.max(mxY,n.baseY);}return {nan,w:mxX-mnX,h:mxY-mnY,mnX,mxX,mnY,mxY,alpha};})()');
        console.log(`step ${i}: xSpan=${snap.w.toFixed(1)} ySpan=${snap.h.toFixed(1)} NaN=${snap.nan} alpha=${snap.alpha.toFixed(4)} [x ${snap.mnX.toFixed(0)}..${snap.mxX.toFixed(0)} y ${snap.mnY.toFixed(0)}..${snap.mxY.toFixed(0)}]`);
      }
    }
    report('AFTER TOGGLE time axis ON (converged)');

    // ---- HARDENING VERIFICATION: inject a NaN year (simulates old-bug data) and ensure no blank ----
    try {
      // reset to a clean settled state first
      window.eval('if(typeof initNodes==="function"){ initNodes(); } if(typeof draw==="function"){ for(let i=0;i<200;i++) draw(); }');
      window.eval('const bad = nodes.find(n=>n.cat==="concept"); if(bad) bad.year = NaN;');
      // toggle time axis ON with the NaN node present
      const btn2 = document.getElementById('axisToggle');
      if (!window.eval('timeAxisOn')) btn2.dispatchEvent(new window.Event('click', { bubbles: true }));
      for (let i = 0; i < 60; i++) {
        try { window.eval('if(typeof draw==="function") draw();'); }
        catch (e) { errors.push('draw() threw with NaN year on step '+i+': ' + e.stack); break; }
      }
      // verify the rest of the graph is still alive & visible (no permanent blank)
      const snap = window.eval('(function(){let vis=0,nan=0,tot=nodes.length;for(const n of nodes){if(!Number.isFinite(n.baseX)||!Number.isFinite(n.baseY)){nan++;continue;}if(n.baseX>=0&&n.baseX<=W&&n.baseY>=0&&n.baseY<=H)vis++;}return{vis,nan,tot};})()');
      console.log(`\n[NaN-injection test] visible=${snap.vis}/${snap.tot}, NaN-nodes=${snap.nan} (expect visible>0, NaN should self-heal)`);
    } catch (e) { errors.push('NaN test harness: ' + e.stack); }
  } catch (e) {
    errors.push('HARNESS: ' + e.stack);
  }

  console.log('\n################ ERRORS ################');
  if (errors.length === 0) console.log('(none)');
  else errors.forEach(e => console.log('- ' + e));

  // also dump a sample of concept node coords to see where they land
  const sample = window.eval('(typeof nodes!=="undefined")? nodes.filter(n=>n.cat==="concept").slice(0,5).map(n=>({id:n.id,year:n.year,bx:n.baseX,by:n.baseY})) : null');
  console.log('\nsample concept coords:', JSON.stringify(sample));

  process.exit(0);
}, 300);
