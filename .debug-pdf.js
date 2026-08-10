const { selectNews } = require('./api/_common');
const { buildPdf } = require('./api/pdf-builder');
(async () => {
  try {
    const news = selectNews(['2026-08-07']);
    console.log('news count =', news.length);
    const buf = await buildPdf(news, {
      mode: 'quick', density: 'standard',
      title: '社会人 · 作文金句素材册', subtitle: 'x', range: '2026-08-07',
    });
    console.log('PDF bytes =', buf.length, 'header =', Buffer.from(buf).slice(0,5).toString());
  } catch (e) {
    console.log('PDF ERROR:', e.message);
    console.log(e.stack);
  }
})();
