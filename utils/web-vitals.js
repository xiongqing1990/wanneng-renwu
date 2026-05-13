/**
 * Web Vitals性能监控
 * 监控核心Web指标
 */

class WebVitals {
  constructor(options = {}) {
    this.trackingEndpoint = options.endpoint || '/api/analytics'
    this.sampleRate = options.sampleRate || 0.1
    this.enabled = options.enabled !== false
    
    if (this.enabled && Math.random() < this.sampleRate) {
      this.init()
    }
  }
  
  init() {
    // 监控LCP (Largest Contentful Paint)
    this.measureLCP()
    
    // 监控FID (First Input Delay)
    this.measureFID()
    
    // 监控CLS (Cumulative Layout Shift)
    this.measureCLS()
    
    // 监控FCP (First Contentful Paint)
    this.measureFCP()
    
    // 监控TTFB (Time to First Byte)
    this.measureTTFB()
  }
  
  /**
   * 监控LCP
   */
  measureLCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      const lcp = lastEntry.renderTime || lastEntry.loadTime
      
      this.report('LCP', lcp)
      
      // 性能评估
      if (lcp > 4000) {
        console.warn('LCP is too high:', lcp, 'ms')
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  }
  
  /**
   * 监控FID
   */
  measureFID() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach(entry => {
        const fid = entry.processingStart - entry.startTime
        
        this.report('FID', fid)
        
        // 性能评估
        if (fid > 300) {
          console.warn('FID is too high:', fid, 'ms')
        }
      })
    }).observe({ type: 'first-input', buffered: true })
  }
  
  /**
   * 监控CLS
   */
  measureCLS() {
    let clsValue = 0
    
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      
      this.report('CLS', clsValue)
      
      // 性能评估
      if (clsValue > 0.25) {
        console.warn('CLS is too high:', clsValue)
      }
    }).observe({ type: 'layout-shift', buffered: true })
  }
  
  /**
   * 监控FCP
   */
  measureFCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach(entry => {
        const fcp = entry.startTime
        
        this.report('FCP', fcp)
        
        // 性能评估
        if (fcp > 3000) {
          console.warn('FCP is too high:', fcp, 'ms')
        }
      })
    }).observe({ type: 'paint', buffered: true })
  }
  
  /**
   * 监控TTFB
   */
  measureTTFB() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      entries.forEach(entry => {
        const ttfb = entry.responseStart - entry.requestStart
        
        this.report('TTFB', ttfb)
        
        // 性能评估
        if (ttfb > 1800) {
          console.warn('TTFB is too high:', ttfb, 'ms')
        }
      })
    }).observe({ type: 'navigation', buffered: true })
  }
  
  /**
   * 上报指标
   */
  report(metric, value) {
    const data = {
      metric,
      value,
      url: window.location.pathname,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    
    // 使用sendBeacon确保数据发送
    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.trackingEndpoint, JSON.stringify(data))
    } else {
      fetch(this.trackingEndpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        keepalive: true
      }).catch(() => {})
    }
    
    // 开发环境打印日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`Web Vital: ${metric} = ${value}`)
    }
  }
  
  /**
   * 获取性能评分
   */
  getScore() {
    // 这里需要从实际的监控数据中获取
    // 伪代码
    return {
      LCP: this.getMetricScore('LCP', [2500, 4000]),
      FID: this.getMetricScore('FID', [100, 300]),
      CLS: this.getMetricScore('CLS', [0.1, 0.25]),
      FCP: this.getMetricScore('FCP', [1800, 3000]),
      TTFB: this.getMetricScore('TTFB', [800, 1800])
    }
  }
  
  /**
   * 获取指标评分
   */
  getMetricScore(metric, thresholds) {
    // 伪代码：实际需要从监控数据中获取
    const value = 0
    
    if (value <= thresholds[0]) {
      return 'good'
    } else if (value <= thresholds[1]) {
      return 'needs-improvement'
    } else {
      return 'poor'
    }
  }
}

// 创建Web Vitals实例
const webVitals = new WebVitals({
  endpoint: '/api/analytics',
  sampleRate: 0.1
})

export default webVitals
