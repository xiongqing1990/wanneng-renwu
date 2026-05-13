/**
 * 工具库统一导出
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

// 错误处理
import errorHandler, { ErrorLevel, ErrorType } from './error-handler.js'

// 日志系统
import logger, { LogLevel } from './logger.js'

// 性能监控
import monitor from './monitor.js'

// 安全工具
import security from './security.js'

// API服务
import api from './api.js'

// 缓存管理
import cache from './cache.js'

// 事件总线
import eventBus from './event-bus.js'

/**
 * 初始化所有工具
 * @param {Object} config 全局配置
 */
function initUtils(config = {}) {
  // 错误处理
  errorHandler.init({
    reportUrl: config.errorReportUrl,
    enabled: config.errorHandlerEnabled !== false,
    maxQueueSize: config.errorQueueSize || 100
  })
  
  // 日志系统
  logger.init({
    level: config.logLevel || LogLevel.DEBUG,
    enabled: config.loggerEnabled !== false,
    persist: config.logPersist !== false
  })
  
  // 性能监控
  monitor.init({
    enabled: config.monitorEnabled !== false,
    sampleRate: config.monitorSampleRate || 1.0,
    fpsThreshold: config.fpsThreshold || 50
  })
  
  // 安全工具
  security.init({
    encryptionKey: config.encryptionKey
  })
  
  // API服务
  api.init({
    baseUrl: config.apiBaseUrl,
    timeout: config.apiTimeout || 30000,
    maxRetry: config.apiMaxRetry || 3
  })
  
  // 缓存管理
  cache.init({
    maxMemorySize: config.cacheMaxMemory || 100,
    maxAge: config.cacheMaxAge || 5 * 60 * 1000
  })
  
  console.log('[Utils] 所有工具初始化完成')
}

// 统一导出
export {
  errorHandler,
  ErrorLevel,
  ErrorType,
  logger,
  LogLevel,
  monitor,
  security,
  api,
  cache,
  eventBus,
  initUtils
}
