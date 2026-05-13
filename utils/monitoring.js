/**
 * Sentry错误监控
 * 自动捕获和上报错误
 */

class Monitoring {
  constructor(options = {}) {
    this.dsn = options.dsn || ''
    this.environment = options.environment || 'production'
    this.release = options.release || '1.0.0'
    this.enabled = options.enabled !== false
    
    this.initialized = false
    
    if (this.enabled) {
      this.init()
    }
  }
  
  init() {
    // 检查Sentry SDK是否已加载
    if (typeof Sentry === 'undefined') {
      console.warn('Sentry SDK not loaded')
      return
    }
    
    Sentry.init({
      dsn: this.dsn,
      environment: this.environment,
      release: this.release,
      integrations: [
        new Sentry.Integrations.BrowserTracing(),
        new Sentry.Integrations.Vue({ Vue })
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0
    })
    
    this.initialized = true
    console.log('Monitoring initialized')
  }
  
  /**
   * 捕获异常
   */
  captureException(error, context = {}) {
    if (!this.initialized) return
    
    Sentry.captureException(error, {
      tags: context.tags || {},
      extra: context.extra || {}
    })
  }
  
  /**
   * 捕获消息
   */
  captureMessage(message, level = 'info') {
    if (!this.initialized) return
    
    Sentry.captureMessage(message, level)
  }
  
  /**
   * 设置用户信息
   */
  setUser(user) {
    if (!this.initialized) return
    
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username
    })
  }
  
  /**
   * 清除用户信息
   */
  clearUser() {
    if (!this.initialized) return
    
    Sentry.configureScope(scope => {
      scope.setUser(null)
    })
  }
  
  /**
   * 设置标签
   */
  setTag(key, value) {
    if (!this.initialized) return
    
    Sentry.setTag(key, value)
  }
  
  /**
   * 设置上下文
   */
  setContext(key, context) {
    if (!this.initialized) return
    
    Sentry.setContext(key, context)
  }
  
  /**
   * 添加面包屑
   */
  addBreadcrumb(breadcrumb) {
    if (!this.initialized) return
    
    Sentry.addBreadcrumb(breadcrumb)
  }
  
  /**
   * 测试错误上报
   */
  test() {
    try {
      throw new Error('Sentry test error')
    } catch (error) {
      this.captureException(error, {
        tags: { test: 'true' }
      })
      console.log('Test error sent to Sentry')
    }
  }
}

// 创建默认监控实例
const monitoring = new Monitoring({
  dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
  environment: process.env.NODE_ENV || 'development',
  release: 'wanneng-task@1.0.0'
})

// Vue插件
export const MonitoringPlugin = {
  install(Vue, options) {
    const monitoringInstance = new Monitoring(options)
    
    Vue.prototype.$monitoring = monitoringInstance
    
    Vue.mixin({
      mounted() {
        // 记录组件挂载
        monitoringInstance.addBreadcrumb({
          category: 'component',
          message: `Component mounted: ${this.$options.name || 'anonymous'}`,
          level: 'info'
        })
      }
    })
  }
}

export default monitoring
