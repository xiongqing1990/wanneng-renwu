/**
 * 安全审计工具
 * OWASP Top 10 检测、漏洞扫描
 */

class SecurityAudit {
  constructor(options = {}) {
    this.owaspTop10 = [
      'A01:2021-Broken-Access-Control',
      'A02:2021-Cryptographic-Failures',
      'A03:2021-Injection',
      'A04:2021-Insecure-Design',
      'A05:2021-Security-Misconfiguration',
      'A06:2021-Vulnerable-and-Outdated-Components',
      'A07:2021-Identification-and-Authentication-Failures',
      'A08:2021-Software-and-Data-Integrity-Failures',
      'A09:2021-Security-Logging-and-Monitoring-Failures',
      'A10:2021-Server-Side-Request-Forgery'
    ]
    
    this.auditResults = []
    this.pass = 0
    this.fail = 0
    this.warn = 0
  }
  
  /**
   * 运行完整审计
   */
  async runFullAudit() {
    console.log('Starting security audit...')
    
    this.auditResults = []
    this.pass = 0
    this.fail = 0
    this.warn = 0
    
    // 检查各项
    await this.checkHTTPS()
    await this.checkHeaders()
    await this.checkCSP()
    await this.checkAuthentication()
    await this.checkInputValidation()
    await this.checkXSSProtection()
    await this.checkCSRFProtection()
    await this.checkSQLInjection()
    await this.checkSensitiveDataExposure()
    await this.checkBrokenAccessControl()
    await this.checkSecurityConfiguration()
    
    console.log('Security audit completed!')
    console.log(`Pass: ${this.pass}, Fail: ${this.fail}, Warn: ${this.warn}`)
    
    return this.generateReport()
  }
  
  /**
   * A05: 检查HTTPS配置
   */
  async checkHTTPS() {
    this.addResult('A05:2021-Security-Misconfiguration', 'HTTPS', 'checking')
    
    if (typeof window !== 'undefined') {
      // 浏览器环境
      if (window.location.protocol === 'https:') {
        this.addResult('A05', 'HTTPS', 'pass', 'HTTPS is enabled')
      } else {
        this.addResult('A05', 'HTTPS', 'fail', 'HTTPS is not enabled')
      }
    } else {
      // Node.js环境 - 检查HSTS头等
      this.addResult('A05', 'HTTPS', 'warn', 'Cannot check HTTPS in Node.js environment')
    }
  }
  
  /**
   * 检查安全头部
   */
  async checkHeaders() {
    this.addResult('A05:2021-Security-Misconfiguration', 'Security Headers', 'checking')
    
    if (typeof document !== 'undefined') {
      const headers = [
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Content-Security-Policy'
      ]
      
      const missingHeaders = []
      
      // 注意：浏览器环境无法直接读取响应头
      // 这里仅作示例
      this.addResult('A05', 'Security Headers', 'warn', 'Cannot check response headers in browser')
    } else {
      this.addResult('A05', 'Security Headers', 'warn', 'Cannot check headers in Node.js environment')
    }
  }
  
  /**
   * 检查CSP
   */
  async checkCSP() {
    this.addResult('A05:2021-Security-Misconfiguration', 'CSP', 'checking')
    
    if (typeof document !== 'undefined') {
      const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
      
      if (metaCSP) {
        this.addResult('A05', 'CSP', 'pass', 'CSP meta tag found')
      } else {
        this.addResult('A05', 'CSP', 'warn', 'CSP meta tag not found')
      }
    } else {
      this.addResult('A05', 'CSP', 'warn', 'Cannot check CSP in Node.js environment')
    }
  }
  
  /**
   * A07: 检查身份认证
   */
  async checkAuthentication() {
    this.addResult('A07:2021-Identification-and-Authentication-Failures', 'Authentication', 'checking')
    
    // 检查是否实现了MFA
    // 检查密码策略
    // 检查会话管理
    
    this.addResult('A07', 'Authentication', 'warn', 'Authentication checks not fully implemented')
  }
  
  /**
   * 检查输入验证
   */
  async checkInputValidation() {
    this.addResult('A03:2021-Injection', 'Input Validation', 'checking')
    
    // 查找未验证的输入点
    const forms = document.querySelectorAll('form')
    const inputs = document.querySelectorAll('input, textarea, select')
    
    let unvalidatedInputs = 0
    
    inputs.forEach(input => {
      // 检查是否有验证属性或事件监听
      if (!input.pattern && !input.required && !input.min && !input.max) {
        unvalidatedInputs++
      }
    })
    
    if (unvalidatedInputs > 0) {
      this.addResult('A03', 'Input Validation', 'warn', `${unvalidatedInputs} inputs may lack validation`)
    } else {
      this.addResult('A03', 'Input Validation', 'pass', 'All inputs appear to have validation')
    }
  }
  
  /**
   * 检查XSS防护
   */
  async checkXSSProtection() {
    this.addResult('A03:2021-Injection', 'XSS Protection', 'checking')
    
    // 检查是否使用了v-html（Vue）
    const vueInstances = document.querySelectorAll('[data-v-app]')
    
    // 检查是否有未转义的输出
    // 这是一个简化示例
    
    this.addResult('A03', 'XSS Protection', 'warn', 'XSS protection checks not fully implemented')
  }
  
  /**
   * 检查CSRF防护
   */
  async checkCSRFProtection() {
    this.addResult('A01:2021-Broken-Access-Control', 'CSRF Protection', 'checking')
    
    // 检查是否有CSRF Token
    const csrfToken = document.querySelector('input[name="csrf_token"]')
    
    if (csrfToken) {
      this.addResult('A01', 'CSRF Protection', 'pass', 'CSRF token found')
    } else {
      this.addResult('A01', 'CSRF Protection', 'warn', 'CSRF token not found')
    }
  }
  
  /**
   * A03: 检查SQL注入
   */
  async checkSQLInjection() {
    this.addResult('A03:2021-Injection', 'SQL Injection', 'checking')
    
    // 检查是否有直接的SQL查询
    // 检查是否使用了参数化查询
    
    this.addResult('A03', 'SQL Injection', 'pass', 'SQL injection checks not applicable in frontend')
  }
  
  /**
   * A02: 检查敏感数据暴露
   */
  async checkSensitiveDataExposure() {
    this.addResult('A02:2021-Cryptographic-Failures', 'Sensitive Data Exposure', 'checking')
    
    // 检查是否在控制台输出敏感信息
    // 检查是否在本地存储中存储敏感信息
    
    const localStorageKeys = Object.keys(localStorage)
    const sessionStorageKeys = Object.keys(sessionStorage)
    
    const sensitiveKeywords = ['password', 'token', 'secret', 'key']
    
    let foundSensitive = false
    
    ;[...localStorageKeys, ...sessionStorageKeys].forEach(key => {
      if (sensitiveKeywords.some(keyword => key.toLowerCase().includes(keyword))) {
        foundSensitive = true
        this.addResult('A02', 'Sensitive Data Exposure', 'fail', `Sensitive data may be stored in ${key}`)
      }
    })
    
    if (!foundSensitive) {
      this.addResult('A02', 'Sensitive Data Exposure', 'pass', 'No sensitive data found in storage')
    }
  }
  
  /**
   * A01: 检查访问控制
   */
  async checkBrokenAccessControl() {
    this.addResult('A01:2021-Broken-Access-Control', 'Access Control', 'checking')
    
    // 检查是否有客户端权限控制
    // 检查是否依赖客户端验证
    
    this.addResult('A01', 'Access Control', 'warn', 'Access control checks not fully implemented')
  }
  
  /**
   * A06: 检查过期组件
   */
  async checkSecurityConfiguration() {
    this.addResult('A06:2021-Vulnerable-and-Outdated-Components', 'Security Configuration', 'checking')
    
    // 检查依赖版本
    // 检查配置错误
    
    this.addResult('A06', 'Security Configuration', 'warn', 'Security configuration checks not fully implemented')
  }
  
  /**
   * 添加审计结果
   */
  addResult(category, check, status, details = '') {
    const result = {
      category,
      check,
      status, // 'pass', 'fail', 'warn', 'checking'
      details,
      timestamp: new Date().toISOString()
    }
    
    this.auditResults.push(result)
    
    if (status === 'pass') {
      this.pass++
    } else if (status === 'fail') {
      this.fail++
    } else if (status === 'warn') {
      this.warn++
    }
  }
  
  /**
   * 生成审计报告
   */
  generateReport() {
    const report = {
      summary: {
        total: this.auditResults.length,
        pass: this.pass,
        fail: this.fail,
        warn: this.warn,
        passRate: ((this.pass / this.auditResults.length) * 100).toFixed(2) + '%'
      },
      results: this.auditResults,
      recommendations: this.generateRecommendations()
    }
    
    return report
  }
  
  /**
   * 生成改进建议
   */
  generateRecommendations() {
    const recommendations = []
    
    // 根据审计结果生成建议
    this.auditResults.forEach(result => {
      if (result.status === 'fail') {
        switch (result.category) {
          case 'A01':
            recommendations.push('Implement proper access controls and validate on server-side')
            break
          case 'A02':
            recommendations.push('Ensure sensitive data is properly encrypted and not exposed')
            break
          case 'A03':
            recommendations.push('Implement input validation and parameterized queries')
            break
          case 'A05':
            recommendations.push('Enable HTTPS and configure security headers')
            break
          default:
            recommendations.push(`Fix security issue in ${result.check}`)
        }
      } else if (result.status === 'warn') {
        recommendations.push(`Review ${result.check} for potential improvements`)
      }
    })
    
    return [...new Set(recommendations)] // 去重
  }
  
  /**
   * 导出报告
   */
  exportReport(format = 'json') {
    const report = this.generateReport()
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2)
    } else if (format === 'html') {
      // 生成HTML报告
      return this.generateHTMLReport(report)
    }
    
    return report
  }
  
  /**
   * 生成HTML报告
   */
  generateHTMLReport(report) {
    let html = '<!DOCTYPE html>\n<html>\n<head>\n'
    html += '<title>Security Audit Report</title>\n'
    html += '<style>table { border-collapse: collapse; width: 100%; }'
    html += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }'
    html += 'th { background-color: #f2f2f2; }'
    html += '.pass { color: green; } .fail { color: red; } .warn { color: orange; }'
    html += '</style>\n</head>\n<body>\n'
    
    html += '<h1>Security Audit Report</h1>\n'
    html += '<h2>Summary</h2>\n'
    html += `<p>Total: ${report.summary.total}, Pass: ${report.summary.pass}, Fail: ${report.summary.fail}, Warn: ${report.summary.warn}</p>\n`
    html += `<p>Pass Rate: ${report.summary.passRate}</p>\n`
    
    html += '<h2>Details</h2>\n'
    html += '<table>\n'
    html += '<tr><th>Category</th><th>Check</th><th>Status</th><th>Details</th></tr>\n'
    
    report.results.forEach(result => {
      html += `<tr>\n`
      html += `<td>${result.category}</td>\n`
      html += `<td>${result.check}</td>\n`
      html += `<td class="${result.status}">${result.status}</td>\n`
      html += `<td>${result.details}</td>\n`
      html += '</tr>\n`
    })
    
    html += '</table>\n'
    
    if (report.recommendations.length > 0) {
      html += '<h2>Recommendations</h2>\n'
      html += '<ul>\n'
      report.recommendations.forEach(rec => {
        html += `<li>${rec}</li>\n`
      })
      html += '</ul>\n'
    }
    
    html += '</body>\n</html>'
    
    return html
  }
}

// 创建默认安全审计实例
const securityAudit = new SecurityAudit()

// Vue插件
export const SecurityAuditPlugin = {
  install(Vue, options) {
    const audit = new SecurityAudit(options)
    
    Vue.prototype.$securityAudit = audit
    
    // 在开发环境中运行审计
    if (process.env.NODE_ENV === 'development') {
      Vue.mixin({
        mounted() {
          // 可以在这里触发审计
        }
      })
    }
  }
}

export default securityAudit
