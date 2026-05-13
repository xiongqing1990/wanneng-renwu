/**
 * API请求层封装
 * 拦截器、重试机制、Token管理
 */

class API {
  constructor(options = {}) {
    this.baseURL = options.baseURL || ''
    this.timeout = options.timeout || 30000
    this.maxRetries = options.maxRetries || 3
    this.retryDelay = options.retryDelay || 1000
    
    this.requestInterceptors = []
    this.responseInterceptors = []
    
    this.token = localStorage.getItem('token') || ''
  }
  
  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor)
  }
  
  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor)
  }
  
  /**
   * 应用请求拦截器
   */
  applyRequestInterceptors(config) {
    let result = { ...config }
    for (const interceptor of this.requestInterceptors) {
      result = interceptor(result) || result
    }
    return result
  }
  
  /**
   * 应用响应拦截器
   */
  applyResponseInterceptors(response) {
    let result = { ...response }
    for (const interceptor of this.responseInterceptors) {
      result = interceptor(result) || result
    }
    return result
  }
  
  /**
   * 通用请求方法
   */
  async request(config) {
    // 应用请求拦截器
    const finalConfig = this.applyRequestInterceptors({
      ...config,
      url: this.baseURL + config.url,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      timeout: config.timeout || this.timeout
    })
    
    // 添加Token
    if (this.token) {
      finalConfig.headers.Authorization = `Bearer ${this.token}`
    }
    
    let lastError = null
    
    // 重试机制
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.fetch(finalConfig)
        
        // 应用响应拦截器
        const finalResponse = this.applyResponseInterceptors(response)
        
        // Token过期，自动刷新
        if (finalResponse.status === 401 && !finalConfig._isRetry) {
          const refreshed = await this.refreshToken()
          if (refreshed) {
            finalConfig._isRetry = true
            return this.request(finalConfig)
          }
        }
        
        return finalResponse
      } catch (error) {
        lastError = error
        
        // 如果是最后一次尝试，或者不是网络错误，不再重试
        if (attempt === this.maxRetries || !this.shouldRetry(error)) {
          break
        }
        
        // 等待后重试
        await this.delay(this.retryDelay * (attempt + 1))
      }
    }
    
    throw lastError
  }
  
  /**
   * 发起fetch请求
   */
  async fetch(config) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)
    
    try {
      const response = await fetch(config.url, {
        method: config.method || 'GET',
        headers: config.headers,
        body: config.data ? JSON.stringify(config.data) : undefined,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const data = await response.json()
      
      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      
      throw error
    }
  }
  
  /**
   * 判断是否需要重试
   */
  shouldRetry(error) {
    // 网络错误或超时才重试
    return error.message === 'Request timeout' || 
           error.message === 'Failed to fetch'
  }
  
  /**
   * 延迟
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  /**
   * 刷新Token
   */
  async refreshToken() {
    try {
      const response = await fetch(this.baseURL + '/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: localStorage.getItem('refreshToken')
        })
      })
      
      const data = await response.json()
      
      if (data.token) {
        this.setToken(data.token)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to refresh token:', error)
      return false
    }
  }
  
  /**
   * 设置Token
   */
  setToken(token) {
    this.token = token
    localStorage.setItem('token', token)
  }
  
  /**
   * 清除Token
   */
  clearToken() {
    this.token = ''
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }
  
  /**
   * GET请求
   */
  get(url, config = {}) {
    return this.request({
      ...config,
      method: 'GET',
      url
    })
  }
  
  /**
   * POST请求
   */
  post(url, data, config = {}) {
    return this.request({
      ...config,
      method: 'POST',
      url,
      data
    })
  }
  
  /**
   * PUT请求
   */
  put(url, data, config = {}) {
    return this.request({
      ...config,
      method: 'PUT',
      url,
      data
    })
  }
  
  /**
   * DELETE请求
   */
  delete(url, config = {}) {
    return this.request({
      ...config,
      method: 'DELETE',
      url
    })
  }
}

// 创建默认实例
const api = new API({
  baseURL: '/api',
  timeout: 30000,
  maxRetries: 3
})

// 添加默认请求拦截器（添加时间戳防止缓存）
api.addRequestInterceptor(config => {
  if (config.method === 'GET') {
    config.url += (config.url.includes('?') ? '&' : '?') + `_t=${Date.now()}`
  }
  return config
})

// 添加默认响应拦截器（统一错误处理）
api.addResponseInterceptor(response => {
  if (response.status !== 200) {
    console.error('API Error:', response.status, response.statusText)
  }
  return response
})

export default api
