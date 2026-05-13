/**
 * 性能调优工具
 * 防抖、节流、内存管理
 */

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 */
function debounce(fn, delay = 300, immediate = false) {
  let timer = null
  let result
  
  return function(...args) {
    const context = this
    
    if (immediate && !timer) {
      result = fn.apply(context, args)
    }
    
    if (timer) clearTimeout(timer)
    
    timer = setTimeout(() => {
      timer = null
      if (!immediate) {
        result = fn.apply(context, args)
      }
    }, delay)
    
    return result
  }
}

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} interval - 间隔时间（毫秒）
 * @param {boolean} leading - 是否在开始前执行
 * @param {boolean} trailing - 是否在结束后执行
 */
function throttle(fn, interval = 300, leading = true, trailing = true) {
  let lastTime = 0
  let timer = null
  let result
  
  return function(...args) {
    const context = this
    const now = Date.now()
    
    if (!lastTime && !leading) {
      lastTime = now
    }
    
    const remaining = interval - (now - lastTime)
    
    if (remaining <= 0 || remaining > interval) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      
      lastTime = now
      result = fn.apply(context, args)
    } else if (!timer && trailing) {
      timer = setTimeout(() => {
        lastTime = leading ? Date.now() : 0
        timer = null
        result = fn.apply(context, args)
      }, remaining)
    }
    
    return result
  }
}

/**
 * 内存管理工具
 */
class MemoryManager {
  constructor() {
    this.objectPool = new Map()
    this.listeners = new Map()
  }
  
  /**
   * 对象池：获取对象
   */
  getFromPool(className, Class) {
    if (!this.objectPool.has(className)) {
      this.objectPool.set(className, [])
    }
    
    const pool = this.objectPool.get(className)
    
    if (pool.length > 0) {
      return pool.pop()
    } else {
      return new Class()
    }
  }
  
  /**
   * 对象池：归还对象
   */
  returnToPool(className, obj) {
    if (!this.objectPool.has(className)) {
      this.objectPool.set(className, [])
    }
    
    const pool = this.objectPool.get(className)
    
    // 重置对象状态
    if (obj.reset) {
      obj.reset()
    }
    
    pool.push(obj)
  }
  
  /**
   * 监听内存压力
   */
  onMemoryPressure(callback) {
    if (!this.listeners.has('memoryPressure')) {
      this.listeners.set('memoryPressure', [])
    }
    
    this.listeners.get('memoryPressure').push(callback)
  }
  
  /**
   * 触发内存压力处理
   */
  triggerMemoryPressure() {
    if (this.listeners.has('memoryPressure')) {
      this.listeners.get('memoryPressure').forEach(callback => {
        callback()
      })
    }
  }
  
  /**
   * 清理内存
   */
  cleanup() {
    // 清理对象池
    this.objectPool.clear()
    
    // 触发垃圾回收（如果可能）
    if (window.gc) {
      window.gc()
    }
    
    console.log('Memory cleaned up')
  }
  
  /**
   * 获取内存使用情况
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2) + '%'
      }
    }
    
    return null
  }
}

/**
 * 批量执行任务（使用requestIdleCallback）
 */
function scheduleTask(task) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(task, { timeout: 1000 })
  } else {
    setTimeout(task, 0)
  }
}

/**
 * 分批处理大数据集
 */
function processBatch(items, processor, batchSize = 100, callback) {
  let index = 0
  
  function processNextBatch() {
    const batchEnd = Math.min(index + batchSize, items.length)
    
    for (let i = index; i < batchEnd; i++) {
      processor(items[i], i)
    }
    
    index = batchEnd
    
    if (index < items.length) {
      scheduleTask(processNextBatch)
    } else if (callback) {
      callback()
    }
  }
  
  scheduleTask(processNextBatch)
}

/**
 * 创建性能优化的列表渲染器
 */
function createOptimizedList(container, itemHeight, renderItem) {
  const visibleItems = Math.ceil(container.clientHeight / itemHeight)
  let scrollTop = 0
  
  container.addEventListener('scroll', throttle(() => {
    scrollTop = container.scrollTop
    updateVisibleItems()
  }, 16))
  
  function updateVisibleItems() {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = startIndex + visibleItems
    
    // 只渲染可见项
    renderItem(startIndex, endIndex)
  }
  
  return {
    update: updateVisibleItems
  }
}

// 创建默认内存管理器
const memoryManager = new MemoryManager()

// Vue插件
export const PerformancePlugin = {
  install(Vue, options) {
    Vue.prototype.$debounce = debounce
    Vue.prototype.$throttle = throttle
    Vue.prototype.$memoryManager = memoryManager
    
    Vue.mixin({
      beforeDestroy() {
        // 组件销毁时清理内存
        if (this.$options.cleanupOnDestroy) {
          memoryManager.cleanup()
        }
      }
    })
  }
}

export {
  debounce,
  throttle,
  scheduleTask,
  processBatch,
  createOptimizedList
}

export default memoryManager
