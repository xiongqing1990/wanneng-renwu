/**
 * 全局错误处理工具
 * 企业级错误处理机制
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

// 错误级别定义
const ErrorLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
}

// 错误类型定义
const ErrorType = {
  NETWORK: 'NETWORK_ERROR',
  API: 'API_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTH: 'AUTH_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  BUSINESS: 'BUSINESS_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

class ErrorHandler {
  constructor() {
    this.errorQueue = []
    this.maxQueueSize = 100
    this.enabled = true
    this.reportUrl = '' // 错误上报地址
  }

  /**
   * 初始化错误处理器
   * @param {Object} config 配置项
   */
  init(config = {}) {
    this.reportUrl = config.reportUrl || ''
    this.enabled = config.enabled !== false
    this.maxQueueSize = config.maxQueueSize || 100
    
    // 捕获全局错误
    this._setupGlobalErrorHandler()
    
    console.log('[ErrorHandler] 初始化成功')
  }

  /**
   * 处理错误
   * @param {Error|Object} error 错误对象
   * @param {string} type 错误类型
   * @param {string} level 错误级别
   * @param {Object} context 上下文信息
   */
  handle(error, type = ErrorType.UNKNOWN, level = ErrorLevel.ERROR, context = {}) {
    if (!this.enabled) return

    const errorInfo = this._normalizeError(error, type, level, context)
    
    // 添加到队列
    this._addToQueue(errorInfo)
    
    // 打印到控制台
    this._logToConsole(errorInfo)
    
    // 上报到服务器
    this._reportToServer(errorInfo)
    
    // 根据级别处理
    this._handleByLevel(errorInfo)
    
    return errorInfo
  }

  /**
   * 标准化错误对象
   * @private
   */
  _normalizeError(error, type, level, context) {
    const now = new Date()
    
    return {
      message: error.message || String(error),
      stack: error.stack || '',
      type: type,
      level: level,
      context: {
        ...context,
        url: window.location?.href || '',
        userAgent: navigator?.userAgent || '',
        timestamp: now.getTime(),
        userId: uni.getStorageSync('userId') || 'unknown'
      },
      time: now.toISOString()
    }
  }

  /**
   * 添加到错误队列
   * @private
   */
  _addToQueue(errorInfo) {
    this.errorQueue.unshift(errorInfo)
    
    // 限制队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(0, this.maxQueueSize)
    }
    
    // 保存到本地存储（最近的20条）
    try {
      const recentErrors = this.errorQueue.slice(0, 20)
      uni.setStorageSync('recent_errors', recentErrors)
    } catch (e) {
      console.warn('[ErrorHandler] 保存错误队列失败', e)
    }
  }

  /**
   * 打印到控制台
   * @private
   */
  _logToConsole(errorInfo) {
    const { message, type, level, stack } = errorInfo
    const prefix = `[${type}]`
    
    switch (level) {
      case ErrorLevel.DEBUG:
        console.debug(prefix, message, errorInfo.context)
        break
      case ErrorLevel.INFO:
        console.info(prefix, message, errorInfo.context)
        break
      case ErrorLevel.WARN:
        console.warn(prefix, message, errorInfo.context)
        break
      case ErrorLevel.ERROR:
      case ErrorLevel.FATAL:
        console.error(prefix, message, stack, errorInfo.context)
        break
    }
  }

  /**
   * 上报到服务器
   * @private
   */
  _reportToServer(errorInfo) {
    if (!this.reportUrl) return
    
    // 节流：相同错误1分钟内只上报一次
    const cacheKey = `error_${errorInfo.type}_${errorInfo.message}`
    const lastReport = uni.getStorageSync(cacheKey)
    const now = Date.now()
    
    if (lastReport && now - lastReport < 60000) {
      return // 1分钟内重复错误不上报
    }
    
    uni.setStorageSync(cacheKey, now)
    
    // 上报
    uni.request({
      url: this.reportUrl,
      method: 'POST',
      data: errorInfo,
      fail: (err) => {
        console.warn('[ErrorHandler] 错误上报失败', err)
      }
    })
  }

  /**
   * 根据级别处理
   * @private
   */
  _handleByLevel(errorInfo) {
    switch (errorInfo.level) {
      case ErrorLevel.FATAL:
        // 致命错误：显示弹窗并建议重启
        uni.showModal({
          title: '严重错误',
          content: '应用遇到严重错误，建议重启应用。',
          showCancel: true,
          confirmText: '重启',
          success: (res) => {
            if (res.confirm) {
              this._restartApp()
            }
          }
        })
        break
        
      case ErrorLevel.ERROR:
        // 普通错误：可选是否显示给用户
        if (errorInfo.type === ErrorType.NETWORK) {
          uni.showToast({
            title: '网络错误，请检查网络',
            icon: 'none'
          })
        }
        break
        
      case ErrorLevel.WARN:
        // 警告：仅记录
        break
    }
  }

  /**
   * 设置全局错误捕获
   * @private
   */
  _setupGlobalErrorHandler() {
    // Vue错误捕获（需要在main.js中调用）
    if (typeof Vue !== 'undefined') {
      Vue.config.errorHandler = (err, vm, info) => {
        this.handle(err, ErrorType.UNKNOWN, ErrorLevel.ERROR, {
          component: vm?.$options?.name || 'unknown',
          info: info
        })
      }
    }
    
    // Promise拒绝捕获
    window.addEventListener('unhandledrejection', (event) => {
      this.handle(
        new Error(event.reason),
        ErrorType.UNKNOWN,
        ErrorLevel.ERROR,
        { source: 'unhandledrejection' }
      )
    })
  }

  /**
   * 重启应用
   * @private
   */
  _restartApp() {
    // 清理缓存
    try {
      uni.clearStorageSync()
    } catch (e) {
      console.warn('[ErrorHandler] 清理缓存失败', e)
    }
    
    // 重启
    uni.reLaunch({
      url: '/pages/index/index'
    })
  }

  /**
   * 获取错误队列
   */
  getErrors() {
    return this.errorQueue
  }

  /**
   * 清空错误队列
   */
  clearErrors() {
    this.errorQueue = []
    uni.removeStorageSync('recent_errors')
  }

  /**
   * 创建自定义错误
   */
  createError(message, type = ErrorType.BUSINESS, code = null) {
    const error = new Error(message)
    error.type = type
    error.code = code
    return error
  }
}

// 导出单例
const errorHandler = new ErrorHandler()

export default errorHandler
export { ErrorLevel, ErrorType, ErrorHandler }
