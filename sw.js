const CACHE_NAME = 'rhythm-fighter-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './FNT512.png',
  './FNT512-transparent.png'
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app resources');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ時の処理
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュがあればそれを返す
        if (response) {
          return response;
        }

        // なければネットワークから取得
        return fetch(event.request).then(response => {
          // 有効なレスポンスでない場合はそのまま返す
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // オフライン時のフォールバック
        return caches.match('./index.html');
      })
  );
});

// バックグラウンド同期
self.addEventListener('sync', event => {
  if (event.tag === 'update-check') {
    event.waitUntil(checkForUpdates());
  }
});

// アップデートチェック
async function checkForUpdates() {
  try {
    const response = await fetch('./manifest.json');
    const manifest = await response.json();
    
    // バージョンチェックロジックをここに実装
    // 新しいバージョンがあれば通知
    if (manifest.version && manifest.version !== CACHE_NAME) {
      self.registration.showNotification('アップデート利用可能', {
        body: '新しいバージョンが利用可能です。',
        icon: 'https://hokutomiyazaki-arch.github.io/rythm-fighter/FNT512.png',
        badge: 'https://hokutomiyazaki-arch.github.io/rythm-fighter/FNT512.png'
      });
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}

// メッセージリスナー
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
