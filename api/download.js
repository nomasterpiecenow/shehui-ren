'use strict';
// 付费下载：GET /.netlify/functions/download?token=...&mode=quick&density=standard&dates=2026-08-07,2026-08-06
// 先校验权益令牌（HMAC），通过才生成 PDF 返回；否则 403。
const { getConfig, verifyToken, selectNews } = require('./_common');
const { buildPdf } = require('./pdf-builder');

exports.handler = async (event) => {
  const cfg = getConfig();
  const q = event.queryStringParameters || {};
  const token = q.token;
  const payload = verifyToken(token, cfg.secret);
  if (!payload) {
    return { statusCode: 403, headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: '未授权：请先购买后下载', code: 'NO_ENTITLEMENT' }) };
  }
  const mode = (q.mode === 'full') ? 'full' : 'quick';
  const density = ['compact', 'standard', 'loose'].includes(q.density) ? q.density : 'standard';
  const dates = q.dates ? q.dates.split(',').map(s => s.trim()).filter(Boolean) : [];

  let news;
  try { news = await selectNews(dates); }
  catch (e) { return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: '读取新闻数据失败：' + e.message }) }; }

  const rangeText = dates.length ? ('日期：' + dates.join('、')) : '最近更新';
  const opt = {
    mode, density,
    title: cfg.siteName + (mode === 'quick' ? ' · 作文金句素材册' : ' · 社科解读素材册'),
    subtitle: mode === 'quick' ? '所选日期社会热点 · 速用金句 · 直接套用' : '所选日期社会热点 · 多视角社科解读',
    range: rangeText,
  };
  try {
    const buf = await buildPdf(news, opt);
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="shehui-ren-' + mode + '-' + density + '.pdf"',
        'cache-control': 'no-store',
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'PDF 生成失败：' + e.message }) };
  }
};
