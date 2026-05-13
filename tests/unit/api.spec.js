/**
 * utils/api.js 单元测试
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

import { jest } from '@jest/globals'
import api, { ApiService } from '@/utils/api.js'

// Mock uni对象
global.uni = {
  request: jest.fn(),
  setStorageSync: jest.fn(),
  getStorageSync: jest.fn(),
  showModal: jest.fn()
}

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    api.init({
      baseUrl: 'https://api.test.com',
      timeout: 5000,
      maxRetry: 2
    })
  })

  describe('初始化', () => {
    test('默认配置', () => {
      expect(api.baseUrl).toBe('https://api.test.com')
      expect(api.timeout).toBe(5000)
      expect(api.maxRetry).toBe(2)
    })

    test('从存储恢复token', () => {
      uni.getStorageSync.mockReturnValue('stored-token')
      
      api.init()
      
      expect(api.token).toBe('stored-token')
    })
  })

  describe('请求方法', () => {
    test('GET请求', async () => {
      const mockResponse = { statusCode: 200, data: { success: true } }
      uni.request.mockImplementation((config) => {
        config.success(mockResponse)
      })

      const result = await api.get('/test', { id: 1 })

      expect(uni.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.test.com/test?id=1',
          method: 'GET'
        })
      )
      expect(result).toEqual({ success: true })
    })

    test('POST请求', async () => {
      const mockResponse = { statusCode: 200, data: { id: 123 } }
      uni.request.mockImplementation((config) => {
        config.success(mockResponse)
      })

      const result = await api.post('/tasks', { title: 'Test' })

      expect(uni.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.test.com/tasks',
          method: 'POST',
          data: { title: 'Test' }
        })
      )
      expect(result).toEqual({ id: 123 })
    })

    test('PUT请求', async () => {
      const mockResponse = { statusCode: 200, data: { success: true } }
      uni.request.mockImplementation((config) => {
        config.success(mockResponse)
      })

      await api.put('/tasks/123', { status: 'completed' })

      expect(uni.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT'
        })
      )
    })

    test('DELETE请求', async () => {
      const mockResponse = { statusCode: 200, data: { success: true } }
      uni.request.mockImplementation((config) => {
        config.success(mockResponse)
      })

      await api.delete('/tasks/123')

      expect(uni.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.test.com/tasks/123',
          method: 'DELETE'
        })
      )
    })
  })

  describe('拦截器', () => {
    test('请求拦截器添加token', async () => {
      api.token = 'test-token'
      
      const mockResponse = { statusCode: 200, data: {} }
      uni.request.mockImplementation((config) => {
        expect(config.header.Authorization).toBe('Bearer test-token')
        config.success(mockResponse)
      })

      await api.get('/test')
    })

    test('请求拦截器添加签名', async () => {
      const mockResponse = { statusCode: 200, data: {} }
      uni.request.mockImplementation((config) => {
        expect(config.data._sign).toBeDefined()
        config.success(mockResponse)
      })

      await api.post('/test', { title: 'Test' })
    })

    test('响应拦截器处理成功响应', async () => {
      const mockResponse = { statusCode: 200, data: { result: 'ok' } }
      uni.request.mockImplementation((config) => {
        config.success(mockResponse)
      })

      const result = await api.get('/test')
      expect(result).toEqual({ result: 'ok' })
    })

    test('响应拦截器处理401错误', async () => {
      const mockResponse = { statusCode: 401, data: { message: 'Unauthorized' } }
      uni.request.mockImplementation((config) => {
        config.success(mockResponse)
      })

      uni.showModal.mockImplementation((config) => {
        config.success({ confirm: true })
      })

      await expect(api.get('/test')).rejects.toThrow('登录已过期')
    })

    test('响应拦截器处理500错误', async () => {
      const mockResponse = { statusCode: 500, data: { message: 'Server Error' } }
      uni.request.mockImplementation((config) => {
        config.success(mockResponse)
      })

      await expect(api.get('/test')).rejects.toThrow('服务器错误')
    })
  })

  describe('重试机制', () => {
    test('网络错误时重试', async () => {
      let callCount = 0
      uni.request.mockImplementation((config) => {
        callCount++
        if (callCount < 2) {
          config.fail({ errMsg: 'network error' })
        } else {
          config.success({ statusCode: 200, data: { success: true } })
        }
      })

      const result = await api.get('/test')

      expect(callCount).toBe(2)
      expect(result).toEqual({ success: true })
    })

    test('超过最大重试次数', async () => {
      uni.request.mockImplementation((config) => {
        config.fail({ errMsg: 'network error' })
      })

      await expect(api.get('/test')).rejects.toThrow()

      expect(uni.request).toHaveBeenCalledTimes(3) // 初始 + 2次重试
    })

    test('4xx错误不重试', async () => {
      uni.request.mockImplementation((config) => {
        config.success({ statusCode: 400, data: { message: 'Bad Request' } })
      })

      await expect(api.get('/test')).rejects.toThrow()

      expect(uni.request).toHaveBeenCalledTimes(1) // 不重试
    })
  })

  describe('Token管理', () => {
    test('设置Token', () => {
      api.setToken('new-token')
      
      expect(api.token).toBe('new-token')
      expect(uni.setStorageSync).toHaveBeenCalledWith('token', 'new-token')
    })

    test('清除Token', () => {
      api.token = 'old-token'
      api.clearToken()
      
      expect(api.token).toBe('')
      expect(uni.removeStorageSync).toHaveBeenCalledWith('token')
    })
  })
})
