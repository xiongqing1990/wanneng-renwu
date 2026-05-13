/**
 * 缓存管理工具
 * 支持LRU策略、过期时间、内存+磁盘双缓存
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

class CacheManager {
  constructor() {
    this.memoryCache = new Map()
    this.maxMemorySize = 100  // 内存最大缓存条数
    this.maxAge = 5 * 60 * 1000  // 默认5分钟过期
    this.storageKeyPrefix = 'cache_'
  }

  /**
   * 初始化缓存管理器
   */
  init(config = {}) {
    this.maxMemorySize = config.maxMemorySize || this.maxMemorySize
    this.maxAge = config.maxAge || this.maxAge
    
    // 清理过期缓存
    this._cleanExpiredCache()
    
    // 定期清理（每5分钟）
    setInterval(() => {
      this._cleanExpiredCache()
    }, 5 * 60 * 1000)
    
    console.log('[CacheManager] 缓存管理器初始化成功')
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {*} value 缓存值
   * @param {number} maxAge 过期时间(ms)，默认使用全局配置
   */
  set(key, value, maxAge = this.maxAge) {
    const cacheObj = {
      value: value,
      timestamp: Date.now(),
      maxAge: maxAge
    }

    // 存入内存
    if (this.memoryCache.size >= this.maxMemorySize) {
      // LRU策略：删除最早的一条
      const firstKey = this.memoryCache.keys().next().value
      this.memoryCache.delete(firstKey)
    }
    this.memoryCache.set(key, cacheObj)

    // 存入本地存储
    try {
      uni.setStorageSync(this.storageKeyPrefix + key, cacheObj)
    } catch (e) {
      console.warn('[CacheManager] 写入本地缓存失败', e)
    }

    return true
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @param {*} defaultValue 默认值
   * @returns {*} 缓存值
   */
  get(key, defaultValue = null) {
    // 先从内存读取
    let cacheObj = this.memoryCache.get(key)

    // 内存未命中，从本地存储读取
    if (!cacheObj) {
      try {
        cacheObj = uni.getStorageSync(this.storageKeyPrefix + key)
        if (cacheObj) {
          // 恢复到内存
          this.memoryCache.set(key, cacheObj)
        }
      } catch (e) {
        console.warn('[CacheManager] 读取本地缓存失败', e)
      }
    }

    // 缓存未命中
    if (!cacheObj) {
      return defaultValue
    }

    // 检查是否过期
    if (this._isExpired(cacheObj)) {
      this.delete(key)
      return defaultValue
    }

    return cacheObj.value
  }

  /**
   * 删除缓存
   * @param {string} key 缓存键
   */
  delete(key) {
    // 从内存删除
    this.memoryCache.delete(key)

    // 从本地存储删除
    try {
      uni.removeStorageSync(this.storageKeyPrefix + key)
    } catch (e) {
      console.warn('[CacheManager] 删除本地缓存失败', e)
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    // 清空内存
    this.memoryCache.clear()

    // 清空本地存储（只清除带前缀的）
    try {
      const keys = uni.getStorageInfoSync().keys
      keys.forEach(key => {
        if (key.startsWith(this.storageKeyPrefix)) {
          uni.removeStorageSync(key)
        }
      })
    } catch (e) {
      console.warn('[CacheManager] 清空本地缓存失败', e)
    }

    console.log('[CacheManager] 所有缓存已清空')
  }

  /**
   * 检查缓存是否存在且未过期
   * @param {string} key 缓存键
   * @returns {boolean}
   */
  has(key) {
    const value = this.get(key)
    return value !== null
  }

  /**
   * 获取缓存大小
   * @returns {Object} 内存和本地存储的大小
   */
  size() {
    let storageSize = 0
    try {
      const keys = uni.getStorageInfoSync().keys
      keys.forEach(key => {
        if (key.startsWith(this.storageKeyPrefix)) {
          storageSize++
        }
      })
    } catch (e) {
      console.warn('[CacheManager] 获取本地缓存大小失败', e)
    }

    return {
      memory: this.memoryCache.size,
      storage: storageSize
    }
  }

  /**
   * 批量获取缓存
   * @param {Array<string>} keys 缓存键数组
   * @returns {Object} 键值对对象
   */
  getMultiple(keys) {
    const result = {}
    keys.forEach(key => {
      result[key] = this.get(key)
    })
    return result
  }

  /**
   * 批量设置缓存
   * @param {Object} items 键值对对象
   * @param {number} maxAge 过期时间(ms)
   */
  setMultiple(items, maxAge = this.maxAge) {
    Object.keys(items).forEach(key => {
      this.set(key, items[key], maxAge)
    })
  }

  /**
   * 判断缓存是否过期
   * @private
   */
  _isExpired(cacheObj) {
    const now = Date.now()
    return now - cacheObj.timestamp > cacheObj.maxAge
  }

  /**
   * 清理过期缓存
   * @private
   */
  _cleanExpiredCache() {
    const now = Date.now()
    let cleanedCount = 0

    // 清理内存
    for (const [key, cacheObj] of this.memoryCache.entries()) {
      if (this._isExpired(cacheObj)) {
        this.memoryCache.delete(key)
        cleanedCount++
      }
    }

    // 清理本地存储
    try {
      const keys = uni.getStorageInfoSync().keys
      keys.forEach(key => {
        if (key.startsWith(this.storageKeyPrefix)) {
          const cacheObj = uni.getStorageSync(key)
          if (cacheObj && this._isExpired(cacheObj)) {
            uni.removeStorageSync(key)
            cleanedCount++
          }
        }
      })
    } catch (e) {
      console.warn('[CacheManager] 清理过期缓存失败', e)
    }

    if (cleanedCount > 0) {
      console.log(`[CacheManager] 清理了 ${cleanedCount} 条过期缓存`)
    }
  }
}

// 导出单例
const cache = new CacheManager()

export default cache
export { CacheManager }
