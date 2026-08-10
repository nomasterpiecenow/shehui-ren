'use strict';
// 创建支付订单。Netlify Function: POST /.netlify/functions/create-order
// mock 模式：返回测试订单 + 模拟支付链接，完整跑通链路（无需商户号）。
// 真实模式：调用微信/支付宝 Native 支付下单，返回 code_url 供前端生成二维码。
const { getConfig, createMockOrder } = require('./_common');

exports.handler = async (event) => {
  if (event.httpMethod && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const cfg = getConfig();
  let plan = 'pro', dates = [];
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    plan = body.plan || 'pro';
    dates = Array.isArray(body.dates) ? body.dates : [];
  } catch (e) { /* 忽略，用默认 */ }

  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';

  if (cfg.provider === 'mock') {
    const orderId = createMockOrder(plan);
    // 模拟支付确认地址（前端"模拟支付"按钮会请求它）
    const confirmUrl = '/.netlify/functions/pay-confirm?orderId=' + encodeURIComponent(orderId) + '&plan=' + encodeURIComponent(plan);
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin || '*' },
      body: JSON.stringify({
        mode: 'mock',
        orderId,
        priceYuan: cfg.priceYuan,
        qrText: '【测试模式】订单 ' + orderId + ' · ￥' + cfg.priceYuan,
        confirmUrl,
        note: '当前为测试模式，点击"模拟支付成功"即可获取下载权限，无需真实付款。接入微信/支付宝后此处返回真实收款码。',
      }),
    };
  }

  if (cfg.provider === 'wechat') {
    // === 真实微信支付接入点（需商户号）===
    // 1) 读环境变量：WX_APPID / WX_MCH_ID / WX_API_KEY / WX_NOTIFY_URL
    // 2) 调用 https://api.mch.weixin.qq.com/pay/unifiedorder（Native 下单）
    // 3) 取返回的 code_url 作为二维码内容返回前端
    // 详见 PAYMENT_INTEGRATION.md。以下为占位，未配置商户号时回落 mock。
    if (!process.env.WX_MCH_ID) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: '微信支付未配置：缺少 WX_MCH_ID，请参考 PAYMENT_INTEGRATION.md' }) };
    }
    return { statusCode: 500, headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: '微信 Native 支付下单未实现，请按 PAYMENT_INTEGRATION.md 补全 unifiedorder 调用' }) };
  }

  if (cfg.provider === 'alipay') {
    // === 真实支付宝接入点（需商户号）===
    // 1) 读环境变量：ALIPAY_APP_ID / ALIPAY_PRIVATE_KEY / ALIPAY_PUBLIC_KEY / ALIPAY_NOTIFY_URL
    // 2) 调用 alipay.trade.precreate 获取 qr_code
    // 详见 PAYMENT_INTEGRATION.md。
    if (!process.env.ALIPAY_APP_ID) {
      return { statusCode: 400, headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: '支付宝未配置：缺少 ALIPAY_APP_ID，请参考 PAYMENT_INTEGRATION.md' }) };
    }
    return { statusCode: 500, headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: '支付宝 precreate 未实现，请按 PAYMENT_INTEGRATION.md 补全调用' }) };
  }

  return { statusCode: 400, headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ error: '未知的 PAYMENT_PROVIDER: ' + cfg.provider }) };
};
