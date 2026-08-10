'use strict';
// 模拟支付确认（仅 mock 模式用）。GET /.netlify/functions/pay-confirm?orderId=ORD-xxx
// 相当于真实支付的"支付成功回调"：标记订单已付 → 签发权益令牌返回给前端。
const { getConfig, markOrderPaid, issueEntitlement } = require('./_common');

exports.handler = async (event) => {
  const cfg = getConfig();
  if (cfg.provider !== 'mock') {
    return { statusCode: 400, headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'pay-confirm 仅用于 mock 测试模式；真实支付请走 pay-webhook' }) };
  }
  const q = event.queryStringParameters || {};
  const orderId = q.orderId;
  if (!orderId || !markOrderPaid(orderId)) {
    return { statusCode: 404, headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: '订单不存在或已失效' }) };
  }
  const token = issueEntitlement(cfg.secret, 'pro');
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '*';
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin },
    body: JSON.stringify({ ok: true, token, plan: 'pro', exp: cfg.entitlementDays }),
  };
};
