/**
 * 前端错误监控配置（Sentry）
 * 错误上报、性能监控、用户行为追踪
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

// Sentry 初始化配置
const SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0'

class ErrorMonitoring {
  constructor() {
    this.initialized = false
    this.sentryAvailable = false
  }

  /**
   * 初始化错误监控
   */
  init() {
    // 检查是否在浏览器环境
    if (typeof window === 'undefined') {
      console.warn('[ErrorMonitoring] 非浏览器环境，跳过初始化')
      return
    }

    // 检查 Sentry SDK 是否已加载
    if (!window.Sentry) {
      console.warn('[ErrorMonitoring] Sentry SDK 未加载')
      return
    }

    try {
      window.Sentry.init({
        dsn: SENTRY_DSN,
        integrations: [
          new window.Sentry.Integrations.Vue({
            Vue: window.Vue,
            attachProps: true
          }),
          new window.Sentry.Integrations.HttpContext(),
          new window.Sentry.Integrations.Dedupe()
        ],
        // 性能监控
        tracesSampleRate: 1.0,
        // 会话重放
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        // 环境
        environment: process.env.NODE_ENV || 'development',
        // 发布版本
        release: 'wanneng-renwu@1.0.0',
        // 错误处理
        beforeSend: (event, hint) => {
          // 过滤敏感信息
          if (event.request) {
            // 移除 Authorization header
            delete event.request.headers?.Authorization
          }
          
          // 过滤特定错误
          if (event.exception) {
            const error = hint?.originalException
            if (error && error.message?.includes('Network Error')) {
              return null  // 不上报网络错误
            }
          }
          
          return event
        }
      })

      this.sentryAvailable = true
      this.initialized = true
      console.log('[ErrorMonitoring] Sentry 初始化成功')
    } catch (e) {
      console.error('[ErrorMonitoring] Sentry 初始化失败', e)
    }
  }

  /**
   * 设置用户信息
   * @param {Object} user 用户信息
   */
  setUser(user) {
    if (!this.sentryAvailable) return

    window.Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.nickname
    })
  }

  /**
   * 清除用户信息（登出时）
   */
  clearUser() {
    if (!this.sentryAvailable) return
    window.Sentry.setUser(null)
  }

  /**
   * 添加标签
   * @param {string} key 标签键
   * @param {string} value 标签值
   */
  setTag(key, value) {
    if (!this.sentryAvailable) return
    window.Sentry.setTag(key, value)
  }

  /**
   * 添加自定义上下文
   * @param {string} key 上下文键
   * @param {Object} context 上下文数据
   */
  setContext(key, context) {
    if (!this.sentryAvailable) return
    window.Sentry.setContext(key, context)
  }

  /**
   * 捕获异常
   * @param {Error} error 错误对象
   * @param {Object} context 额外上下文
   */
  captureException(error, context = {}) {
    if (!this.sentryAvailable) {
      console.error('[ErrorMonitoring]', error)
      return
    }

    window.Sentry.captureException(error, {
      extra: context
    })
  }

  /**
   * 捕获消息
   * @param {string} message 消息内容
   * @param {string} level 级别（'fatal', 'error', 'warning', 'info', 'debug'）
   */
  captureMessage(message, level = 'info') {
    if (!this.sentryAvailable) return
    window.Sentry.captureMessage(message, level)
  }

  /**
   * 开始事务（性能监控）
   * @param {string} name 事务名称
   * @param {string} operation 操作类型
   * @returns {Object} 事务对象
   */
  startTransaction(name, operation) {
    if (!this.sentryAvailable) return null

    return window.Sentry.startTransaction({
      name: name,
      op: operation
    })
  }
}

// 导出单例
const errorMonitoring = new ErrorMonitoring()

export default errorMonitoring
export { ErrorMonitoring }
