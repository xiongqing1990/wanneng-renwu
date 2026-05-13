/**
 * Web Vitals 性能监控
 * 监控核心Web指标
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

class WebVitalsMonitor {
  constructor() {
    this.initialized = false
    this.metrics = {
      LCP: null,  // Largest Contentful Paint
      FID: null,  // First Input Delay
      CLS: null,  // Cumulative Layout Shift
      FCP: null,  // First Contentful Paint
      TTFB: null  // Time to First Byte
    }
    this.onUpdate = null
  }

  /**
   * 初始化Web Vitals监控
   * @param {Object} config 配置项
   */
  init(config = {}) {
    if (typeof window === 'undefined') {
      console.warn('[WebVitals] 非浏览器环境，跳过初始化')
      return
    }

    this.onUpdate = config.onUpdate || null

    // 监控LCP
    this._measureLCP()

    // 监控FID
    this._measureFID()

    // 监控CLS
    this._measureCLS()

    // 监控FCP
    this._measureFCP()

    // 监控TTFB
    this._measureTTFB()

    this.initialized = true
    console.log('[WebVitals] Web Vitals监控初始化成功')
  }

  /**
   * 获取当前指标
   * @returns {Object} 指标对象
   */
  getMetrics() {
    return { ...this.metrics }
  }

  /**
   * 生成报告
   * @returns {string} 格式化报告
   */
  getReport() {
    const metrics = this.getMetrics()
    let report = '=== Web Vitals 报告 ===\n\n'

    if (metrics.LCP) {
      report += `LCP (最大内容绘制): ${metrics.LCP.toFixed(2)}ms`
      report += ` ${this._getRating(metrics.LCP, 2500, 4000)}\n`
    }

    if (metrics.FID) {
      report += `FID (首次输入延迟): ${metrics.FID.toFixed(2)}ms`
      report += ` ${this._getRating(metrics.FID, 100, 300)}\n`
    }

    if (metrics.CLS) {
      report += `CLS (累积布局偏移): ${metrics.CLS.toFixed(3)}`
      report += ` ${this._getRating(metrics.CLS, 0.1, 0.25, true)}\n`
    }

    if (metrics.FCP) {
      report += `FCP (首次内容绘制): ${metrics.FCP.toFixed(2)}ms`
      report += ` ${this._getRating(metrics.FCP, 1800, 3000)}\n`
    }

    if (metrics.TTFB) {
      report += `TTFB (首字节时间): ${metrics.TTFB.toFixed(2)}ms`
      report += ` ${this._getRating(metrics.TTFB, 800, 1800)}\n`
    }

    return report
  }

  /**
   * 测量LCP
   * @private
   */
  _measureLCP() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        this.metrics.LCP = lastEntry.startTime
        this._notifyUpdate('LCP', this.metrics.LCP)
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      console.warn('[WebVitals] LCP测量失败', e)
    }
  }

  /**
   * 测量FID
   * @private
   */
  _measureFID() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach(entry => {
          this.metrics.FID = entry.processingStart - entry.startTime
          this._notifyUpdate('FID', this.metrics.FID)
        })
      })

      observer.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.warn('[WebVitals] FID测量失败', e)
    }
  }

  /**
   * 测量CLS
   * @private
   */
  _measureCLS() {
    if (!('PerformanceObserver' in window)) return

    try {
      let clsValue = 0

      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            this.metrics.CLS = clsValue
            this._notifyUpdate('CLS', clsValue)
          }
        })
      })

      observer.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      console.warn('[WebVitals] CLS测量失败', e)
    }
  }

  /**
   * 测量FCP
   * @private
   */
  _measureFCP() {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.FCP = entry.startTime
            this._notifyUpdate('FCP', this.metrics.FCP)
          }
        })
      })

      observer.observe({ entryTypes: ['paint'] })
    } catch (e) {
      console.warn('[WebVitals] FCP测量失败', e)
    }
  }

  /**
   * 测量TTFB
   * @private
   */
  _measureTTFB() {
    if (!('performance' in window) || !performance.timing) return

    try {
      const timing = performance.timing
      this.metrics.TTFB = timing.responseStart - timing.requestStart
      this._notifyUpdate('TTFB', this.metrics.TTFB)
    } catch (e) {
      console.warn('[WebVitals] TTFB测量失败', e)
    }
  }

  /**
   * 获取评分
   * @private
   */
  _getRating(value, goodThreshold, poorThreshold, reverse = false) {
    if (reverse) {
      if (value <= goodThreshold) return '✅ Good'
      if (value <= poorThreshold) return '🟡 Needs Improvement'
      return '🔴 Poor'
    } else {
      if (value <= goodThreshold) return '✅ Good'
      if (value <= poorThreshold) return '🟡 Needs Improvement'
      return '🔴 Poor'
    }
  }

  /**
   * 通知更新
   * @private
   */
  _notifyUpdate(metric, value) {
    if (this.onUpdate) {
      this.onUpdate(metric, value)
    }

    // 发送到监控服务器
    this._sendToServer(metric, value)
  }

  /**
   * 发送到监控服务器
   * @private
   */
  _sendToServer(metric, value) {
    // 实际项目中应发送到监控服务器
    // 这里仅打印日志
    console.log(`[WebVitals] ${metric}: ${value}`)
  }
}

// 导出单例
const webVitals = new WebVitalsMonitor()

export default webVitals
export { WebVitalsMonitor }
