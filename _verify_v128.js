const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const htmlPath = path.resolve(__dirname, 'sociology-map.html');
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Click 知识图谱 tab
    await page.evaluate(() => {
        const tabs = document.querySelectorAll('[data-page]');
        for (const t of tabs) {
            if (t.textContent.includes('知识图谱')) { t.click(); break; }
        }
    });
    await new Promise(r => setTimeout(r, 4000));

    // Mobile
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await new Promise(r => setTimeout(r, 2000));
    const dbgM = await page.evaluate(() => window.__dbg);
    console.log('MOBILE:', JSON.stringify(dbgM));
    await page.screenshot({ path: '_ss_v128_mobile.png', fullPage: false });

    // Desktop
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 2000));
    const dbgD = await page.evaluate(() => window.__dbg);
    console.log('DESKTOP:', JSON.stringify(dbgD));
    await page.screenshot({ path: '_ss_v128_desktop.png', fullPage: false });

    await browser.close();
})();
