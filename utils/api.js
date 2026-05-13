/**
 * API请求层封装
 * 统一请求拦截、错误处理、重试机制、签名验证
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

import errorHandler from './error-handler.js'
import logger from './logger.js'
import monitor from './monitor.js'
import security from './security.js'

const API_BASE_URL = 'https://api.wanengrenwu.com'  // 生产环境
const TIMEOUT = 30000  // 30秒超时
const MAX_RETRY = 3  // 最大重试次数

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL
    this.timeout = TIMEOUT
    this.maxRetry = MAX_RETRY
    this.requestInterceptors = []
    this.responseInterceptors = []
    this.token = ''
  }

  /**
   * 初始化API服务
   */
  init(config = {}) {
    this.baseUrl = config.baseUrl || this.baseUrl
    this.timeout = config.timeout || this.timeout
    this.maxRetry = config.maxRetry || this.maxRetry
    
    // 从存储恢复token
    this.token = uni.getStorageSync('token') || ''
    
    // 添加默认拦截器
    this._setupDefaultInterceptors()
    
    logger.info('ApiService', 'API服务初始化成功', {
      baseUrl: this.baseUrl,
      timeout: this.timeout
    })
  }

  /**
   * 设置默认拦截器
   * @private
   */
  _setupDefaultInterceptors() {
    // 请求拦截器：添加token、签名
    this.addRequestInterceptor((config) => {
      // 添加认证头
      if (this.token) {
        config.header = {
          ...config.header,
          'Authorization': `Bearer ${this.token}`
        }
      }
      
      // 添加时间戳防重放
      if (config.method === 'POST' || config.method === 'PUT') {
        config.data = {
          ...config.data,
          _t: Date.now()
        }
        
        // 添加签名
        config.data._sign = security.generateSignature(config.data)
      }
      
      // HTTPS强制
      config.url = security.enforceHttps(config.url)
      
      return config
    })

    // 响应拦截器：错误统一处理
    this.addResponseInterceptor(
      (response) => {
        // 成功响应
        if (response.statusCode === 200) {
          return response.data
        }
        
        // token过期
        if (response.statusCode === 401) {
          this._handleTokenExpired()
          return Promise.reject(new Error('登录已过期，请重新登录'))
        }
        
        // 权限不足
        if (response.statusCode === 403) {
          return Promise.reject(new Error('权限不足'))
        }
        
        // 服务器错误
        if (response.statusCode >= 500) {
          return Promise.reject(new Error('服务器错误，请稍后重试'))
        }
        
        return Promise.reject(new Error(`请求失败: ${response.statusCode}`))
      },
      (error) => {
        // 网络错误
        if (!error.response) {
          return Promise.reject(new Error('网络连接失败，请检查网络'))
        }
        
        return Promise.reject(error)
      }
    )
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
  addResponseInterceptor(onFulfilled, onRejected) {
    this.responseInterceptors.push({
      onFulfilled: onFulfilled,
      onRejected: onRejected || ((error) => Promise.reject(error))
    })
  }

  /**
   * 通用请求方法
   */
  async request(options) {
    const startTime = Date.now()
    let retryCount = 0
    
    const doRequest = async () => {
      try {
        // 应用请求拦截器
        let config = {
          url: this._buildUrl(options.url),
          method: options.method || 'GET',
          data: options.data || {},
          header: options.header || {},
          timeout: options.timeout || this.timeout
        }
        
        for (const interceptor of this.requestInterceptors) {
          config = interceptor(config)
        }
        
        // 发起请求
        const response = await this._doRequest(config)
        
        // 应用响应拦截器
        let result = response
        for (const interceptor of this.responseInterceptors) {
          result = interceptor.onFulfilled(result)
        }
        
        // 记录性能
        const duration = Date.now() - startTime
        monitor.recordApiRequest(options.url, duration, true)
        
        logger.debug('ApiService', `请求成功: ${options.url}`, {
          duration: duration,
          method: config.method
        })
        
        return result
        
      } catch (error) {
        const duration = Date.now() - startTime
        
        // 记录性能
        monitor.recordApiRequest(options.url, duration, false)
        
        // 错误分类处理
        const errorInfo = this._classifyError(error)
        errorHandler.handle(
          error,
          errorInfo.type,
          errorInfo.level,
          { url: options.url, method: options.method }
        )
        
        // 重试机制
        if (this._shouldRetry(error) && retryCount < this.maxRetry) {
          retryCount++
          logger.warn('ApiService', `请求失败，第${retryCount}次重试`, {
            url: options.url,
            error: error.message
          })
          
          await this._delay(1000 * retryCount)  // 指数退避
          return doRequest()
        }
        
        // 所有重试都失败
        logger.error('ApiService', `请求失败: ${options.url}`, {
          error: error.message,
          retries: retryCount
        })
        
        // 应用响应错误拦截器
        let result = error
        for (const interceptor of this.responseInterceptors) {
          try {
            result = interceptor.onRejected(result)
          } catch (e) {
            result = e
          }
        }
        
        throw result
      }
    }
    
    return doRequest()
  }

  /**
   * 发起请求（底层）
   * @private
   */
  _doRequest(config) {
    return new Promise((resolve, reject) => {
      uni.request({
        ...config,
        success: (response) => resolve(response),
        fail: (error) => reject(error)
      })
    })
  }

  /**
   * 构建完整URL
   * @private
   */
  _buildUrl(url) {
    if (url.startsWith('http')) {
      return url
    }
    return this.baseUrl + url
  }

  /**
   * 错误分类
   * @private
   */
  _classifyError(error) {
    if (!error.response) {
      return { type: 'NETWORK_ERROR', level: 'error' }
    }
    
    const status = error.response.statusCode
    
    if (status === 401) {
      return { type: 'AUTH_ERROR', level: 'warn' }
    }
    
    if (status === 403) {
      return { type: 'PERMISSION_ERROR', level: 'warn' }
    }
    
    if (status >= 500) {
      return { type: 'API_ERROR', level: 'error' }
    }
    
    return { type: 'UNKNOWN_ERROR', level: 'error' }
  }

  /**
   * 判断是否应该重试
   * @private
   */
  _shouldRetry(error) {
    // 网络错误重试
    if (!error.response) return true
    
    // 5xx错误重试
    if (error.response.statusCode >= 500) return true
    
    // 429（太多请求）重试
    if (error.response.statusCode === 429) return true
    
    return false
  }

  /**
   * 延迟
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 处理token过期
   * @private
   */
  _handleTokenExpired() {
    this.token = ''
    uni.removeStorageSync('token')
    
    uni.showModal({
      title: '登录过期',
      content: '登录已过期，是否重新登录？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }
      }
    })
  }

  // ==================== HTTP方法封装 ====================

  get(url, params = {}, options = {}) {
    const query = this._buildQuery(params)
    const fullUrl = query ? `${url}?${query}` : url
    return this.request({
      url: fullUrl,
      method: 'GET',
      ...options
    })
  }

  post(url, data = {}, options = {}) {
    return this.request({
      url: url,
      method: 'POST',
      data: data,
      ...options
    })
  }

  put(url, data = {}, options = {}) {
    return this.request({
      url: url,
      method: 'PUT',
      data: data,
      ...options
    })
  }

  delete(url, params = {}, options = {}) {
    const query = this._buildQuery(params)
    const fullUrl = query ? `${url}?${query}` : url
    return this.request({
      url: fullUrl,
      method: 'DELETE',
      ...options
    })
  }

  /**
   * 构建查询字符串
   * @private
   */
  _buildQuery(params) {
    const query = []
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        query.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      }
    }
    return query.join('&')
  }

  /**
   * 设置Token
   */
  setToken(token) {
    this.token = token
    uni.setStorageSync('token', token)
  }

  /**
   * 清除Token
   */
  clearToken() {
    this.token = ''
    uni.removeStorageSync('token')
  }
}

// 导出单例
const api = new ApiService()

export default api
export { ApiService }
