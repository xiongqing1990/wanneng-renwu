/**
 * 全局错误处理系统
 * 企业级错误处理：捕获、分类、上报
 */

class ErrorHandler {
  constructor(options = {}) {
    this.enabled = options.enabled !== false
    this.maxErrors = options.maxErrors || 100
    this.reportUrl = options.reportUrl || ''
    this.errors = []
    this.listeners = []
    
    if (this.enabled) {
      this.init()
    }
  }
  
  init() {
    // 捕获全局错误
    window.addEventListener('error', (event) => {
      this.capture({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error ? event.error.stack : '',
        timestamp: Date.now()
      })
    })
    
    // 捕获Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      this.capture({
        type: 'promise',
        message: event.reason,
        stack: event.reason.stack || '',
        timestamp: Date.now()
      })
    })
  }
  
  capture(error) {
    if (!this.enabled) return
    
    const errorObj = this.normalize(error)
    this.errors.push(errorObj)
    
    // 限制错误数量
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }
    
    // 通知监听器
    this.notifyListeners(errorObj)
    
    // 上报到服务器
    if (this.reportUrl) {
      this.report(errorObj)
    }
    
    return errorObj
  }
  
  normalize(error) {
    if (error.type) return error
    
    return {
      type: 'javascript',
      message: error.message || String(error),
      stack: error.stack || '',
      timestamp: Date.now()
    }
  }
  
  notifyListeners(error) {
    this.listeners.forEach(listener => {
      try {
        listener(error)
      } catch (e) {
        console.error('Error listener failed:', e)
      }
    })
  }
  
  report(error) {
    if (!this.reportUrl) return
    
    const data = {
      ...error,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId()
    }
    
    // 使用sendBeacon确保错误报告发送
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.reportUrl, JSON.stringify(data))
    } else {
      fetch(this.reportUrl, {
        method: 'POST',
        body: JSON.stringify(data),
        keepalive: true
      }).catch(() => {})
    }
  }
  
  getUserId() {
    // 从store或localStorage获取用户ID
    return localStorage.getItem('userId') || 'anonymous'
  }
  
  addListener(callback) {
    this.listeners.push(callback)
  }
  
  getErrors() {
    return [...this.errors]
  }
  
  clearErrors() {
    this.errors = []
  }
}

export default new ErrorHandler({
  enabled: true,
  maxErrors: 100,
  reportUrl: '/api/errors'
})
