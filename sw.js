// キャッシュ名 - バージョン管理
const CACHE_NAME = 'nyc-travel-guide-v1.0.0';

// キャッシュするリソース
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/IMG_20250721_192101_(192_x_192_ピクセル).jpg',
  '/IMG_20250721_192133_(512_x_512_ピクセル).jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZfiKueoe4RXzCxhfnAY32pdr6IHHnpp77q7k5i9hM0u1QoW6sNBbONBY&s=10%3D%3D&auto=format&fit=crop&w=800&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKltPfBqKH6GfGf5XJf-bL_fiYr5hJ6pwSRHdQQNT9JFNSxFwhu7_NV0c&s=10auto=format&fit=crop&w=800&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTX07rL7tW5LfdHssUIj-sBcEEzvtA1sS4NNA&s%3D%3D&auto=format&fit=crop&w=800&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8L-eUZU_3gLxVxvYWaeqFi8NiPeRIZ_fkaQ&suto=format&fit=crop&w=800&q=80',
  'https://images.ctfassets.net/1aemqu6a6t65/46MJ6ER585Rwl3NraEIoGL/784c5eb5d87f576b5548b1a2255f08e7/tripadvisortimessquare_taggeryanceyiv_5912?w=1200&h=800&q=75o=format&fit=crop&w=800&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4X5fPUYXFARM3l6werGxaSQ2mX2zUroc-aYiixAWypSSuBuEK8TG4jt0&s=10=format&fit=crop&w=800&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8W9PG0_pfz7jWmqr2LLvrs_A72Xkqqs-E5xISh754xeUufm09JusK1TUq&s=10o=format&fit=crop&w=800&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5h8s2VRGHqQ7H_C37-PYC5rnW17iwnL5aAgSOb25UZlow76yh-scoeq4&s=10o=format&fit=crop&w=800&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROgG6GdlOgTEuO-MI2jHIGgDAXQsiYyERTwS08VzYtMvbn5hO-8xrTKcSt&s=10ormat&fit=crop&w=800&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvxVDUu1fM_E51dXekMzowCpG1oxL4G_z4EVEsH51wuF_GXEg6tCp1wTm5&s=10uto=format&fit=crop&w=800&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToJUOx2fb1UE2qRyARS_REbxhvEFShtyYa9oXKtogxPiFqdNxhxybGa8wS&s=10=format&fit=crop&w=800&q=80',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgK-0lKzuydhHBxXjofPDk8OgEL7j28k-kwYzLxlMHbKJMWAr0m29cB2I&s=10o=format&fit=crop&w=800&q=80'
];

// インストールイベント - キャッシュの作成
self.addEventListener('install', event => {
  console.log('[Service Worker] インストール中...');
  
  // 待機中のService Workerをアクティブに
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] キャッシュを開きました');
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log('[Service Worker] すべてのリソースをキャッシュしました');
          })
          .catch(error => {
            console.error('[Service Worker] キャッシュエラー:', error);
          });
      })
  );
});

// アクティベートイベント - 古いキャッシュの削除
self.addEventListener('activate', event => {
  console.log('[Service Worker] アクティベート中...');
  
  // ページを即座に制御
  self.clients.claim();
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// フェッチイベント - キャッシュ戦略
self.addEventListener('fetch', event => {
  // PayPalなどの外部スクリプトはキャッシュしない
  if (event.request.url.includes('paypal.com') || 
      event.request.url.includes('googleapis.com')) {
    return;
  }
  
  // 画像リクエストの処理
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // レスポンスが有効でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 画像をキャッシュに追加
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          })
          .catch(() => {
            // オフライン時はフォールバック画像を表示
            return caches.match('/IMG_20250721_192101_(192_x_192_ピクセル).jpg');
          });
      })
    );
    return;
  }
  
  // その他のリソースの処理（Stale-While-Revalidate戦略）
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // レスポンスが有効な場合のみキャッシュを更新
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(error => {
          console.log('[Service Worker] ネットワークエラー:', error);
          // オフライン時でも何も返さない（cachedResponseが使われる）
        });
      
      return cachedResponse || fetchPromise;
    })
  );
});

// プッシュ通知イベント（将来の拡張用）
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: 'IMG_20250721_192101_(192_x_192_ピクセル).jpg',
    badge: 'IMG_20250721_192101_(192_x_192_ピクセル).jpg',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('NYC Travel Guide', options)
  );
});

// 通知クリックイベント
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// バックグラウンド同期（将来の拡張用）
self.addEventListener('sync', event => {
  if (event.tag === 'sync-attractions') {
    console.log('[Service Worker] バックグラウンド同期実行');
    // 同期処理をここに記述
  }
});

// エラーハンドリング
self.addEventListener('error', event => {
  console.error('[Service Worker] エラー:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[Service Worker] 未処理のPromise拒否:', event.reason);
});