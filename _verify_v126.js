// _verify_v126.js — v1.26 视觉验证：Obsidian 式纯填充圆 + 细直线
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const htmlPath = path.resolve(__dirname, 'sociology-map.html');

    const results = [];

    for (const vp of [
        { name: 'mobile', w: 390, h: 844 },
        { name: 'desktop', w: 1280, h: 800 }
    ]) {
        await page.setViewport({ width: vp.w, height: vp.h });
        await page.goto(`file://${htmlPath}?debug=1`, { waitUntil: 'networkidle0', timeout: 30000 });
        await new Promise(r => setTimeout(r, 1500));

        // 点击"知识图谱" tab-link
        const clicked = await page.evaluate(() => {
            const el = document.querySelector('a.tab-link[data-page="page-map"]');
            if (el) { el.click(); return true; }
            return false;
        });
        results.push(`${vp.name}: map-tab clicked=${clicked}`);

        // 等待图谱 canvas 渲染（力导向稳定 + 多帧绘制）
        await new Promise(r => setTimeout(r, 6000));

        // 确认 canvas 存在且可见
        const canvasInfo = await page.evaluate(() => {
            const c = document.getElementById('theoryMap');
            if (!c) return { error: 'no canvas' };
            const r = c.getBoundingClientRect();
            return { w: r.width, h: r.height, visible: r.width > 0 && r.height > 0 };
        });
        results.push(`${vp.name} canvas: ${JSON.stringify(canvasInfo)}`);

        const ss = path.resolve(__dirname, `_ss_v126_${vp.name}.png`);
        await page.screenshot({ path: ss, fullPage: false });
        results.push(`${vp.name}: screenshot → ${ss}`);

        // __dbg 检查
        const dbg = await page.evaluate(() => {
            if (!window.__dbg) return { error: '__dbg not exposed' };
            return {
                visCount: window.__dbg.visCount,
                labelAll: window.__dbg.labelAll,
                scale: typeof window.__dbg.scale === 'number' ? window.__dbg.scale.toFixed(2) : window.__dbg.scale,
                nodeCount: window.__dbg.nodeCount,
                edgeCount: window.__dbg.edgeCount
            };
        });
        results.push(`${vp.name} dbg: ${JSON.stringify(dbg)}`);
    }

    await browser.close();

    console.log('=== v1.26 验证结果 ===');
    results.forEach(r => console.log('  ' + r));
    console.log('\n请人工检查截图确认：');
    console.log('  1. 节点无外环（纯色小圆点，无粗彩色圆环）');
    console.log('  2. 边为细直线（无曲线、无虚线）');
})().catch(e => { console.error(e); process.exit(1); });
