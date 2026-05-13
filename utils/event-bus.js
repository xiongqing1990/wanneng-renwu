/**
 * 事件总线
 * 解耦组件通信
 */

class EventBus {
  constructor() {
    this.events = new Map()
    this.onceEvents = new Map()
  }
  
  /**
   * 监听事件
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    
    this.events.get(event).push(callback)
    
    // 返回取消监听的函数
    return () => this.off(event, callback)
  }
  
  /**
   * 监听事件（一次性）
   */
  once(event, callback) {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, [])
    }
    
    this.onceEvents.get(event).push(callback)
  }
  
  /**
   * 触发事件
   */
  emit(event, ...args) {
    // 触发普通事件
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)
      callbacks.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`EventBus error in "${event}":`, error)
        }
      })
    }
    
    // 触发一次性事件
    if (this.onceEvents.has(event)) {
      const callbacks = this.onceEvents.get(event)
      callbacks.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`EventBus once error in "${event}":`, error)
        }
      })
      
      // 清除一次性事件
      this.onceEvents.delete(event)
    }
  }
  
  /**
   * 取消监听
   */
  off(event, callback) {
    if (!callback) {
      // 取消所有监听
      this.events.delete(event)
      this.onceEvents.delete(event)
      return
    }
    
    // 取消特定回调
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
  
  /**
   * 清除所有事件
   */
  clear() {
    this.events.clear()
    this.onceEvents.clear()
  }
  
  /**
   * 获取事件监听器数量
   */
  listenerCount(event) {
    let count = 0
    
    if (this.events.has(event)) {
      count += this.events.get(event).length
    }
    
    if (this.onceEvents.has(event)) {
      count += this.onceEvents.get(event).length
    }
    
    return count
  }
}

// 创建全局事件总线
const eventBus = new EventBus()

export default eventBus
