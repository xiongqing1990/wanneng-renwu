/**
 * 安全工具集
 * 提供输入验证、数据加密、XSS防护等安全功能
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

class SecurityUtils {
  constructor() {
    this.encryptionKey = 'wan-neng-ren-wu-2026'  // 加密密钥（应从服务器获取）
    this.initialized = false
  }

  /**
   * 初始化安全工具
   */
  init(config = {}) {
    this.encryptionKey = config.encryptionKey || this.encryptionKey
    this.initialized = true
    console.log('[SecurityUtils] 安全工具初始化成功')
  }

  // ==================== 输入验证 ====================

  /**
   * 验证邮箱
   */
  validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(email)
  }

  /**
   * 验证手机号（中国）
   */
  validatePhone(phone) {
    const regex = /^1[3-9]\d{9}$/
    return regex.test(phone)
  }

  /**
   * 验证URL
   */
  validateUrl(url) {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * 验证身份证号（中国）
   */
  validateIdCard(idCard) {
    const regex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    return regex.test(idCard)
  }

  // ==================== XSS防护 ====================

  /**
   * HTML转义（防XSS）
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return text
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;'
    }
    
    return text.replace(/[&<>"'`]/g, (char) => map[char])
  }

  /**
   * HTML反转义
   */
  unescapeHtml(text) {
    if (typeof text !== 'string') return text
    
    const map = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x60;': '`'
    }
    
    return text.replace(/(&amp;|&lt;|&gt;|&quot;|&#x27;|&#x60;)/g, (entity) => map[entity])
  }

  /**
   * 清理HTML标签（保留安全标签）
   */
  sanitizeHtml(html, allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br']) {
    if (typeof html !== 'string') return html
    
    // 移除不允许的标签
    let cleaned = html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
      if (allowedTags.includes(tag.toLowerCase())) {
        return match
      }
      return ''
    })
    
    // 移除事件处理器
    cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    
    // 移除javascript:协议
    cleaned = cleaned.replace(/javascript:/gi, '')
    
    return cleaned
  }

  // ==================== 数据加密 ====================

  /**
   * Base64编码
   */
  base64Encode(str) {
    try {
      return btoa(encodeURIComponent(str))
    } catch (e) {
      console.error('[SecurityUtils] Base64编码失败', e)
      return str
    }
  }

  /**
   * Base64解码
   */
  base64Decode(str) {
    try {
      return decodeURIComponent(atob(str))
    } catch (e) {
      console.error('[SecurityUtils] Base64解码失败', e)
      return str
    }
  }

  /**
   * 简单加密（用于本地存储）
   * 注意：这不是强加密，仅用于基本保护
   */
  simpleEncrypt(text) {
    if (typeof text !== 'string') text = JSON.stringify(text)
    
    let encrypted = ''
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
      encrypted += String.fromCharCode(charCode)
    }
    
    return this.base64Encode(encrypted)
  }

  /**
   * 简单解密
   */
  simpleDecrypt(encryptedText) {
    try {
      const encrypted = this.base64Decode(encryptedText)
      let decrypted = ''
      
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        decrypted += String.fromCharCode(charCode)
      }
      
      return decrypted
    } catch (e) {
      console.error('[SecurityUtils] 解密失败', e)
      return null
    }
  }

  // ==================== 数据脱敏 ====================

  /**
   * 手机号脱敏
   */
  maskPhone(phone) {
    if (!phone || phone.length !== 11) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  /**
   * 邮箱脱敏
   */
  maskEmail(email) {
    if (!email || !email.includes('@')) return email
    
    const [username, domain] = email.split('@')
    const maskedUsername = username.charAt(0) + '***' + (username.length > 1 ? username.charAt(username.length - 1) : '')
    return `${maskedUsername}@${domain}`
  }

  /**
   * 身份证脱敏
   */
  maskIdCard(idCard) {
    if (!idCard) return idCard
    
    if (idCard.length === 15) {
      return idCard.replace(/(\d{6})\d{6}(\d{3})/, '$1******$2')
    } else if (idCard.length === 18) {
      return idCard.replace(/(\d{6})\d{8}(\d{3}[\dXx])/, '$1********$2')
    }
    
    return idCard
  }

  // ==================== API签名 ====================

  /**
   * 生成请求签名
   * @param {Object} params 请求参数
   * @param {string} secret 签名密钥
   * @returns {string} 签名
   */
  generateSignature(params, secret = this.encryptionKey) {
    // 1. 参数排序
    const sortedKeys = Object.keys(params).sort()
    
    // 2. 拼接参数
    let str = ''
    sortedKeys.forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        str += `${key}=${params[key]}&`
      }
    })
    
    // 3. 添加密钥
    str += `key=${secret}`
    
    // 4. MD5哈希（简单实现，生产环境应使用crypto API）
    return this._md5(str).toUpperCase()
  }

  /**
   * 验证请求签名
   */
  verifySignature(params, signature, secret = this.encryptionKey) {
    const generated = this.generateSignature(params, secret)
    return generated === signature
  }

  /**
   * 简单MD5实现（仅用于演示，生产环境请使用crypto API）
   * @private
   */
  _md5(string) {
    // 简化版MD5，实际项目中应使用专业库
    let hash = 0
    for (let i = 0; i < string.length; i++) {
      const char = string.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash  // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  // ==================== 频率限制 ====================

  /**
   * 检查是否超过频率限制
   * @param {string} key 标识键
   * @param {number} maxRequests 最大请求次数
   * @param {number} timeWindow 时间窗口(ms)
   * @returns {boolean} 是否允许请求
   */
  checkRateLimit(key, maxRequests = 10, timeWindow = 60000) {
    const now = Date.now()
    const storageKey = `rate_limit_${key}`
    
    try {
      const records = uni.getStorageSync(storageKey) || []
      
      // 移除过期记录
      const validRecords = records.filter(time => now - time < timeWindow)
      
      if (validRecords.length >= maxRequests) {
        return false  // 超过限制
      }
      
      // 添加新记录
      validRecords.push(now)
      uni.setStorageSync(storageKey, validRecords)
      
      return true  // 允许请求
    } catch (e) {
      console.error('[SecurityUtils] 频率限制检查失败', e)
      return true  // 失败时允许请求
    }
  }

  // ==================== HTTPS校验 ====================

  /**
   * 验证URL是否为HTTPS
   */
  enforceHttps(url) {
    if (!url) return url
    
    if (url.startsWith('http://')) {
      console.warn('[SecurityUtils] 检测到HTTP请求，建议改用HTTPS', url)
      
      // 开发环境允许HTTP
      if (process.env.NODE_ENV === 'development') {
        return url
      }
      
      // 生产环境强制HTTPS
      return url.replace('http://', 'https://')
    }
    
    return url
  }
}

// 导出单例
const securityUtils = new SecurityUtils()

export default securityUtils
export { SecurityUtils }
