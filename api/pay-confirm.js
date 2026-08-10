'use strict';
// 模拟支付确认（仅 mock 模式用）。GET /.netlify/functions/pay-confirm?orderId=ORD-xxx
// 相当于真实支付的"支付成功回调"：标记订单已付 → 签发权益令牌返回给前端。
const { getConfig, issueEntitlement } = require('./_common');

// 注意：Netlify Functions 是无状态的（每次调用独立实例，内存不共享）。
// 因此 mock 模式不再查内存订单表，直接按 orderId/plan 签发令牌即可——
// mock 本就是测试通道，不涉真实支付校验。真实支付由 pay-webhook 异步通知，
// 届时需要用持久化存储（如 Netlify Blobs）保存订单状态（见 PAYMENT_INTEGRATION.md）。
exports.handler = async (event) => {
  const cfg = getConfig();
  if (cfg.provider !== 'mock') {
    return { statusCode: 400, headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'pay-confirm 仅用于 mock 测试模式；真实支付请走 pay-webhook' }) };
  }
  const q = event.queryStringParameters || {};
  const orderId = q.orderId || 'MOCK-' + Date.now();
  const plan = q.plan || 'pro';
  const token = issueEntitlement(cfg.secret, plan);
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '*';
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin },
    body: JSON.stringify({ ok: true, token, plan, orderId, exp: cfg.entitlementDays }),
  };
};
