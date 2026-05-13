/**
 * CSP策略管理
 * Content Security Policy
 */

class CSPManager {
  constructor(options = {}) {
    this.policy = {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
    
    this.reportOnly = options.reportOnly || false
    this.reportUri = options.reportUri || '/api/csp-report'
    
    if (options.policy) {
      this.updatePolicy(options.policy)
    }
  }
  
  /**
   * 更新CSP策略
   */
  updatePolicy(newPolicy) {
    Object.assign(this.policy, newPolicy)
  }
  
  /**
   * 添加策略指令
   */
  addDirective(directive, ...sources) {
    if (!this.policy[directive]) {
      this.policy[directive] = []
    }
    
    sources.forEach(source => {
      if (!this.policy[directive].includes(source)) {
        this.policy[directive].push(source)
      }
    })
  }
  
  /**
   * 移除策略指令
   */
  removeDirective(directive, source) {
    if (this.policy[directive]) {
      const index = this.policy[directive].indexOf(source)
      if (index > -1) {
        this.policy[directive].splice(index, 1)
      }
    }
  }
  
  /**
   * 生成CSP头部值
   */
  generateHeaderValue() {
    return Object.keys(this.policy)
      .map(directive => {
        const sources = this.policy[directive].join(' ')
        return `${directive} ${sources}`
      })
      .join('; ')
  }
  
  /**
   * 应用CSP到HTTP响应头
   */
  applyToResponse(res) {
    const headerName = this.reportOnly 
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy'
    
    const value = this.generateHeaderValue()
    
    if (this.reportUri) {
      value += `; report-uri ${this.reportUri}`
    }
    
    res.setHeader(headerName, value)
  }
  
  /**
   * 应用CSP到Meta标签
   */
  applyToMeta() {
    let meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    
    if (!meta) {
      meta = document.createElement('meta')
      meta.httpEquiv = 'Content-Security-Policy'
      document.head.appendChild(meta)
    }
    
    meta.content = this.generateHeaderValue()
  }
  
  /**
   * 设置报告模式
   */
  setReportOnly(reportOnly = true) {
    this.reportOnly = reportOnly
  }
  
  /**
   * 设置报告URI
   */
  setReportUri(uri) {
    this.reportUri = uri
  }
  
  /**
   * 默认安全策略（严格）
   */
  setStrictPolicy() {
    this.policy = {
      'default-src': ["'none'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
  }
  
  /**
   * 开发环境策略（宽松）
   */
  setDevelopmentPolicy() {
    this.policy = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:', 'http:'],
      'font-src': ["'self'", 'data:'],
      'connect-src': ["'self'", 'http://localhost:*', 'ws://localhost:*'],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'self'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
  }
  
  /**
   * 处理CSP报告
   */
  static handleReport(req, res) {
    let body = ''
    
    req.on('data', chunk => {
      body += chunk.toString()
    })
    
    req.on('end', () => {
      try {
        const report = JSON.parse(body)
        console.log('CSP Violation:', report)
        
        // 保存到数据库或发送警报到监控
        // ...
        
        res.writeHead(204)
        res.end()
      } catch (error) {
        res.writeHead(400)
        res.end('Invalid report')
      }
    })
  }
}

// 创建默认CSP管理器
const cspManager = new CSPManager({
  reportOnly: process.env.NODE_ENV === 'development',
  reportUri: '/api/csp-report'
})

// 根据环境设置策略
if (process.env.NODE_ENV === 'development') {
  cspManager.setDevelopmentPolicy()
} else {
  cspManager.setStrictPolicy()
}

// Vue插件
export const CSPPlugin = {
  install(Vue, options) {
    const manager = new CSPManager(options)
    
    Vue.prototype.$csp = manager
  }
}

export default cspManager
