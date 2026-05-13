/**
 * 日志上传服务
 * 批量上传日志到服务器
 */

class LogUploader {
  constructor(options = {}) {
    this.uploadUrl = options.uploadUrl || '/api/logs'
    this.batchSize = options.batchSize || 50
    this.uploadInterval = options.uploadInterval || 60000 // 1分钟
    this.enabled = options.enabled !== false
    
    this.logQueue = []
    this.uploadTimer = null
    
    if (this.enabled) {
      this.init()
    }
  }
  
  init() {
    // 定期上传
    this.uploadTimer = setInterval(() => {
      this.upload()
    }, this.uploadInterval)
    
    // 页面卸载时上传
    window.addEventListener('beforeunload', () => {
      this.upload(true)
    })
    
    // 网络恢复时上传
    window.addEventListener('online', () => {
      this.upload()
    })
  }
  
  /**
   * 添加日志到队列
   */
  push(log) {
    this.logQueue.push({
      ...log,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    })
    
    // 队列满了立即上传
    if (this.logQueue.length >= this.batchSize) {
      this.upload()
    }
  }
  
  /**
   * 上传日志
   */
  async upload(synchronous = false) {
    if (this.logQueue.length === 0) return
    
    const logs = [...this.logQueue]
    this.logQueue = []
    
    const data = {
      logs,
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    }
    
    try {
      if (synchronous && navigator.sendBeacon) {
        // 同步上传（页面卸载时）
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
        navigator.sendBeacon(this.uploadUrl, blob)
      } else {
        // 异步上传
        await fetch(this.uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        
        console.log(`Uploaded ${logs.length} logs`)
      }
    } catch (error) {
      // 上传失败，重新放回队列
      this.logQueue = [...logs, ...this.logQueue]
      
      console.error('Failed to upload logs:', error)
    }
  }
  
  /**
   * 获取用户ID
   */
  getUserId() {
    return localStorage.getItem('userId') || 'anonymous'
  }
  
  /**
   * 获取会话ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId')
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('sessionId', sessionId)
    }
    
    return sessionId
  }
  
  /**
   * 立即上传
   */
  flush() {
    return this.upload()
  }
  
  /**
   * 销毁
   */
  destroy() {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer)
      this.uploadTimer = null
    }
    
    // 上传剩余日志
    this.upload(true)
  }
}

// 创建日志上传器实例
const logUploader = new LogUploader({
  uploadUrl: '/api/logs',
  batchSize: 50,
  uploadInterval: 60000
})

// 监听logger的日志
import logger from './logger'

const originalLog = logger.log.bind(logger)
logger.log = (level, message, data) => {
  const result = originalLog(level, message, data)
  
  // 推送日志到上传队列
  logUploader.push({
    level,
    message,
    data
  })
  
  return result
}

export default logUploader
