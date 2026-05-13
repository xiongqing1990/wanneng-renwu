/**
 * HTTPS强制工具
 * HSTS、重定向、混合内容检测
 */

class HTTPSEnforcer {
  constructor(options = {}) {
    this.hstsMaxAge = options.hstsMaxAge || 31536000 // 1年
    this.includeSubDomains = options.includeSubDomains !== false
    this.preload = options.preload || false
    this.upgradeInsecureRequests = options.upgradeInsecureRequests !== false
  }
  
  /**
   * 应用HSTS头部
   */
  applyHSTS(res) {
    let value = `max-age=${this.hstsMaxAge}`
    
    if (this.includeSubDomains) {
      value += '; includeSubDomains'
    }
    
    if (this.preload) {
      value += '; preload'
    }
    
    res.setHeader('Strict-Transport-Security', value)
  }
  
  /**
   * 重定向HTTP到HTTPS
   */
  redirectToHTTPS(req, res) {
    if (!req.socket.encrypted && req.headers['x-forwarded-proto'] !== 'https') {
      const httpsUrl = `https://${req.headers.host}${req.url}`
      
      res.writeHead(301, {
        'Location': httpsUrl,
        'Strict-Transport-Security': `max-age=${this.hstsMaxAge}`
      })
      
      res.end()
      return true
    }
    
    return false
  }
  
  /**
   * 检测混合内容（浏览器端）
   */
  detectMixedContent() {
    if (typeof window === 'undefined') return
    
    // 检测不安全的请求
    const insecureRequests = []
    
    // 检查所有资源
    const resources = [
      ...Array.from(document.querySelectorAll('img[src]')).map(el => ({ type: 'img', url: el.src })),
      ...Array.from(document.querySelectorAll('script[src]')).map(el => ({ type: 'script', url: el.src })),
      ...Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(el => ({ type: 'stylesheet', url: el.href })),
      ...Array.from(document.querySelectorAll('iframe[src]')).map(el => ({ type: 'iframe', url: el.src }))
    ]
    
    resources.forEach(resource => {
      if (resource.url.startsWith('http://')) {
        insecureRequests.push(resource)
        console.warn('Mixed Content:', resource.type, resource.url)
      }
    })
    
    return insecureRequests
  }
  
  /**
   * 升级不安全的请求（浏览器端）
   */
  upgradeInsecureRequests() {
    if (typeof window === 'undefined') return
    
    // 升级所有http://请求到https://
    document.querySelectorAll('[src^="http://"]').forEach(element => {
      const attribute = element.src ? 'src' : 'href'
      element[attribute] = element[attribute].replace('http://', 'https://')
    })
  }
  
  /**
   * 检查是否通过HTTPS加载
   */
  isHTTPS() {
    if (typeof window === 'undefined') return false
    
    return window.location.protocol === 'https:'
  }
  
  /**
   * 获取HSTS头部值
   */
  getHSTSHeaderValue() {
    let value = `max-age=${this.hstsMaxAge}`
    
    if (this.includeSubDomains) {
      value += '; includeSubDomains'
    }
    
    if (this.preload) {
      value += '; preload'
    }
    
    return value
  }
  
  /**
   * 设置HSTS配置
   */
  configure(options = {}) {
    if (options.maxAge !== undefined) {
      this.hstsMaxAge = options.maxAge
    }
    
    if (options.includeSubDomains !== undefined) {
      this.includeSubDomains = options.includeSubDomains
    }
    
    if (options.preload !== undefined) {
      this.preload = options.preload
    }
  }
  
  /**
   * 生成安全头部集合
   */
  generateSecurityHeaders() {
    const headers = {}
    
    // HSTS
    headers['Strict-Transport-Security'] = this.getHSTSHeaderValue()
    
    // 其他选项
    if (this.upgradeInsecureRequests) {
      headers['Content-Security-Policy'] = "upgrade-insecure-requests"
    }
    
    return headers
  }
  
  /**
   * 应用安全头部
   */
  applySecurityHeaders(res) {
    const headers = this.generateSecurityHeaders()
    
    Object.keys(headers).forEach(header => {
      res.setHeader(header, headers[header])
    })
  }
}

// 创建默认HTTPS强制器
const httpsEnforcer = new HTTPSEnforcer({
  hstsMaxAge: 31536000,
  includeSubDomains: true,
  preload: true,
  upgradeInsecureRequests: true
})

// Vue插件
export const HTTPSEnforcerPlugin = {
  install(Vue, options) {
    const enforcer = new HTTPSEnforcer(options)
    
    Vue.prototype.$https = enforcer
    
    // 在开发环境中检测混合内容
    if (process.env.NODE_ENV === 'development') {
      Vue.mixin({
        mounted() {
          if (enforcer.isHTTPS()) {
            enforcer.detectMixedContent()
          }
        }
      })
    }
  }
}

export default httpsEnforcer
