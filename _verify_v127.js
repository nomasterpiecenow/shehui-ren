const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const htmlPath = path.resolve(__dirname, 'sociology-map.html');
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for initial render
    await new Promise(r => setTimeout(r, 3000));

    // Switch to graph view via JS
    await page.evaluate(() => {
        if (typeof switchPage === 'function') switchPage('page-map');
    });
    await new Promise(r => setTimeout(r, 4000));

    // --- Mobile ---
    await page.setViewport({ width: 390, height: 844 });
    await new Promise(r => setTimeout(r, 2000));

    const mobilePath = path.resolve(__dirname, '_ss_v127_mobile.png');
    await page.screenshot({ path: mobilePath, fullPage: false });

    const dbgMobile = await page.evaluate(() => {
        const w = window.__dbg;
        return w ? { visCount: w.visCount, labelAll: w.labelAll, scale: w.scale, nodeCount: w.nodeCount } : null;
    });
    console.log('MOBILE:', JSON.stringify(dbgMobile));

    // --- Desktop ---
    await page.setViewport({ width: 1280, height: 800 });
    await new Promise(r => setTimeout(r, 2000));

    const desktopPath = path.resolve(__dirname, '_ss_v127_desktop.png');
    await page.screenshot({ path: desktopPath, fullPage: false });

    const dbgDesktop = await page.evaluate(() => {
        const w = window.__dbg;
        return w ? { visCount: w.visCount, labelAll: w.labelAll, scale: w.scale, nodeCount: w.nodeCount } : null;
    });
    console.log('DESKTOP:', JSON.stringify(dbgDesktop));

    const errors = await page.evaluate(() => window.__errors || []);
    if (errors.length) console.log('ERRORS:', errors.join('\n'));
    else console.log('ERRORS: none');

    await browser.close();
    console.log('DONE - screenshots saved');
})();
