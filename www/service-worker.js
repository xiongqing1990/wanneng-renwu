/**
 * PWA Service Worker
 * 提供离线支持、缓存策略、后台同步
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

const CACHE_NAME = 'wanneng-renwu-v1.0.0'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/static/css/app.css',
  '/static/js/app.js',
  '/static/img/logo.png',
  '/pages/index/index',
  '/pages/publish/publish',
  '/pages/chat/chat',
  '/pages/user/user'
]

// 安装事件 - 缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 缓存核心资源')
        return cache.addAll(ASSETS_TO_CACHE)
      })
      .then(() => {
        console.log('[SW] 安装完成')
        return self.skipWaiting()
      })
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] 删除旧缓存:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] 激活完成')
        return self.clients.claim()
      })
  )
})

// 请求拦截 - 缓存优先策略
self.addEventListener('fetch', event => {
  // 导航请求 - 网络优先
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request) ||
                 caches.match('/index.html')
        })
    )
    return
  }
  
  // API请求 - 网络优先，失败后返回缓存
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // 缓存成功的GET请求
          if (event.request.method === 'GET' && response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone)
              })
          }
          return response
        })
        .catch(() => {
          return caches.match(event.request)
        })
    )
    return
  }
  
  // 静态资源 - 缓存优先
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // 后台更新缓存
          fetchAndCache(event.request)
          return response
        }
        
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone)
                })
            }
            return response
          })
      })
  )
})

// 后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-task') {
    event.waitUntil(syncTasks())
  }
})

// 推送通知
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/static/img/icon-192x192.png',
    badge: '/static/img/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/pages/task/task'
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('万能任务', options)
  )
})

// 通知点击
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})

// 辅助函数：获取并更新缓存
async function fetchAndCache(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response)
    }
  } catch (error) {
    console.log('[SW] 后台更新失败:', error)
  }
}

// 辅助函数：同步任务
async function syncTasks() {
  const db = await openDatabase()
  const offlineTasks = await db.getAll('offline_tasks')
  
  for (const task of offlineTasks) {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(task)
      })
      
      // 同步成功，删除离线记录
      await db.delete('offline_tasks', task.id)
    } catch (error) {
      console.log('[SW] 同步失败:', error)
    }
  }
}

// 辅助函数：打开数据库
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wanneng-renwu', 1)
    
    request.onupgradeneeded = event => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('offline_tasks')) {
        db.createObjectStore('offline_tasks', { keyPath: 'id' })
      }
    }
    
    request.onsuccess = event => {
      resolve(event.target.result)
    }
    
    request.onerror = event => {
      reject(event.target.error)
    }
  })
}
