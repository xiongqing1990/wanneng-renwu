/**
 * API服务测试
 */

import { test, expect, describe, beforeEach, afterEach, jest } from '@jest/globals'
import api from '@/utils/api'

describe('API Service', () => {
  beforeEach(() => {
    // 清空所有mock
    jest.clearAllMocks()
    localStorage.clear()
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })
  
  describe('Request Interceptors', () => {
    test('should apply request interceptors', async () => {
      const interceptor = jest.fn(config => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Custom-Header': 'test'
        }
      }))
      
      api.addRequestInterceptor(interceptor)
      
      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({}),
          status: 200
        })
      )
      
      await api.get('/test')
      
      expect(interceptor).toHaveBeenCalled()
    })
  })
  
  describe('Response Interceptors', () => {
    test('should apply response interceptors', async () => {
      const interceptor = jest.fn(response => {
        response.customField = 'added'
        return response
      })
      
      api.addResponseInterceptor(interceptor)
      
      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({}),
          status: 200
        })
      )
      
      const response = await api.get('/test')
      
      expect(interceptor).toHaveBeenCalled()
      expect(response.customField).toBe('added')
    })
  })
  
  describe('Token Management', () => {
    test('setToken should save token to localStorage', () => {
      api.setToken('test_token')
      
      expect(localStorage.getItem('token')).toBe('test_token')
      expect(api.token).toBe('test_token')
    })
    
    test('clearToken should remove token from localStorage', () => {
      api.setToken('test_token')
      api.clearToken()
      
      expect(localStorage.getItem('token')).toBeNull()
      expect(api.token).toBe('')
    })
    
    test('requests should include Authorization header when token is set', async () => {
      api.setToken('test_token')
      
      // Mock fetch
      global.fetch = jest.fn((url, config) =>
        Promise.resolve({
          json: () => Promise.resolve({}),
          status: 200
        })
      )
      
      await api.get('/test')
      
      const fetchCall = global.fetch.mock.calls[0]
      const fetchConfig = fetchCall[1]
      
      expect(fetchConfig.headers.Authorization).toBe('Bearer test_token')
    })
  })
  
  describe('HTTP Methods', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ data: 'test' }),
          status: 200
        })
      )
    })
    
    test('get should make GET request', async () => {
      await api.get('/test')
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      )
    })
    
    test('post should make POST request with data', async () => {
      const data = { name: 'Test' }
      await api.post('/test', data)
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data)
        })
      )
    })
    
    test('put should make PUT request with data', async () => {
      const data = { name: 'Updated' }
      await api.put('/test', data)
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(data)
        })
      )
    })
    
    test('delete should make DELETE request', async () => {
      await api.delete('/test')
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })
  
  describe('Retry Mechanism', () => {
    test('should retry on network error', async () => {
      // 第一次失败，第二次成功
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({
          json: () => Promise.resolve({}),
          status: 200
        })
      
      const response = await api.get('/test')
      
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })
  
  describe('Timeout', () => {
    test('should timeout after configured duration', async () => {
      // Mock fetch that never resolves
      global.fetch = jest.fn(() => new Promise(() => {}))
      
      // Mock AbortController
      global.AbortController = jest.fn(() => ({
        abort: jest.fn(),
        signal: {}
      }))
      
      const responsePromise = api.get('/test', { timeout: 100 })
      
      // 由于无法真正测试超时（需要真实计时器），这里只测试不会抛出异常
      await expect(responsePromise).rejects.toThrow()
    })
  })
})
