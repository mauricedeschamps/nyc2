const CACHE_NAME = 'nyc-guide-v1';
const urlsToCache = [
  'index.html',
  'manifest.json',
  'IMG_20250721_192101_(192_x_192_ピクセル).jpg',
  'IMG_20250721_192133_(512_x_512_ピクセル).jpg'
];

// インストールイベント
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Caching failed', error);
      })
  );
});

// アクティベートイベント
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('Service Worker: Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// フェッチイベント - オフライン対応
self.addEventListener('fetch', event => {
  // 画像リクエストの処理
  if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/) || 
      event.request.url.includes('encrypted-tbn0.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        
        // なければネットワークから取得してキャッシュに保存
        return fetch(event.request)
          .then(networkResponse => {
            // 有効なレスポンスのみキャッシュ
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
              return networkResponse;
            }
            
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            
            return networkResponse;
          })
          .catch(() => {
            // 画像取得失敗時のフォールバック - アイコン画像を返す
            return caches.match('IMG_20250721_192101_(192_x_192_ピクセル).jpg');
          });
      })
    );
    return;
  }

  // HTMLとマニフェストの処理
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(networkResponse => {
            // 有効なレスポンスのみキャッシュ
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
              return networkResponse;
            }
            
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            
            return networkResponse;
          })
          .catch(error => {
            console.log('Service Worker: Fetch failed', error);
            
            // オフラインでHTMLリクエストの場合はメインページを返す
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('index.html');
            }
            
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// プッシュ通知（将来の拡張用）
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: 'IMG_20250721_192101_(192_x_192_ピクセル).jpg',
    badge: 'IMG_20250721_192101_(192_x_192_ピクセル).jpg',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('NYC Travel Guide', options)
  );
});

// 通知クリックイベント
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});