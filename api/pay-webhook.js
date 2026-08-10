'use strict';
// 真实支付异步通知（微信/支付宝回调）。POST /.netlify/functions/pay-webhook
// 职责：① 校验支付平台签名 → ② 标记订单已付 → ③ 回 ACK 给支付平台（如微信要求返回 <xml><return_code>SUCCESS</return_code></xml>）。
// 注意：真实环境此处必须严格校验签名，否则可被伪造"已支付"。以下为占位模板，待接入商户号后补全。
const { getConfig, markOrderPaid, issueEntitlement } = require('./_common');

exports.handler = async (event) => {
  const cfg = getConfig();
  const provider = cfg.provider;
  if (provider === 'mock') {
    return { statusCode: 400, headers: { 'content-type': 'text/plain' },
      body: 'mock 模式无需 webhook，请使用 pay-confirm' };
  }

  if (provider === 'wechat') {
    // TODO: 解析微信回调 XML，用 WX_API_KEY 做签名校验（重要！），校验金额/订单号，
    // 成功后 markOrderPaid(orderId)，并返回微信要求的 SUCCESS 应答。
    // 参考：https://pay.weixin.qq.com/wiki/doc/api/native.php?chapter=9_7&index=8
    return { statusCode: 200, headers: { 'content-type': 'application/xml' },
      body: '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>' };
  }

  if (provider === 'alipay') {
    // TODO: 用 ALIPAY_PUBLIC_KEY 验签（alipay-sdk 的 checkResponseSign），校验 trade_status=TRADE_SUCCESS，
    // 成功后 markOrderPaid(orderId)，并返回 "success" 字符串给支付宝。
    return { statusCode: 200, headers: { 'content-type': 'text/plain' }, body: 'success' };
  }

  return { statusCode: 400, body: 'unknown provider' };
};
