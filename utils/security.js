/**
 * 安全工具集
 * XSS防护、输入验证、数据加密、频率限制
 */

class Security {
  constructor() {
    this.rateLimits = new Map()
  }
  
  /**
   * XSS防护 - 转义HTML
   */
  escapeHTML(str) {
    if (typeof str !== 'string') return str
    
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
  
  /**
   * XSS防护 - 清理HTML（允许部分标签）
   */
  sanitizeHTML(html, allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br']) {
    if (typeof html !== 'string') return html
    
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g
    return html.replace(tagRegex, (match, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        return match
      }
      return ''
    })
  }
  
  /**
   * 输入验证 - 邮箱
   */
  isEmail(str) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(str)
  }
  
  /**
   * 输入验证 - 手机号（中国）
   */
  isPhone(str) {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(str)
  }
  
  /**
   * 输入验证 - 身份证号（中国）
   */
  isIDCard(str) {
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
    if (!idCardRegex.test(str)) return false
    
    // 校验码验证
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    
    let sum = 0
    for (let i = 0; i < 17; i++) {
      sum += parseInt(str[i]) * weights[i]
    }
    
    const checkCode = checkCodes[sum % 11]
    return str[17].toUpperCase() === checkCode
  }
  
  /**
   * 输入验证 - 强密码
   */
  isStrongPassword(str) {
    // 至少8位，包含大小写字母和数字
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    return passwordRegex.test(str)
  }
  
  /**
   * 数据加密 - Base64编码
   */
  encryptBase64(str) {
    return btoa(encodeURIComponent(str))
  }
  
  /**
   * 数据加密 - Base64解码
   */
  decryptBase64(str) {
    return decodeURIComponent(atob(str))
  }
  
  /**
   * 数据加密 - 简单异或加密（轻量级）
   */
  encryptXOR(str, key = 'default_key') {
    let result = ''
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return btoa(encodeURIComponent(result))
  }
  
  /**
   * 数据解密 - 简单异或解密
   */
  decryptXOR(encrypted, key = 'default_key') {
    const str = decodeURIComponent(atob(encrypted))
    let result = ''
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return result
  }
  
  /**
   * 数据脱敏 - 手机号
   */
  maskPhone(phone) {
    if (!this.isPhone(phone)) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }
  
  /**
   * 数据脱敏 - 邮箱
   */
  maskEmail(email) {
    if (!this.isEmail(email)) return email
    
    const [username, domain] = email.split('@')
    if (username.length <= 2) {
      return `${username[0]}***@${domain}`
    }
    
    return `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}@${domain}`
  }
  
  /**
   * 数据脱敏 - 身份证号
   */
  maskIDCard(idCard) {
    if (!this.isIDCard(idCard)) return idCard
    return idCard.replace(/(\d{4})\d{10}(\w{4})/, '$1**********$2')
  }
  
  /**
   * 频率限制 - 检查是否超过限制
   */
  checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs
    
    if (!this.rateLimits.has(key)) {
      this.rateLimits.set(key, [])
    }
    
    const requests = this.rateLimits.get(key)
    
    // 清理过期请求
    const validRequests = requests.filter(time => time > windowStart)
    
    if (validRequests.length >= maxRequests) {
      return false // 超过限制
    }
    
    validRequests.push(now)
    this.rateLimits.set(key, validRequests)
    
    return true // 未超过限制
  }
  
  /**
   * CSRF Token生成
   */
  generateCSRFToken() {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  /**
   * 随机字符串生成
   */
  generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length]
    }
    
    return result
  }
}

export default new Security()
