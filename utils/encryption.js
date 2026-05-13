/**
 * 加密工具（增强版）
 * AES、SHA-256、HMAC
 */

class Encryption {
  constructor() {
    this.key = null
  }
  
  /**
   * 生成AES密钥
   */
  async generateAESKey(length = 256) {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: length
      },
      true,
      ['encrypt', 'decrypt']
    )
    
    this.key = key
    return key
  }
  
  /**
   * 导出AES密钥（Base64格式）
   */
  async exportAESKey(key = this.key) {
    const exported = await crypto.subtle.exportKey('raw', key)
    return this.arrayBufferToBase64(exported)
  }
  
  /**
   * 导入AES密钥
   */
  async importAESKey(base64Key) {
    const keyData = this.base64ToArrayBuffer(base64Key)
    
    this.key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    )
    
    return this.key
  }
  
  /**
   * AES加密
   */
  async encryptAES(data, key = this.key) {
    if (!key) {
      throw new Error('No encryption key available')
    }
    
    const encoder = new TextEncoder()
    const encodedData = encoder.encode(JSON.stringify(data))
    
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedData
    )
    
    // 合并IV和加密数据
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    return this.arrayBufferToBase64(combined)
  }
  
  /**
   * AES解密
   */
  async decryptAES(encryptedBase64, key = this.key) {
    if (!key) {
      throw new Error('No decryption key available')
    }
    
    const combined = this.base64ToArrayBuffer(encryptedBase64)
    
    // 提取IV和加密数据
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    )
    
    const decoder = new TextDecoder()
    const decoded = decoder.decode(decrypted)
    
    return JSON.parse(decoded)
  }
  
  /**
   * SHA-256哈希
   */
  async sha256(message) {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    
    return this.arrayBufferToHex(hashBuffer)
  }
  
  /**
   * HMAC-SHA256签名
   */
  async hmacSHA256(message, secret) {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(message)
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      messageData
    )
    
    return this.arrayBufferToHex(signature)
  }
  
  /**
   * 验证HMAC-SHA256签名
   */
  async verifyHMAC(message, signature, secret) {
    const expectedSignature = await this.hmacSHA256(message, secret)
    return expectedSignature === signature
  }
  
  /**
   * 简单加密（轻量级，兼容性更好）
   */
  simpleEncrypt(text, key = 'default_key') {
    let result = ''
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return btoa(encodeURIComponent(result))
  }
  
  /**
   * 简单解密
   */
  simpleDecrypt(encrypted, key = 'default_key') {
    const text = decodeURIComponent(atob(encrypted))
    let result = ''
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      result += String.fromCharCode(charCode)
    }
    return result
  }
  
  /**
   * ArrayBuffer转Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
  
  /**
   * Base64转ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64)
    const buffer = new ArrayBuffer(binary.length)
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return buffer
  }
  
  /**
   * ArrayBuffer转Hex
   */
  arrayBufferToHex(buffer) {
    const bytes = new Uint8Array(buffer)
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  /**
   * 生成随机密钥
   */
  generateKey(length = 32) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return this.arrayBufferToHex(array)
  }
}

// 创建默认加密实例
const encryption = new Encryption()

// 初始化默认密钥
encryption.generateAESKey().then(() => {
  console.log('Encryption module initialized')
})

export default encryption
