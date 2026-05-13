/**
 * 事件总线（发布-订阅模式）
 * 用于组件间解耦通信
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

class EventBus {
  constructor() {
    this.events = {}
    this.onceEvents = {}
    this.maxListeners = 10  // 防止内存泄漏
  }

  /**
   * 监听事件
   * @param {string} event 事件名
   * @param {Function} callback 回调函数
   * @param {Object} context 上下文
   */
  on(event, callback, context = null) {
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function')
    }

    if (!this.events[event]) {
      this.events[event] = []
    }

    // 检查监听器数量
    if (this.events[event].length >= this.maxListeners) {
      console.warn(`[EventBus] 事件 "${event}" 的监听器超过 ${this.maxListeners} 个，可能存在内存泄漏`)
    }

    this.events[event].push({
      callback: callback,
      context: context,
      once: false
    })

    return this  // 支持链式调用
  }

  /**
   * 监听事件（一次性）
   * @param {string} event 事件名
   * @param {Function} callback 回调函数
   * @param {Object} context 上下文
   */
  once(event, callback, context = null) {
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function')
    }

    if (!this.onceEvents[event]) {
      this.onceEvents[event] = []
    }

    this.onceEvents[event].push({
      callback: callback,
      context: context
    })

    return this
  }

  /**
   * 触发事件
   * @param {string} event 事件名
   * @param {...any} args 参数
   */
  emit(event, ...args) {
    let called = false

    // 触发普通监听
    if (this.events[event]) {
      // 创建副本，防止回调中修改数组导致问题
      const listeners = [...this.events[event]]
      
      listeners.forEach(listener => {
        try {
          listener.callback.apply(listener.context, args)
          called = true
        } catch (e) {
          console.error(`[EventBus] 事件 "${event}" 的回调执行失败`, e)
        }
      })
    }

    // 触发一次性监听
    if (this.onceEvents[event]) {
      const listeners = [...this.onceEvents[event]]
      
      // 立即删除
      delete this.onceEvents[event]
      
      listeners.forEach(listener => {
        try {
          listener.callback.apply(listener.context, args)
          called = true
        } catch (e) {
          console.error(`[EventBus] 事件 "${event}" 的一次性回调执行失败`, e)
        }
      })
    }

    // 如果没有任何监听，发出警告
    if (!called && event !== '*') {
      console.debug(`[EventBus] 事件 "${event}" 没有监听器`)
    }

    // 触发通配符监听
    if (event !== '*' && this.events['*']) {
      this.emit('*', event, ...args)
    }

    return this
  }

  /**
   * 移除监听
   * @param {string} event 事件名
   * @param {Function} callback 回调函数（可选，不传则移除所有）
   */
  off(event, callback = null) {
    // 移除普通监听
    if (this.events[event]) {
      if (callback) {
        this.events[event] = this.events[event].filter(
          listener => listener.callback !== callback
        )
      } else {
        delete this.events[event]
      }
    }

    // 移除一次性监听
    if (this.onceEvents[event]) {
      if (callback) {
        this.onceEvents[event] = this.onceEvents[event].filter(
          listener => listener.callback !== callback
        )
      } else {
        delete this.onceEvents[event]
      }
    }

    return this
  }

  /**
   * 移除所有监听
   */
  clear() {
    this.events = {}
    this.onceEvents = {}
    console.log('[EventBus] 所有事件监听已清空')
  }

  /**
   * 获取事件的所有监听器
   * @param {string} event 事件名
   * @returns {Array}
   */
  listeners(event) {
    const result = []
    
    if (this.events[event]) {
      result.push(...this.events[event].map(l => l.callback))
    }
    
    if (this.onceEvents[event]) {
      result.push(...this.onceEvents[event].map(l => l.callback))
    }
    
    return result
  }

  /**
   * 获取所有已注册的事件名
   * @returns {Array<string>}
   */
  eventNames() {
    const names = new Set([
      ...Object.keys(this.events),
      ...Object.keys(this.onceEvents)
    ])
    return Array.from(names)
  }

  /**
   * 设置最大监听器数量
   * @param {number} n 数量
   */
  setMaxListeners(n) {
    this.maxListeners = n
  }
}

// 创建全局事件总线
const eventBus = new EventBus()

// 挂载到uni对象（方便全局访问）
uni.$eventBus = eventBus

export default eventBus
export { EventBus }
