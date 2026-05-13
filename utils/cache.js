/**
 * LRU缓存管理
 * 支持过期时间、最大容量
 */

class LRUCache {
  constructor(options = {}) {
    this.max = options.max || 100
    this.maxAge = options.maxAge || 0 // 0表示不过期
    this.cache = new Map()
  }
  
  /**
   * 设置缓存
   */
  set(key, value, maxAge = this.maxAge) {
    // 如果超过最大容量，删除最久未使用的
    if (this.cache.size >= this.max && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    const item = {
      value,
      expires: maxAge > 0 ? Date.now() + maxAge : 0
    }
    
    // 删除再添加，保证最新
    this.cache.delete(key)
    this.cache.set(key, item)
  }
  
  /**
   * 获取缓存
   */
  get(key) {
    if (!this.cache.has(key)) return undefined
    
    const item = this.cache.get(key)
    
    // 检查是否过期
    if (item.expires > 0 && Date.now() > item.expires) {
      this.cache.delete(key)
      return undefined
    }
    
    // 更新位置（删除再添加）
    this.cache.delete(key)
    this.cache.set(key, item)
    
    return item.value
  }
  
  /**
   * 检查是否存在（未过期）
   */
  has(key) {
    if (!this.cache.has(key)) return false
    
    const item = this.cache.get(key)
    
    if (item.expires > 0 && Date.now() > item.expires) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
  
  /**
   * 删除缓存
   */
  delete(key) {
    return this.cache.delete(key)
  }
  
  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear()
  }
  
  /**
   * 获取缓存大小
   */
  size() {
    return this.cache.size
  }
  
  /**
   * 获取所有键
   */
  keys() {
    return Array.from(this.cache.keys())
  }
  
  /**
   * 获取所有值（未过期）
   */
  values() {
    const result = []
    for (const [key, item] of this.cache) {
      if (item.expires > 0 && Date.now() > item.expires) {
        this.cache.delete(key)
        continue
      }
      result.push(item.value)
    }
    return result
  }
  
  /**
   * 清理过期缓存
   */
  prune() {
    for (const [key, item] of this.cache) {
      if (item.expires > 0 && Date.now() > item.expires) {
        this.cache.delete(key)
      }
    }
  }
}

// 创建默认缓存实例
const cache = new LRUCache({
  max: 100,
  maxAge: 5 * 60 * 1000 // 5分钟过期
})

export default cache
