const CACHE = 'shehui-ren-v15';
const SHELL = [
  './',
  'sociology-map.html',
  'news-data.js',
  'manifest.webmanifest',
  'favicon.svg',
  'favicon-maskable.svg',
  'og-image.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).catch(function () {}));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // 页面导航：网络优先，离线回退已缓存的 HTML
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        caches.open(CACHE).then(function (c) { c.put('sociology-map.html', res.clone()); });
        return res;
      }).catch(function () { return caches.match('sociology-map.html').then(function (r) { return r || caches.match('./'); }); })
    );
    return;
  }

  // 每日新闻数据：网络优先，保证新鲜；失败回退缓存
  if (url.pathname.endsWith('news-data.js')) {
    e.respondWith(
      fetch(req).then(function (res) {
        caches.open(CACHE).then(function (c) { c.put(req, res.clone()); });
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  // 其余静态资源：缓存优先，回退网络
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return caches.match('./'); });
    })
  );
});
