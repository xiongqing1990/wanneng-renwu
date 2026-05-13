/**
 * utils/security.js 单元测试
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

import { shallowMount } from '@vue/test-utils'
import { jest } from '@jest/globals'
import security from '@/utils/security.js'

describe('SecurityUtils', () => {
  beforeEach(() => {
    // 清理Mock
    j dest.clearAllMocks()
    // 重新初始化
    security.init({ encryptionKey: 'test-key' })
  })

  describe('输入验证', () => {
    test('验证邮箱 - 有效邮箱', () => {
      expect(security.validateEmail('test@example.com')).toBe(true)
      expect(security.validateEmail('user.name+tag@example.co.uk')).toBe(true)
    })

    test('验证邮箱 - 无效邮箱', () => {
      expect(security.validateEmail('invalid-email')).toBe(false)
      expect(security.validateEmail('')).toBe(false)
      expect(security.validateEmail('@example.com')).toBe(false)
    })

    test('验证手机号 - 有效手机号', () => {
      expect(security.validatePhone('13812345678')).toBe(true)
      expect(security.validatePhone('15987654321')).toBe(true)
    })

    test('验证手机号 - 无效手机号', () => {
      expect(security.validatePhone('12345678901')).toBe(false)
      expect(security.validatePhone('1381234567')).toBe(false)
      expect(security.validatePhone('')).toBe(false)
    })

    test('验证URL', () => {
      expect(security.validateUrl('https://example.com')).toBe(true)
      expect(security.validateUrl('http://test.com/path?query=1')).toBe(true)
      expect(security.validateUrl('not-a-url')).toBe(false)
    })
  })

  describe('XSS防护', () => {
    test('HTML转义', () => {
      expect(security.escapeHtml('<script>alert("XSS")</script>'))
        .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;')
      
      expect(security.escapeHtml('Hello & World'))
        .toBe('Hello &amp; World')
    })

    test('HTML反转义', () => {
      expect(security.unescapeHtml('&lt;div&gt;Test&lt;&#x2F;div&gt;'))
        .toBe('<div>Test</div>')
    })

    test('清理HTML标签', () => {
      expect(security.sanitizeHtml('<b>Bold</b> <script>alert("XSS")</script>'))
        .toBe('<b>Bold</b> ')
      
      expect(security.sanitizeHtml('<p>Paragraph</p>', ['p']))
        .toBe('<p>Paragraph</p>')
    })
  })

  describe('数据加密', () => {
    test('Base64编码解码', () => {
      const original = 'Hello, World!'
      const encoded = security.base64Encode(original)
      const decoded = security.base64Decode(encoded)
      expect(decoded).toBe(original)
    })

    test('简单加密解密', () => {
      const original = 'Sensitive Data'
      const encrypted = security.simpleEncrypt(original)
      expect(encrypted).not.toBe(original)
      
      const decrypted = security.simpleDecrypt(encrypted)
      expect(decrypted).toBe(original)
    })
  })

  describe('数据脱敏', () => {
    test('手机号脱敏', () => {
      expect(security.maskPhone('13812345678')).toBe('138****5678')
    })

    test('邮箱脱敏', () => {
      expect(security.maskEmail('test@example.com')).toBe('t***t@example.com')
    })

    test('身份证脱敏', () => {
      expect(security.maskIdCard('110101199001011234')).toBe('110101********1234')
      expect(security.maskIdCard('110101900101123')).toBe('110101******123')
    })
  })

  describe('频率限制', () => {
    test('频率限制 - 未超限', () => {
      // Mock uni.getStorageSync
      uni.getStorageSync = jest.fn().mockReturnValue([])
      uni.setStorageSync = jest.fn()

      expect(security.checkRateLimit('test_key', 3, 60000)).toBe(true)
      expect(uni.setStorageSync).toHaveBeenCalled()
    })

    test('频率限制 - 已超限', () => {
      const now = Date.now()
      const recentRequests = [now - 1000, now - 2000, now - 3000]
      
      uni.getStorageSync = jest.fn().mockReturnValue(recentRequests)
      
      expect(security.checkRateLimit('test_key', 3, 60000)).toBe(false)
    })
  })

  describe('HTTPS校验', () => {
    test('强制HTTPS', () => {
      expect(security.enforceHttps('http://example.com')).toBe('https://example.com')
      expect(security.enforceHttps('https://example.com')).toBe('https://example.com')
    })
  })
})
