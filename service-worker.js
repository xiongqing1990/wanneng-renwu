/**
 * PWA Service Worker
 * 离线缓存、后台同步
 */

const CACHE_NAME = 'wanneng-task-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json'
]

// 安装事件：缓存静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log('All resources cached')
        return self.skipWaiting()
      })
  )
})

// 激活事件：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('New service worker activated')
        return self.clients.claim()
      })
  )
})

// 拦截请求：缓存优先策略
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中
        if (response) {
          return response
        }
        
        // 缓存未命中，发起网络请求
        return fetch(event.request).then(response => {
          // 检查是否返回有效响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }
          
          // 克隆响应
          const responseToCache = response.clone()
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache)
            })
          
          return response
        })
      })
      .catch(() => {
        // 离线且缓存未命中
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html')
        }
      })
  )
})

// 后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks())
  }
})

// 同步任务数据
async function syncTasks() {
  try {
    const db = await openDatabase()
    const offlineTasks = await db.getAll('offline_tasks')
    
    for (const task of offlineTasks) {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(task)
        })
        
        if (response.ok) {
          await db.delete('offline_tasks', task.id)
        }
      } catch (error) {
        console.error('Failed to sync task:', error)
      }
    }
  } catch (error) {
    console.error('Sync failed:', error)
  }
}

// 打开IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wanneng-task-db', 1)
    
    request.onupgradeneeded = event => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('offline_tasks')) {
        db.createObjectStore('offline_tasks', { keyPath: 'id' })
      }
    }
    
    request.onsuccess = event => resolve(event.target.result)
    request.onerror = event => reject(event.target.error)
  })
}

// 推送通知
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/tasks'
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('万能任务', options)
  )
})

// 通知点击事件
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
