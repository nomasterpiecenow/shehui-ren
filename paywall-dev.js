'use strict';
// 本地联调 runner：用原生 http 模拟 Netlify Functions + 静态托管，无需 Netlify 即可跑通
// 创建订单 → 模拟支付 → 下载 PDF 全链路。生产由 Netlify Functions 接管（api/*.js 即函数）。
// 用法：node paywall-dev.js  然后浏览器开 http://localhost:8787/news-export.html
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const PORT = process.env.DEV_PORT || 8787;

// 默认 mock 测试模式
process.env.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'mock';
process.env.PAYWALL_SECRET = process.env.PAYWALL_SECRET || 'dev-only-secret-change-me';

const handlers = {
  '/.netlify/functions/create-order': require('./api/create-order'),
  '/.netlify/functions/pay-confirm': require('./api/pay-confirm'),
  '/.netlify/functions/pay-webhook': require('./api/pay-webhook'),
  '/.netlify/functions/download': require('./api/download'),
};

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.ttf': 'font/ttf' };

function toEvent(req, url, bodyBuf) {
  const q = Object.fromEntries(url.searchParams.entries());
  let body = null;
  if (bodyBuf.length) {
    const ct = req.headers['content-type'] || '';
    body = ct.includes('application/json') ? bodyBuf.toString('utf8') : bodyBuf.toString('utf8');
  }
  return {
    httpMethod: req.method,
    path: url.pathname,
    headers: req.headers,
    queryStringParameters: q,
    body,
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const fn = handlers[url.pathname];
  if (fn) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const buf = Buffer.concat(chunks);
    try {
      const ev = toEvent(req, url, buf);
      const out = await fn.handler(ev, {});
      const headers = Object.assign({}, out.headers);
      const isB64 = out.isBase64Encoded;
      let data = out.body;
      if (typeof data === 'string') data = Buffer.from(data, isB64 ? 'base64' : 'utf8');
      if (data instanceof Uint8Array) data = Buffer.from(data);
      res.writeHead(out.statusCode || 200, headers);
      res.end(data || '');
    } catch (e) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: e.message, stack: e.stack }));
    }
    return;
  }
  // 静态文件
  let p = url.pathname === '/' ? '/news-export.html' : url.pathname;
  const file = path.join(ROOT, decodeURIComponent(p));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }
  const ext = path.extname(file);
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log('[paywall-dev] 本地联调服务已启动');
  console.log('  打开: http://localhost:' + PORT + '/news-export.html');
  console.log('  模式: ' + (process.env.PAYMENT_PROVIDER) + '（mock=测试，无需真实支付）');
});
