const CACHE_NAME = 'xiao-hu-v3';

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
  // 只缓存同源请求（HTML、CSS、JS、图片等静态资源）
  if (!e.request.url.startsWith(self.location.origin)) return;

  // 对于翻译 API 请求，不拦截，让浏览器直接处理
  if (e.request.url.includes('api.cognitive.microsofttranslator.com') ||
      e.request.url.includes('edge.microsoft.com') ||
      e.request.url.includes('fanyi.baidu.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 只缓存成功的响应（200 状态码）
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, clone);
          });
        }
        return res;
      })
      .catch((err) => {
        // 离线或网络错误时使用缓存
        return caches.match(e.request).then((cachedRes) => {
          if (cachedRes) {
            return cachedRes;
          }
          // 如果缓存也没有，返回一个基本的离线页面
          if (e.request.mode === 'navigate') {
            return caches.match('/xiaohuzhushou/');
          }
          // 对于其他资源，返回一个空的响应
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});
