/**
 * WebSocket管理器
 * 实时消息推送、自动重连
 */

class WebSocketManager {
  constructor(options = {}) {
    this.url = options.url || 'ws://localhost:8080'
    this.token = options.token || ''
    this.reconnectInterval = options.reconnectInterval || 3000
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5
    this.heartbeatInterval = options.heartbeatInterval || 30000
    
    this.ws = null
    this.reconnectAttempts = 0
    this.heartbeatTimer = null
    this.reconnectTimer = null
    
    this.eventListeners = {}
    this.isManuallyClosed = false
    
    if (options.autoConnect !== false) {
      this.connect()
    }
  }
  
  /**
   * 连接WebSocket
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('WebSocket is already connected')
      return
    }
    
    try {
      this.ws = new WebSocket(`${this.url}?token=${this.token}`)
      this.setupEventListeners()
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      this.scheduleReconnect()
    }
  }
  
  /**
   * 设置事件监听
   */
  setupEventListeners() {
    if (!this.ws) return
    
    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.emit('connect')
    }
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    }
    
    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.stopHeartbeat()
      
      if (!this.isManuallyClosed) {
        this.scheduleReconnect()
      }
      
      this.emit('disconnect', event)
    }
  }
  
  /**
   * 处理接收到的消息
   */
  handleMessage(data) {
    const { type, payload } = data
    
    // 心跳响应
    if (type === 'pong') {
      return
    }
    
    // 触发事件
    this.emit(type, payload)
    this.emit('message', data)
  }
  
  /**
   * 发送消息
   */
  send(type, payload = {}) {
    if (!this.isConnected()) {
      console.error('WebSocket is not connected')
      return false
    }
    
    const message = JSON.stringify({ type, payload })
    
    try {
      this.ws.send(message)
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      return false
    }
  }
  
  /**
   * 开始心跳
   */
  startHeartbeat() {
    this.stopHeartbeat()
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send('ping')
      }
    }, this.heartbeatInterval)
  }
  
  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
  
  /**
   * 安排重连
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      this.emit('reconnect_failed')
      return
    }
    
    this.reconnectAttempts++
    this.emit('reconnecting', this.reconnectAttempts)
    
    console.log(`Reconnecting in ${this.reconnectInterval}ms (attempt ${this.reconnectAttempts})`)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, this.reconnectInterval)
  }
  
  /**
   * 检查是否已连接
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
  
  /**
   * 关闭连接
   */
  close() {
    this.isManuallyClosed = true
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close(1000, 'Manual close')
      this.ws = null
    }
  }
  
  /**
   * 监听事件
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    
    this.eventListeners[event].push(callback)
    
    // 返回取消监听的函数
    return () => {
      this.off(event, callback)
    }
  }
  
  /**
   * 监听事件（一次性）
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args)
      this.off(event, wrapper)
    }
    
    this.on(event, wrapper)
  }
  
  /**
   * 触发事件
   */
  emit(event, data) {
    if (!this.eventListeners[event]) return
    
    this.eventListeners[event].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in WebSocket event listener (${event}):`, error)
      }
    })
  }
  
  /**
   * 取消监听
   */
  off(event, callback) {
    if (!this.eventListeners[event]) return
    
    if (callback) {
      const index = this.eventListeners[event].indexOf(callback)
      if (index > -1) {
        this.eventListeners[event].splice(index, 1)
      }
    } else {
      // 如果没有指定callback，移除所有该事件的监听
      delete this.eventListeners[event]
    }
  }
  
  /**
   * 更新Token
   */
  setToken(token) {
    this.token = token
  }
  
  /**
   * 销毁
   */
  destroy() {
    this.close()
    this.eventListeners = {}
  }
}

// 创建默认WebSocket管理器
const wsManager = new WebSocketManager({
  url: 'ws://localhost:8080',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5
})

// Vue插件
export const WebSocketPlugin = {
  install(Vue, options) {
    const manager = new WebSocketManager(options)
    
    Vue.prototype.$ws = manager
    
    Vue.mixin({
      created() {
        // 组件创建时自动连接
        if (this.$options.ws && !manager.isConnected()) {
          manager.connect()
        }
      },
      
      beforeDestroy() {
        // 组件销毁时不自动关闭（可能有其他组件在使用）
      }
    })
  }
}

export default wsManager
