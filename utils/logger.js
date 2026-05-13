/**
 * 结构化日志系统
 * 支持分级、持久化、查询、导出
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
}

class Logger {
  constructor(options = {}) {
    this.level = LOG_LEVELS[options.level] !== undefined 
      ? LOG_LEVELS[options.level] 
      : LOG_LEVELS.info
    this.persist = options.persist !== false
    this.maxLogs = options.maxLogs || 1000
    this.storageKey = options.storageKey || 'app_logs'
    this.logs = this.loadLogs()
  }
  
  debug(message, data = {}) {
    this.log('debug', message, data)
  }
  
  info(message, data = {}) {
    this.log('info', message, data)
  }
  
  warn(message, data = {}) {
    this.log('warn', message, data)
  }
  
  error(message, data = {}) {
    this.log('error', message, data)
  }
  
  fatal(message, data = {}) {
    this.log('fatal', message, data)
  }
  
  log(level, message, data = {}) {
    const levelNum = LOG_LEVELS[level]
    if (levelNum < this.level) return
    
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
    }
    
    // 控制台输出
    const consoleMethod = level === 'debug' ? 'log' : level
    if (console[consoleMethod]) {
      console[consoleMethod](`[${level.toUpperCase()}]`, message, data)
    }
    
    // 持久化
    if (this.persist) {
      this.logs.push(logEntry)
      this.saveLogs()
    }
    
    return logEntry
  }
  
  loadLogs() {
    if (typeof localStorage === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (e) {
      return []
    }
  }
  
  saveLogs() {
    if (typeof localStorage === 'undefined') return
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs))
    } catch (e) {
      // 存储满时清理旧日志
      if (e.name === 'QuotaExceededError') {
        this.logs = this.logs.slice(-Math.floor(this.maxLogs / 2))
        localStorage.setItem(this.storageKey, JSON.stringify(this.logs))
      }
    }
  }
  
  getLogs(filter = {}) {
    let filtered = [...this.logs]
    
    if (filter.level) {
      filtered = filtered.filter(log => log.level === filter.level)
    }
    
    if (filter.startTime) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= new Date(filter.startTime)
      )
    }
    
    if (filter.endTime) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= new Date(filter.endTime)
      )
    }
    
    if (filter.keyword) {
      filtered = filtered.filter(log => 
        log.message.includes(filter.keyword) ||
        JSON.stringify(log.data).includes(filter.keyword)
      )
    }
    
    return filtered
  }
  
  exportLogs(format = 'json') {
    const logs = this.getLogs()
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'data']
      const rows = logs.map(log => 
        headers.map(h => JSON.stringify(log[h] || '')).join(',')
      )
      return [headers.join(','), ...rows].join('\n')
    }
    
    return JSON.stringify(logs, null, 2)
  }
  
  clearLogs() {
    this.logs = []
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey)
    }
  }
  
  setLevel(level) {
    if (LOG_LEVELS[level] !== undefined) {
      this.level = LOG_LEVELS[level]
    }
  }
}

export default new Logger({
  level: 'info',
  persist: true,
  maxLogs: 1000
})
