/**
 * 结构化日志系统
 * 支持分级、格式化、持久化
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

// 日志级别
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
}

// 日志颜色（控制台）
const LogColors = {
  debug: '#7f8c8d',
  info: '#2ecc71',
  warn: '#f39c12',
  error: '#e74c3c',
  fatal: '#c0392b'
}

class Logger {
  constructor() {
    this.level = LogLevel.DEBUG
    this.enabled = true
    this.persist = true
    this.maxLogs = 1000
    this.logs = []
  }

  /**
   * 初始化日志系统
   * @param {Object} config 配置项
   */
  init(config = {}) {
    this.level = config.level !== undefined ? config.level : LogLevel.DEBUG
    this.enabled = config.enabled !== false
    this.persist = config.persist !== false
    this.maxLogs = config.maxLogs || 1000
    
    // 从本地存储恢复日志
    if (this.persist) {
      try {
        const saved = uni.getStorageSync('app_logs')
        if (saved && Array.isArray(saved)) {
          this.logs = saved
        }
      } catch (e) {
        console.warn('[Logger] 恢复日志失败', e)
      }
    }
    
    this.info('Logger', '日志系统初始化成功', {
      level: this._getLevelName(this.level),
      persist: this.persist
    })
  }

  /**
   * Debug级别日志
   */
  debug(module, message, data = null) {
    this._log('debug', module, message, data)
  }

  /**
   * Info级别日志
   */
  info(module, message, data = null) {
    this._log('info', module, message, data)
  }

  /**
   * Warn级别日志
   */
  warn(module, message, data = null) {
    this._log('warn', module, message, data)
  }

  /**
   * Error级别日志
   */
  error(module, message, data = null) {
    this._log('error', module, message, data)
  }

  /**
   * Fatal级别日志
   */
  fatal(module, message, data = null) {
    this._log('fatal', module, message, data)
  }

  /**
   * 核心日志记录方法
   * @private
   */
  _log(level, module, message, data) {
    if (!this.enabled) return
    if (LogLevel[level.toUpperCase()] < this.level) return

    const timestamp = new Date()
    const logEntry = {
      timestamp: timestamp.toISOString(),
      level: level,
      module: module,
      message: message,
      data: data
    }

    // 输出到控制台
    this._outputToConsole(logEntry)

    // 保存到内存
    this.logs.unshift(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // 持久化
    if (this.persist) {
      this._persistToStorage()
    }

    return logEntry
  }

  /**
   * 输出到控制台
   * @private
   */
  _outputToConsole(logEntry) {
    const { timestamp, level, module, message, data } = logEntry
    const time = new Date(timestamp).toLocaleTimeString()
    const prefix = `%c[${time}] [${level.toUpperCase()}] [${module}]`
    const color = LogColors[level]

    switch (level) {
      case 'debug':
        console.debug(prefix, `color: ${color}`, message, data || '')
        break
      case 'info':
        console.info(prefix, `color: ${color}`, message, data || '')
        break
      case 'warn':
        console.warn(prefix, `color: ${color}`, message, data || '')
        break
      case 'error':
      case 'fatal':
        console.error(prefix, `color: ${color}`, message, data || '')
        break
    }
  }

  /**
   * 持久化到本地存储
   * @private
   */
  _persistToStorage() {
    try {
      // 只保存最近的200条
      const recentLogs = this.logs.slice(0, 200)
      uni.setStorageSync('app_logs', recentLogs)
    } catch (e) {
      console.warn('[Logger] 持久化日志失败', e)
    }
  }

  /**
   * 获取所有日志
   */
  getLogs(filter = {}) {
    let result = [...this.logs]

    if (filter.level) {
      result = result.filter(log => log.level === filter.level)
    }

    if (filter.module) {
      result = result.filter(log => log.module.includes(filter.module))
    }

    if (filter.startTime) {
      result = result.filter(log => new Date(log.timestamp) >= new Date(filter.startTime))
    }

    if (filter.endTime) {
      result = result.filter(log => new Date(log.timestamp) <= new Date(filter.endTime))
    }

    return result
  }

  /**
   * 导出日志（用于问题排查）
   */
  exportLogs(format = 'json') {
    const logs = this.getLogs()

    if (format === 'text') {
      return logs.map(log => {
        const time = new Date(log.timestamp).toLocaleString()
        let line = `[${time}] [${log.level.toUpperCase()}] [${log.module}] ${log.message}`
        if (log.data) {
          line += ` | ${JSON.stringify(log.data)}`
        }
        return line
      }).join('\n')
    }

    return JSON.stringify(logs, null, 2)
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
    if (this.persist) {
      uni.removeStorageSync('app_logs')
    }
    this.info('Logger', '日志已清空')
  }

  /**
   * 设置日志级别
   */
  setLevel(level) {
    if (typeof level === 'string') {
      level = LogLevel[level.toUpperCase()]
    }
    if (level !== undefined) {
      this.level = level
      this.info('Logger', `日志级别已设置为: ${this._getLevelName(level)}`)
    }
  }

  /**
   * 获取级别名称
   * @private
   */
  _getLevelName(level) {
    const names = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
    return names[level] || 'UNKNOWN'
  }

  /**
   * 创建模块专用logger
   */
  createModuleLogger(moduleName) {
    return {
      debug: (message, data) => this.debug(moduleName, message, data),
      info: (message, data) => this.info(moduleName, message, data),
      warn: (message, data) => this.warn(moduleName, message, data),
      error: (message, data) => this.error(moduleName, message, data),
      fatal: (message, data) => this.fatal(moduleName, message, data)
    }
  }
}

// 导出单例
const logger = new Logger()

export default logger
export { LogLevel, Logger }
