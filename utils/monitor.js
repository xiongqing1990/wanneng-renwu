/**
 * 性能监控系统
 * 监控页面性能、API请求、内存、FPS
 */

class Monitor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false
    this.sampleRate = options.sampleRate || 0.1 // 10%采样率
    this.metrics = []
    this.maxMetrics = options.maxMetrics || 500
    this.reportUrl = options.reportUrl || '/api/metrics'
    
    if (this.enabled && Math.random() < this.sampleRate) {
      this.init()
    }
  }
  
  init() {
    // 监控页面加载性能
    this.monitorPageLoad()
    
    // 监控内存使用
    this.monitorMemory()
    
    // 监控FPS
    this.monitorFPS()
    
    // 定期上报
    setInterval(() => this.report(), 30000)
  }
  
  monitorPageLoad() {
    if (!window.performance) return
    
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = performance.timing
        const metrics = {
          // DNS查询时间
          dns: timing.domainLookupEnd - timing.domainLookupStart,
          // TCP连接时间
          tcp: timing.connectEnd - timing.connectStart,
          // 首字节时间
          ttfb: timing.responseStart - timing.requestStart,
          // DOM解析时间
          domParse: timing.domInteractive - timing.domLoading,
          // 页面完全加载时间
          load: timing.loadEventEnd - timing.navigationStart,
          // DOM就绪时间
          domReady: timing.domContentLoadedEventEnd - timing.navigationStart
        }
        
        this.capture('page_load', metrics)
      }, 0)
    })
  }
  
  monitorMemory() {
    if (!performance.memory) return
    
    setInterval(() => {
      const memory = performance.memory
      const metrics = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usage: memory.usedJSHeapSize / memory.jsHeapSizeLimit
      }
      
      this.capture('memory', metrics)
      
      // 内存使用超过80%时报警
      if (metrics.usage > 0.8) {
        console.warn('High memory usage:', metrics.usage)
      }
    }, 10000)
  }
  
  monitorFPS() {
    let frameCount = 0
    let lastTime = performance.now()
    
    const measure = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        this.capture('fps', { fps })
        
        // FPS低于30时报警
        if (fps < 30) {
          console.warn('Low FPS:', fps)
        }
        
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measure)
    }
    
    requestAnimationFrame(measure)
  }
  
  monitorAPI(url, startTime) {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    const metrics = {
      url,
      duration,
      timestamp: new Date().toISOString()
    }
    
    this.capture('api', metrics)
    
    // API耗时超过3秒时报警
    if (duration > 3000) {
      console.warn('Slow API:', url, duration)
    }
  }
  
  capture(type, data) {
    const metric = {
      type,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }
    
    this.metrics.push(metric)
    
    // 限制指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
    
    return metric
  }
  
  report() {
    if (this.metrics.length === 0) return
    
    const data = {
      metrics: [...this.metrics],
      userAgent: navigator.userAgent,
      userId: this.getUserId()
    }
    
    // 上报到服务器
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.reportUrl, JSON.stringify(data))
    }
    
    // 清空已上报的指标
    this.metrics = []
  }
  
  getUserId() {
    return localStorage.getItem('userId') || 'anonymous'
  }
  
  getMetrics(type = null) {
    if (type) {
      return this.metrics.filter(m => m.type === type)
    }
    return [...this.metrics]
  }
  
  clearMetrics() {
    this.metrics = []
  }
}

export default new Monitor({
  enabled: true,
  sampleRate: 0.1,
  maxMetrics: 500,
  reportUrl: '/api/metrics'
})
