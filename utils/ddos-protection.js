/**
 * DDoS防护工具
 * 速率限制、IP黑名单、挑战机制
 */

class DDoSProtection {
  constructor(options = {}) {
    this.rateLimit = {
      windowMs: options.rateLimit?.windowMs || 60000, // 1分钟
      maxRequests: options.rateLimit?.maxRequests || 100,
      message: options.rateLimit?.message || 'Too many requests, please try again later.'
    }
    
    this.ipBlacklist = new Set(options.ipBlacklist || [])
    this.ipWhitelist = new Set(options.ipWhitelist || [])
    
    this.challengeEnabled = options.challengeEnabled || false
    this.challengeDifficulty = options.challengeDifficulty || 'medium'
    
    this.requestLog = new Map() // IP -> [timestamps]
    this.blockedIPs = new Map() // IP -> blockExpiry
  }
  
  /**
   * 检查请求
   * @returns {boolean} true if request is allowed, false if blocked
   */
  checkRequest(req) {
    const ip = this.getClientIP(req)
    
    // 检查白名单
    if (this.ipWhitelist.has(ip)) {
      return true
    }
    
    // 检查黑名单
    if (this.ipBlacklist.has(ip)) {
      return false
    }
    
    // 检查是否被暂时封禁
    if (this.blockedIPs.has(ip)) {
      const blockExpiry = this.blockedIPs.get(ip)
      
      if (Date.now() < blockExpiry) {
        return false
      } else {
        // 封禁到期，移除
        this.blockedIPs.delete(ip)
      }
    }
    
    // 速率限制检查
    if (!this.checkRateLimit(ip)) {
      // 超过限制，加入临时封禁
      this.blockIP(ip, 900000) // 封禁15分钟
      return false
    }
    
    return true
  }
  
  /**
   * 获取客户端IP
   */
  getClientIP(req) {
    // 检查代理头部
    const forwardedFor = req.headers['x-forwarded-for']
    if (forwardedFor) {
      // 取第一个IP（最原始的客户端IP）
      return forwardedFor.split(',')[0].trim()
    }
    
    const realIP = req.headers['x-real-ip']
    if (realIP) {
      return realIP
    }
    
    // 直接连接
    return req.socket.remoteAddress
  }
  
  /**
   * 检查速率限制
   */
  checkRateLimit(ip) {
    const now = Date.now()
    const windowStart = now - this.rateLimit.windowMs
    
    // 获取该IP的请求日志
    if (!this.requestLog.has(ip)) {
      this.requestLog.set(ip, [])
    }
    
    const requests = this.requestLog.get(ip)
    
    // 清理过期的请求记录
    const validRequests = requests.filter(timestamp => timestamp > windowStart)
    
    // 检查是否超过限制
    if (validRequests.length >= this.rateLimit.maxRequests) {
      return false
    }
    
    // 记录本次请求
    validRequests.push(now)
    this.requestLog.set(ip, validRequests)
    
    return true
  }
  
  /**
   * 封禁IP
   */
  blockIP(ip, durationMs = 900000) {
    const expiry = Date.now() + durationMs
    this.blockedIPs.set(ip, expiry)
    
    console.warn(`Blocked IP: ${ip} for ${durationMs}ms`)
    
    // 到期自动移除
    setTimeout(() => {
      this.blockedIPs.delete(ip)
      console.log(`Unblocked IP: ${ip}`)
    }, durationMs)
  }
  
  /**
   * 加入黑名单（永久）
   */
  addToBlacklist(ip) {
    this.ipBlacklist.add(ip)
    console.warn(`Added IP to blacklist: ${ip}`)
  }
  
  /**
   * 从黑名单移除
   */
  removeFromBlacklist(ip) {
    this.ipBlacklist.delete(ip)
    console.log(`Removed IP from blacklist: ${ip}`)
  }
  
  /**
   * 加入白名单
   */
  addToWhitelist(ip) {
    this.ipWhitelist.add(ip)
    console.log(`Added IP to whitelist: ${ip}`)
  }
  
  /**
   * 从白名单移除
   */
  removeFromWhitelist(ip) {
    this.ipWhitelist.delete(ip)
    console.log(`Removed IP from whitelist: ${ip}`)
  }
  
  /**
   * 生成挑战（PoW - Proof of Work）
   */
  generateChallenge(res) {
    if (!this.challengeEnabled) {
      return null
    }
    
    const challenge = {
      type: 'pow',
      difficulty: this.challengeDifficulty,
      challenge: this.generateRandomString(32),
      timestamp: Date.now()
    }
    
    // 存储挑战（用于后续验证）
    // ...
    
    return challenge
  }
  
  /**
   * 验证挑战响应
   */
  verifyChallenge(challenge, response) {
    // 验证PoW响应
    // 简化示例：检查响应是否满足难度要求
    const hash = this.sha256(challenge.challenge + response)
    
    const difficultyBits = {
      'low': 4,
      'medium': 5,
      'high': 6
    }
    
    const requiredZeros = difficultyBits[this.challengeDifficulty]
    const prefix = '0'.repeat(requiredZeros)
    
    return hash.startsWith(prefix)
  }
  
  /**
   * 生成随机字符串
   */
  generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  }
  
  /**
   * SHA-256哈希
   */
  sha256(message) {
    // 浏览器环境
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(message)
      
      return crypto.subtle.digest('SHA-256', data)
        .then(hashBuffer => {
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        })
    }
    
    // Node.js环境
    const crypto = require('crypto')
    return crypto.createHash('sha256').update(message).digest('hex')
  }
  
  /**
   * 清理过期数据
   */
  cleanup() {
    const now = Date.now()
    
    // 清理过期的请求日志
    for (const [ip, requests] of this.requestLog.entries()) {
      const validRequests = requests.filter(timestamp => 
        now - timestamp < this.rateLimit.windowMs
      )
      
      if (validRequests.length === 0) {
        this.requestLog.delete(ip)
      } else {
        this.requestLog.set(ip, validRequests)
      }
    }
    
    // 清理过期的封禁
    for (const [ip, expiry] of this.blockedIPs.entries()) {
      if (now >= expiry) {
        this.blockedIPs.delete(ip)
      }
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats() {
    return {
      requestLogSize: this.requestLog.size,
      blockedIPs: this.blockedIPs.size,
      blacklistSize: this.ipBlacklist.size,
      whitelistSize: this.ipWhitelist.size
    }
  }
}

// 创建默认DDoS防护实例
const ddosProtection = new DDoSProtection({
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100
  },
  challengeEnabled: true,
  challengeDifficulty: 'medium'
})

// 定期清理
setInterval(() => {
  ddosProtection.cleanup()
}, 300000) // 每5分钟清理一次

// Express中间件
export const ddosProtectionMiddleware = (req, res, next) => {
  if (!ddosProtection.checkRequest(req)) {
    res.writeHead(429, {
      'Content-Type': 'application/json'
    })
    
    res.end(JSON.stringify({
      error: 'Too many requests',
      message: ddosProtection.rateLimit.message
    }))
    
    return
  }
  
  next()
}

export default ddosProtection
