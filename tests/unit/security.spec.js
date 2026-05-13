/**
 * 安全工具测试
 */

import { test, expect, describe } from '@jest/globals'
import security from '@/utils/security'

describe('Security Utils', () => {
  describe('XSS Protection', () => {
    test('escapeHTML should escape special characters', () => {
      const input = '<script>alert("XSS")</script>'
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      expect(security.escapeHTML(input)).toBe(expected)
    })
    
    test('sanitizeHTML should allow safe tags', () => {
      const input = '<b>Bold</b><script>alert("XSS")</script><i>Italic</i>'
      const result = security.sanitizeHTML(input)
      expect(result).toContain('<b>Bold</b>')
      expect(result).toContain('<i>Italic</i>')
      expect(result).not.toContain('<script>')
    })
  })
  
  describe('Input Validation', () => {
    test('isEmail should validate email addresses', () => {
      expect(security.isEmail('test@example.com')).toBe(true)
      expect(security.isEmail('invalid-email')).toBe(false)
      expect(security.isEmail('test@')).toBe(false)
    })
    
    test('isPhone should validate Chinese phone numbers', () => {
      expect(security.isPhone('13812345678')).toBe(true)
      expect(security.isPhone('12345678901')).toBe(false)
      expect(security.isPhone('1381234567')).toBe(false)
    })
    
    test('isIDCard should validate ID card numbers', () => {
      // 18位有效身份证号（校验码已验证）
      expect(security.isIDCard('11010119900307827X')).toBe(true)
      expect(security.isIDCard('123456789012345678')).toBe(false)
    })
    
    test('isStrongPassword should validate strong passwords', () => {
      expect(security.isStrongPassword('Password123')).toBe(true)
      expect(security.isStrongPassword('weak')).toBe(false)
      expect(security.isStrongPassword('NoNumbers')).toBe(false)
      expect(security.isStrongPassword('nonumber')).toBe(false)
    })
  })
  
  describe('Data Encryption', () => {
    test('encryptBase64 and decryptBase64 should work correctly', () => {
      const original = 'Hello, World!'
      const encrypted = security.encryptBase64(original)
      const decrypted = security.decryptBase64(encrypted)
      expect(decrypted).toBe(original)
    })
    
    test('encryptXOR should encrypt and decrypt correctly', () => {
      const original = 'Sensitive Data'
      const encrypted = security.encryptXOR(original, 'test_key')
      const decrypted = security.decryptXOR(encrypted, 'test_key')
      expect(decrypted).toBe(original)
    })
  })
  
  describe('Data Masking', () => {
    test('maskPhone should mask phone numbers', () => {
      expect(security.maskPhone('13812345678')).toBe('138****5678')
    })
    
    test('maskEmail should mask email addresses', () => {
      expect(security.maskEmail('test@example.com')).toMatch(/t***t@example\.com/)
    })
    
    test('maskIDCard should mask ID card numbers', () => {
      const idCard = '11010119900307827X'
      const masked = security.maskIDCard(idCard)
      expect(masked).toContain('**********')
    })
  })
  
  describe('Rate Limiting', () => {
    test('checkRateLimit should allow requests within limit', () => {
      const key = 'test_key'
      
      // 前10次应该成功
      for (let i = 0; i < 10; i++) {
        expect(security.checkRateLimit(key, 10, 60000)).toBe(true)
      }
      
      // 第11次应该失败
      expect(security.checkRateLimit(key, 10, 60000)).toBe(false)
    })
  })
  
  describe('Token Generation', () => {
    test('generateCSRFToken should generate 64-character hex string', () => {
      const token = security.generateCSRFToken()
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })
    
    test('generateRandomString should generate string of correct length', () => {
      const randomStr = security.generateRandomString(16)
      expect(randomStr.length).toBe(16)
    })
  })
})
