/**
 * Service Worker - 前端资源缓存
 */

const CACHE_NAME = 'qqmusic-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js'
];

// 安装：预缓存核心资源
self.addEventListener('install', (event) => {
    console.log('[SW] 预缓存核心资源');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Try to add each URL individually to avoid complete failure
            return Promise.allSettled(
                urlsToCache.map(url =>
                    cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
                )
            );
        })
    );
    self.skipWaiting();
});

// 激活：清理旧版本缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] 删除旧缓存:', key);
                        return caches.delete(key);
                    })
            );
        })
    );
    self.clients.claim();
});

// 请求拦截：缓存优先策略（静态资源），网络优先策略（API）
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // API 请求：始终走网络
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // 忽略非 HTTP/HTTPS 请求 (如 chrome-extension://)
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 静态资源：缓存优先
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                // 后台更新缓存
                fetch(event.request).then(response => {
                    if (response.ok) {
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, response);
                        });
                    }
                }).catch(() => { });
                return cached;
            }

            // 无缓存：网络请求并缓存
            return fetch(event.request).then(response => {
                if (response.ok && url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff2?)$/)) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        })
    );
});
