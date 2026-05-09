const CACHE_NAME = 'xiao-hu-v2';

// 安装时跳过等待
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// 激活时清理旧缓存并接管页面
self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      // 清理所有旧缓存
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        }))
      ),
      // 立即接管所有客户端
      self.clients.claim(),
    ])
  );
});

// 网络优先策略：先请求网络，失败才用缓存
self.addEventListener('fetch', (e) => {
  // 只缓存同源请求
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 缓存成功的响应
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, clone);
        });
        return res;
      })
      .catch(() => {
        // 离线时使用缓存
        return caches.match(e.request);
      })
  );
});
