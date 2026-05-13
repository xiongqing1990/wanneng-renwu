/**
 * 缓存策略优化
 * Service Worker缓存策略、HTTP缓存
 */

class CacheStrategy {
  constructor(options = {}) {
    this.defaultStrategy = options.defaultStrategy || 'cache-first'
    this.cacheName = options.cacheName || 'app-cache-v1'
    this.preloadUrls = options.preloadUrls || []
  }
  
  /**
   * Cache First 策略
   * 优先从缓存获取，失败则从网络请求
   */
  async cacheFirst(request) {
    const cache = await caches.open(this.cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // 后台更新缓存
      this.updateCache(request, cache)
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    await cache.put(request, networkResponse.clone())
    
    return networkResponse
  }
  
  /**
   * Network First 策略
   * 优先从网络获取，失败则从缓存读取
   */
  async networkFirst(request) {
    const cache = await caches.open(this.cacheName)
    
    try {
      const networkResponse = await fetch(request)
      await cache.put(request, networkResponse.clone())
      return networkResponse
    } catch (error) {
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        return cachedResponse
      }
      
      throw error
    }
  }
  
  /**
   * Stale While Revalidate 策略
   * 立即返回缓存（如果有），后台更新缓存
   */
  async staleWhileRevalidate(request) {
    const cache = await caches.open(this.cacheName)
    const cachedResponse = await cache.match(request)
    
    const fetchPromise = fetch(request).then(networkResponse => {
      cache.put(request, networkResponse.clone())
      return networkResponse
    })
    
    return cachedResponse || fetchPromise
  }
  
  /**
   * Network Only 策略
   * 仅从网络获取
   */
  async networkOnly(request) {
    return fetch(request)
  }
  
  /**
   * Cache Only 策略
   * 仅从缓存获取
   */
  async cacheOnly(request) {
    const cache = await caches.open(this.cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw new Error('Not found in cache')
  }
  
  /**
   * 更新缓存
   */
  async updateCache(request, cache) {
    try {
      const networkResponse = await fetch(request)
      await cache.put(request, networkResponse)
    } catch (error) {
      console.error('Failed to update cache:', error)
    }
  }
  
  /**
   * 根据请求选择合适的缓存策略
   */
  async handleRequest(request) {
    const url = new URL(request.url)
    const extension = url.pathname.split('.').pop()
    
    // 根据文件类型选择策略
    if (['html'].includes(extension)) {
      return this.networkFirst(request)
    } else if (['js', 'css'].includes(extension)) {
      return this.cacheFirst(request)
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return this.cacheFirst(request)
    } else if (['woff', 'woff2', 'ttf', 'eot'].includes(extension)) {
      return this.cacheFirst(request)
    } else {
      // 默认策略
      return this[this.defaultStrategy](request)
    }
  }
  
  /**
   * 预加载资源
   */
  async preloadResources(urls = this.preloadUrls) {
    const cache = await caches.open(this.cacheName)
    
    for (const url of urls) {
      try {
        const response = await fetch(url)
        await cache.put(url, response)
        console.log(`Preloaded: ${url}`)
      } catch (error) {
        console.error(`Failed to preload: ${url}`, error)
      }
    }
  }
  
  /**
   * 清理旧缓存
   */
  async cleanupOldCaches() {
    const cacheNames = await caches.keys()
    
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('app-cache-') && name !== this.cacheName
    )
    
    for (const name of oldCaches) {
      await caches.delete(name)
      console.log(`Deleted old cache: ${name}`)
    }
  }
  
  /**
   * 获取缓存大小
   */
  async getCacheSize() {
    const cache = await caches.open(this.cacheName)
    const requests = await cache.keys()
    
    let totalSize = 0
    
    for (const request of requests) {
      const response = await cache.match(request)
      const clonedResponse = response.clone()
      const blob = await clonedResponse.blob()
      totalSize += blob.size
    }
    
    return {
      bytes: totalSize,
      mb: (totalSize / (1024 * 1024)).toFixed(2)
    }
  }
  
  /**
   * 清空缓存
   */
  async clearCache() {
    await caches.delete(this.cacheName)
    console.log('Cache cleared')
  }
  
  /**
   * 生成HTTP缓存头
   */
  generateCacheHeaders(type = 'static') {
    const headers = {
      'static': {
        'Cache-Control': 'public, max-age=31536000', // 1年
        'Expires': new Date(Date.now() + 31536000000).toUTCString()
      },
      'html': {
        'Cache-Control': 'no-cache',
        'Expires': '0'
      },
      'api': {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
    
    return headers[type] || headers['static']
  }
}

// 创建默认缓存策略实例
const cacheStrategy = new CacheStrategy({
  defaultStrategy: 'cache-first',
  cacheName: 'wanneng-task-v1',
  preloadUrls: [
    '/',
    '/static/js/main.js',
    '/static/css/main.css'
  ]
})

// Vue插件
export const CacheStrategyPlugin = {
  install(Vue, options) {
    const strategy = new CacheStrategy(options)
    
    Vue.prototype.$cacheStrategy = strategy
    
    Vue.mixin({
      mounted() {
        // 预加载关键资源
        if (this.$options.preload) {
          strategy.preloadResources(this.$options.preload)
        }
      }
    })
  }
}

export default cacheStrategy
