/**
 * 性能监控系统
 * 监控页面加载、API请求、内存使用等性能指标
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: [],      // 页面加载时间
      apiRequest: [],     // API请求耗时
      memoryUsage: [],    // 内存使用
      fps: [],           // 帧率
      errorRate: []      // 错误率
    }
    this.enabled = true
    this.sampleRate = 1.0  // 采样率
    this.maxRecords = 100
    this.fpsThreshold = 50  // FPS阈值
    this.slowApiThreshold = 2000  // 慢API阈值（ms）
  }

  /**
   * 初始化性能监控
   * @param {Object} config 配置项
   */
  init(config = {}) {
    this.enabled = config.enabled !== false
    this.sampleRate = config.sampleRate || 1.0
    this.maxRecords = config.maxRecords || 100
    this.fpsThreshold = config.fpsThreshold || 50
    this.slowApiThreshold = config.slowApiThreshold || 2000
    
    if (this.enabled) {
      this._setupPageMonitor()
      this._setupMemoryMonitor()
      this._setupFPSMonitor()
      
      console.log('[PerformanceMonitor] 性能监控已启动')
    }
  }

  /**
   * 监控页面加载性能
   * @param {string} pagePath 页面路径
   * @param {number} loadTime 加载耗时(ms)
   */
  recordPageLoad(pagePath, loadTime) {
    if (!this._shouldSample()) return

    const metric = {
      page: pagePath,
      loadTime: loadTime,
      timestamp: Date.now()
    }

    this.metrics.pageLoad.unshift(metric)
    this._trimMetrics('pageLoad')

    // 慢页面警告
    if (loadTime > 3000) {
      console.warn(`[PerformanceMonitor] 慢页面: ${pagePath} 加载耗时 ${loadTime}ms`)
    }

    return metric
  }

  /**
   * 监控API请求性能
   * @param {string} url API地址
   * @param {number} duration 请求耗时(ms)
   * @param {boolean} success 是否成功
   */
  recordApiRequest(url, duration, success = true) {
    if (!this._shouldSample()) return

    const metric = {
      url: this._sanitizeUrl(url),
      duration: duration,
      success: success,
      timestamp: Date.now()
    }

    this.metrics.apiRequest.unshift(metric)
    this._trimMetrics('apiRequest')

    // 慢API警告
    if (duration > this.slowApiThreshold) {
      console.warn(`[PerformanceMonitor] 慢API: ${url} 耗时 ${duration}ms`)
    }

    // 失败API警告
    if (!success) {
      console.warn(`[PerformanceMonitor] API失败: ${url}`)
    }

    return metric
  }

  /**
   * 监控内存使用
   */
  recordMemoryUsage() {
    if (!this._shouldSample()) return
    if (!performance || !performance.memory) return

    const memory = performance.memory
    const metric = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now()
    }

    this.metrics.memoryUsage.unshift(metric)
    this._trimMetrics('memoryUsage')

    // 内存警告
    const usage = metric.usedJSHeapSize / metric.jsHeapSizeLimit
    if (usage > 0.9) {
      console.warn(`[PerformanceMonitor] 内存使用率高: ${(usage * 100).toFixed(1)}%`)
    }

    return metric
  }

  /**
   * 监控FPS
   */
  recordFPS(fps) {
    if (!this._shouldSample()) return

    const metric = {
      fps: fps,
      timestamp: Date.now()
    }

    this.metrics.fps.unshift(metric)
    this._trimMetrics('fps')

    // 低FPS警告
    if (fps < this.fpsThreshold) {
      console.warn(`[PerformanceMonitor] 低FPS: ${fps}`)
    }

    return metric
  }

  /**
   * 获取性能报告
   */
  getReport() {
    const report = {}

    // 页面加载统计
    if (this.metrics.pageLoad.length > 0) {
      const loadTimes = this.metrics.pageLoad.map(m => m.loadTime)
      report.pageLoad = {
        count: loadTimes.length,
        avg: this._average(loadTimes),
        min: Math.min(...loadTimes),
        max: Math.max(...loadTimes),
        p95: this._percentile(loadTimes, 0.95)
      }
    }

    // API请求统计
    if (this.metrics.apiRequest.length > 0) {
      const durations = this.metrics.apiRequest.map(m => m.duration)
      const successCount = this.metrics.apiRequest.filter(m => m.success).length
      
      report.apiRequest = {
        count: durations.length,
        avg: this._average(durations),
        min: Math.min(...durations),
        max: Math.max(...durations),
        p95: this._percentile(durations, 0.95),
        successRate: (successCount / durations.length * 100).toFixed(2) + '%'
      }
    }

    // 内存使用统计
    if (this.metrics.memoryUsage.length > 0) {
      const latest = this.metrics.memoryUsage[0]
      report.memory = {
        used: (latest.usedJSHeapSize / 1048576).toFixed(2) + 'MB',
        total: (latest.totalJSHeapSize / 1048576).toFixed(2) + 'MB',
        limit: (latest.jsHeapSizeLimit / 1048576).toFixed(2) + 'MB',
        usage: (latest.usedJSHeapSize / latest.jsHeapSizeLimit * 100).toFixed(2) + '%'
      }
    }

    // FPS统计
    if (this.metrics.fps.length > 0) {
      const fpsValues = this.metrics.fps.map(m => m.fps)
      report.fps = {
        avg: this._average(fpsValues).toFixed(0),
        min: Math.min(...fpsValues),
        max: Math.max(...fpsValues)
      }
    }

    return report
  }

  /**
   * 清空所有指标
   */
  clearMetrics() {
    Object.keys(this.metrics).forEach(key => {
      this.metrics[key] = []
    })
    console.log('[PerformanceMonitor] 性能指标已清空')
  }

  /**
   * 设置页面监控
   * @private
   */
  _setupPageMonitor() {
    // 监听页面加载
    uni.$on('onPageLoad', (data) => {
      const { pagePath, loadTime } = data
      this.recordPageLoad(pagePath, loadTime)
    })
  }

  /**
   * 设置内存监控
   * @private
   */
  _setupMemoryMonitor() {
    if (!performance || !performance.memory) return

    // 每30秒记录一次内存
    setInterval(() => {
      this.recordMemoryUsage()
    }, 30000)
  }

  /**
   * 设置FPS监控
   * @private
   */
  _setupFPSMonitor() {
    let frameCount = 0
    let lastTime = Date.now()

    const countFPS = () => {
      frameCount++
      const currentTime = Date.now()
      
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount
        this.recordFPS(fps)
        frameCount = 0
        lastTime = currentTime
      }

      if (this.enabled) {
        requestAnimationFrame(countFPS)
      }
    }

    requestAnimationFrame(countFPS)
  }

  /**
   * 判断是否采样
   * @private
   */
  _shouldSample() {
    return Math.random() < this.sampleRate
  }

  /**
   * 修剪指标数组
   * @private
   */
  _trimMetrics(key) {
    if (this.metrics[key].length > this.maxRecords) {
      this.metrics[key] = this.metrics[key].slice(0, this.maxRecords)
    }
  }

  /**
   * 计算平均值
   * @private
   */
  _average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  /**
   * 计算百分位
   * @private
   */
  _percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b)
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[index]
  }

  /**
   * 清理URL（移除敏感信息）
   * @private
   */
  _sanitizeUrl(url) {
    try {
      const urlObj = new URL(url)
      // 移除查询参数中的敏感信息
      const sensitiveParams = ['token', 'password', 'secret']
      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '***')
        }
      })
      return urlObj.pathname + urlObj.search
    } catch (e) {
      return url
    }
  }
}

// 导出单例
const performanceMonitor = new PerformanceMonitor()

export default performanceMonitor
export { PerformanceMonitor }
