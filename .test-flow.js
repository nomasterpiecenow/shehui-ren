const http = require('http');
const fs = require('fs');
function req(opts, body) {
  return new Promise((res, rej) => {
    const r = http.request(opts, (rs) => {
      let d = []; rs.on('data', c => d.push(c));
      rs.on('end', () => res({ status: rs.statusCode, body: Buffer.concat(d), headers: rs.headers }));
    });
    r.on('error', rej);
    if (body) r.write(body);
    r.end();
  });
}
(async () => {
  const base = { host: 'localhost', port: 8787 };
  let r = await req(Object.assign({ path: '/.netlify/functions/create-order', method: 'POST', headers: { 'content-type': 'application/json' } }, base), JSON.stringify({ plan: 'pro', dates: ['2026-08-07'] }));
  const order = JSON.parse(r.body.toString());
  console.log('[1] create-order =>', JSON.stringify(order).slice(0, 220));
  if (order.mode !== 'mock' || !order.confirmUrl) { console.log('FAIL create-order'); process.exit(1); }

  let c = await req(Object.assign({ path: order.confirmUrl, method: 'GET' }, base));
  const conf = JSON.parse(c.body.toString());
  console.log('[2] pay-confirm =>', JSON.stringify(conf).slice(0, 160));
  if (!conf.ok || !conf.token) { console.log('FAIL confirm'); process.exit(1); }

  const url = '/.netlify/functions/download?token=' + encodeURIComponent(conf.token) + '&mode=quick&density=standard&dates=2026-08-07';
  let d = await req(Object.assign({ path: url, method: 'GET' }, base));
  console.log('[3] download status=', d.status, 'content-type=', d.headers['content-type'], 'bytes=', d.body.length);
  const head = d.body.slice(0, 5).toString('latin1');
  console.log('    PDF header =', JSON.stringify(head));
  if (d.status !== 200 || head !== '%PDF-') { console.log('FAIL download'); process.exit(1); }
  fs.writeFileSync('/tmp/test-export.pdf', d.body);

  let e = await req(Object.assign({ path: '/.netlify/functions/download?mode=quick&density=standard', method: 'GET' }, base));
  console.log('[4] no-token download status=', e.status, '(应为403)');
  if (e.status !== 403) { console.log('FAIL gate'); process.exit(1); }

  console.log('\n✅ 全链路通过：订单→支付→令牌→PDF(%PDF合法)→无令牌拦截');
})().catch(e => { console.error('ERR', e); process.exit(1); });
