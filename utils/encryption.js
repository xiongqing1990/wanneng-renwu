/**
 * 加密工具（增强版）
 * 提供AES加密、哈希、签名等安全功能
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

class EncryptionUtils {
  constructor() {
    this.key = null
    this.initialized = false
  }

  /**
   * 初始化加密工具
   * @param {string} key 加密密钥
   */
  init(key) {
    this.key = key || this._generateKey()
    this.initialized = true
    console.log('[EncryptionUtils] 加密工具初始化成功')
  }

  /**
   * AES加密（简化版，生产环境请使用crypto API）
   * @param {string} text 明文
   * @returns {string} 密文（Base64）
   */
  aesEncrypt(text) {
    if (!this.initialized) {
      throw new Error('EncryptionUtils not initialized')
    }

    try {
      // 实际项目中应使用 Web Crypto API 或第三方库（如crypto-js）
      // 这里提供简化版示例
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      
      // 简单XOR加密（仅作演示）
      const keyData = encoder.encode(this.key)
      const encrypted = new Uint8Array(data.length)
      
      for (let i = 0; i < data.length; i++) {
        encrypted[i] = data[i] ^ keyData[i % keyData.length]
      }
      
      // 转换为Base64
      return this._arrayBufferToBase64(encrypted)
    } catch (e) {
      console.error('[EncryptionUtils] AES加密失败', e)
      return null
    }
  }

  /**
   * AES解密（简化版）
   * @param {string} encryptedText 密文（Base64）
   * @returns {string} 明文
   */
  aesDecrypt(encryptedText) {
    if (!this.initialized) {
      throw new Error('EncryptionUtils not initialized')
    }

    try {
      const encoder = new TextEncoder()
      const keyData = encoder.encode(this.key)
      
      // Base64解码
      const encrypted = this._base64ToArrayBuffer(encryptedText)
      
      // XOR解密
      const decrypted = new Uint8Array(encrypted.length)
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyData[i % keyData.length]
      }
      
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (e) {
      console.error('[EncryptionUtils] AES解密失败', e)
      return null
    }
  }

  /**
   * SHA-256哈希
   * @param {string} text 输入文本
   * @returns {Promise<string>} 哈希值
   */
  async sha256(text) {
    if (!('crypto' in window) || !window.crypto.subtle) {
      console.warn('[EncryptionUtils] Web Crypto API不可用，使用简化版')
      return this._simpleHash(text)
    }

    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
      return this._arrayBufferToHex(hashBuffer)
    } catch (e) {
      console.error('[EncryptionUtils] SHA-256失败', e)
      return this._simpleHash(text)
    }
  }

  /**
   * HMAC签名
   * @param {string} data 数据
   * @param {string} key 密钥
   * @returns {Promise<string>} HMAC签名
   */
  async hmacSign(data, key = this.key) {
    if (!('crypto' in window) || !window.crypto.subtle) {
      console.warn('[EncryptionUtils] Web Crypto API不可用，使用简化版')
      return this._simpleHMAC(data, key)
    }

    try {
      const encoder = new TextEncoder()
      const keyData = encoder.encode(key)
      const dataData = encoder.encode(data)

      // 导入密钥
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      // 计算HMAC
      const signature = await window.crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        dataData
      )

      return this._arrayBufferToHex(signature)
    } catch (e) {
      console.error('[EncryptionUtils] HMAC签名失败', e)
      return this._simpleHMAC(data, key)
    }
  }

  /**
   * 验证HMAC签名
   * @param {string} data 数据
   * @param {string} signature 签名
   * @param {string} key 密钥
   * @returns {Promise<boolean>} 是否有效
   */
  async verifyHmac(data, signature, key = this.key) {
    const expectedSignature = await this.hmacSign(data, key)
    return expectedSignature === signature
  }

  /**
   * 生成随机字符串
   * @param {number} length 长度
   * @returns {string} 随机字符串
   */
  generateRandomString(length = 32) {
    if (!('crypto' in window)) {
      // 降级方案
      let result = ''
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const array = new Uint8Array(length)
    window.crypto.getRandomValues(array)
    
    return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('')
  }

  /**
   * 生成UUID v4
   * @returns {string} UUID
   */
  generateUUID() {
    if (!('crypto' in window)) {
      // 降级方案
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (window.crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 1)
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // ==================== 私有方法 ====================

  /**
   * 生成密钥
   * @private
   */
  _generateKey() {
    return this.generateRandomString(32)
  }

  /**
   * ArrayBuffer转Base64
   * @private
   */
  _arrayBufferToBase64(buffer) {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Base64转ArrayBuffer
   * @private
   */
  _base64ToArrayBuffer(base64) {
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
   * @private
   */
  _arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map(b => ('00' + b.toString(16)).slice(-2))
      .join('')
  }

  /**
   * 简化版哈希（仅用于演示）
   * @private
   */
  _simpleHash(text) {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * 简化版HMAC（仅用于演示）
   * @private
   */
  _simpleHMAC(data, key) {
    return this._simpleHash(data + key)
  }
}

// 导出单例
const encryption = new EncryptionUtils()

export default encryption
export { EncryptionUtils }
