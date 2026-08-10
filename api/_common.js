'use strict';
// 付费下载链路的共享工具：配置、新闻数据加载、权益令牌(HMAC)签发与校验。
// 设计为 Netlify Functions 与本地 dev runner 共用（均通过 exports.handler 暴露）。
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..'); // sociology-map 站点根
const NEWS_DATA_PATH = process.env.NEWS_DATA_PATH
  || path.join(ROOT, 'news-data.js');
// 字体加载：优先本地文件（dev / 函数包含字体）→ 回退到站点静态资源（生产函数包未含字体时）。
// 这样无论 Netlify 打包器是否把 9.7MB 字体打进函数包，都能拿到字体，避免生产"字体缺失"。
const FONT_URL = process.env.PDF_FONT_URL || 'https://shehui-ren.com/assets/fonts/simhei.ttf';
let _fontCache = null;
async function loadFontBytes() {
  if (_fontCache) return _fontCache;
  if (process.env.PDF_FONT_PATH && fs.existsSync(process.env.PDF_FONT_PATH)) {
    return (_fontCache = fs.readFileSync(process.env.PDF_FONT_PATH));
  }
  const local = path.join(__dirname, 'fonts', 'simhei.ttf');
  if (fs.existsSync(local)) return (_fontCache = fs.readFileSync(local));
  const localStatic = path.join(ROOT, 'assets', 'fonts', 'simhei.ttf');
  if (fs.existsSync(localStatic)) return (_fontCache = fs.readFileSync(localStatic));
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error('字体拉取失败 HTTP ' + res.status + ' @ ' + FONT_URL);
  return (_fontCache = Buffer.from(await res.arrayBuffer()));
}

// ---------- 配置（真实环境用环境变量注入，默认走 mock 测试模式）----------
function getConfig() {
  return {
    // 付费门禁密钥：签发/校验权益令牌。生产务必用强随机值并通过环境变量注入。
    secret: process.env.PAYWALL_SECRET || 'dev-only-secret-change-me',
    // 支付提供方：mock(测试) | wechat | alipay。无商户号时先用 mock 跑通链路。
    provider: (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase(),
    // 价格（单位：元），可按套餐扩展。
    priceYuan: Number(process.env.PRICE_YUAN || '9.9'),
    // 权益有效期（天），0 表示永久。
    entitlementDays: Number(process.env.ENTITLEMENT_DAYS || '365'),
    siteName: '社会人',
  };
}

// ---------- 新闻数据加载 ----------
// news-data.js 形如 `var NEWS_DATA = {...};`，用 vm 在隔离上下文求值后取出对象。
function loadNewsData() {
  const src = fs.readFileSync(NEWS_DATA_PATH, 'utf8');
  const m = src.match(/var\s+NEWS_DATA\s*=\s*([\s\S]*?);\s*(NEWS_DATA\[|module\.exports|$)/);
  if (!m) throw new Error('NEWS_DATA 未匹配');
  const vm = require('vm');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext('var NEWS_DATA = ' + m[1] + ';', sandbox);
  return sandbox.NEWS_DATA;
}

// 取指定日期列表（或最近 N 天）的新闻数组，按日期倒序。
function selectNews(dates) {
  const data = loadNewsData();
  const keys = Object.keys(data).sort().reverse(); // 最新在前
  let pick = keys;
  if (dates && dates.length) pick = keys.filter(k => dates.includes(k));
  const out = [];
  for (const k of pick) for (const it of data[k]) out.push(Object.assign({ _date: k }, it));
  return out;
}

// ---------- 权益令牌（HMAC-SHA256，base64url）----------
// 令牌既是"已付费"凭证，又是防伪造签名；下载时仅验签名+有效期，不查库。
function signToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}
function verifyToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expect = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  // 定长比较，防时序攻击
  const a = Buffer.from(sig), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); }
  catch (e) { return null; }
  if (payload.exp && Date.now() > payload.exp) return null;
  if (!payload.paid) return null;
  return payload;
}
function issueEntitlement(secret, plan = 'pro') {
  const days = getConfig().entitlementDays;
  const exp = days > 0 ? Date.now() + days * 86400000 : 0;
  return signToken({ paid: true, plan, iat: Date.now(), exp }, secret);
}

// ---------- mock 订单存储（生产应换 KV/DB；MVP 用内存即可）----------
const ORDERS = new Map(); // orderId -> { createdAt, paid, plan }
function createMockOrder(plan = 'pro') {
  const orderId = 'ORD-' + Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex');
  ORDERS.set(orderId, { createdAt: Date.now(), paid: false, plan });
  return orderId;
}
function markOrderPaid(orderId, plan = 'pro') {
  const o = ORDERS.get(orderId);
  if (!o) return false;
  o.paid = true; o.plan = plan;
  return true;
}

module.exports = {
  ROOT, NEWS_DATA_PATH, FONT_URL, loadFontBytes,
  getConfig, loadNewsData, selectNews,
  signToken, verifyToken, issueEntitlement,
  createMockOrder, markOrderPaid, ORDERS,
};
