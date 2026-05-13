/**
 * 调试工具
 * Vue Devtools扩展、性能分析工具
 */

class DevTools {
  constructor(options = {}) {
    this.enabled = options.enabled !== false && process.env.NODE_ENV === 'development'
    this.panels = new Map()
    this.logs = []
    this.maxLogs = options.maxLogs || 1000
  }
  
  /**
   * 初始化
   */
  init() {
    if (!this.enabled) return
    
    // 添加Vue Devtools扩展
    this.addVueDevtools()
    
    // 添加性能分析面板
    this.addPerformancePanel()
    
    // 添加状态查看面板
    this.addStatePanel()
    
    console.log('DevTools initialized')
  }
  
  /**
   * 添加Vue Devtools扩展
   */
  addVueDevtools() {
    if (typeof window === 'undefined') return
    
    // 监听Vue实例
    window.addEventListener('message', (event) => {
      if (event.data.source === 'vue-devtools') {
        // 与Vue Devtools通信
        this.handleDevtoolsMessage(event.data)
      }
    })
  }
  
  /**
   * 处理Vue Devtools消息
   */
  handleDevtoolsMessage(data) {
    switch (data.type) {
      case 'vue-get-instance':
        // 返回Vue实例信息
        break
      case 'vue-get-component-tree':
        // 返回组件树
        break
      default:
        break
    }
  }
  
  /**
   * 添加性能分析面板
   */
  addPerformancePanel() {
    if (typeof window === 'undefined') return
    
    const panel = {
      name: 'Performance',
      methods: {
        measure: (name, fn) => {
          const start = performance.now()
          const result = fn()
          const end = performance.now()
          
          this.logs.push({
            type: 'performance',
            name,
            duration: end - start,
            timestamp: new Date().toISOString()
          })
          
          // 限制日志数量
          if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs)
          }
          
          return result
        },
        
        getLogs: () => {
          return this.logs.filter(log => log.type === 'performance')
        },
        
        clearLogs: () => {
          this.logs = this.logs.filter(log => log.type !== 'performance')
        }
      }
    }
    
    this.panels.set('performance', panel)
  }
  
  /**
   * 添加状态查看面板
   */
  addStatePanel() {
    if (typeof window === 'undefined') return
    
    const panel = {
      name: 'State',
      methods: {
        getState: (vm) => {
          if (!vm) return null
          
          return {
            data: vm.$data,
            props: vm.$props,
            computed: vm.$computed,
            route: vm.$route
          }
        },
        
        setState: (vm, newState) => {
          if (!vm) return
          
          Object.assign(vm.$data, newState)
        },
        
        getComponentTree: (vm) => {
          if (!vm) return []
          
          const children = vm.$children.map(child => ({
            name: child.$options.name || 'anonymous',
            children: this.getComponentTree(child)
          }))
          
          return children
        }
      }
    }
    
    this.panels.set('state', panel)
  }
  
  /**
   * 创建调试面板UI
   */
  createDebugPanel() {
    if (typeof document === 'undefined') return
    
    const panel = document.createElement('div')
    panel.id = 'devtools-panel'
    panel.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 300px;
      height: 200px;
      background: #fff;
      border: 1px solid #ddd;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 99999;
      overflow: auto;
      font-family: monospace;
      font-size: 12px;
    `
    
    panel.innerHTML = `
      <div style="padding: 8px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
        <strong>DevTools</strong>
        <button style="float: right;" onclick="this.parentNode.parentNode.style.display='none'">×</button>
      </div>
      <div style="padding: 8px;">
        <div><strong>Performance Logs:</strong> ${this.logs.filter(l => l.type === 'performance').length}</div>
        <div><strong>Last Measure:</strong> ${this.logs.filter(l => l.type === 'performance').pop()?.duration || 'N/A'}ms</div>
      </div>
    `
    
    document.body.appendChild(panel)
  }
  
  /**
   * 测量函数执行时间
   */
  measure(name, fn) {
    if (!this.enabled) return fn()
    
    const panel = this.panels.get('performance')
    if (panel && panel.methods.measure) {
      return panel.methods.measure(name, fn)
    }
    
    return fn()
  }
  
  /**
   * 调试日志
   */
  debug(...args) {
    if (!this.enabled) return
    
    const logEntry = {
      type: 'debug',
      args,
      timestamp: new Date().toISOString()
    }
    
    this.logs.push(logEntry)
    
    console.log('[DevTools]', ...args)
  }
  
  /**
   * 查看组件状态
   */
  inspectComponent(vm) {
    if (!this.enabled || !vm) return null
    
    const panel = this.panels.get('state')
    if (panel && panel.methods.getState) {
      return panel.methods.getState(vm)
    }
    
    return null
  }
  
  /**
   * 获取组件树
   */
  getComponentTree(vm) {
    if (!this.enabled || !vm) return []
    
    const panel = this.panels.get('state')
    if (panel && panel.methods.getComponentTree) {
      return panel.methods.getComponentTree(vm)
    }
    
    return []
  }
  
  /**
   * 导出调试信息
   */
  exportDebugInfo() {
    return {
      logs: this.logs,
      panels: Array.from(this.panels.keys()),
      timestamp: new Date().toISOString()
    }
  }
  
  /**
   * 清除调试信息
   */
  clear() {
    this.logs = []
    this.panels.clear()
    
    console.log('DevTools cleared')
  }
}

// 创建默认调试工具
const devTools = new DevTools({
  enabled: process.env.NODE_ENV === 'development',
  maxLogs: 1000
})

// 自动初始化
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  devTools.init()
  
  // 将devTools挂载到window
  window.$devTools = devTools
}

// Vue插件
export const DevToolsPlugin = {
  install(Vue, options) {
    const tools = new DevTools(options)
    
    if (process.env.NODE_ENV === 'development') {
      tools.init()
    }
    
    Vue.prototype.$devTools = tools
    
    // 全局混入
    Vue.mixin({
      mounted() {
        if (tools.enabled && this.$options.devTools !== false) {
          // 记录组件挂载
          tools.debug(`Component mounted: ${this.$options.name || 'anonymous'}`)
        }
      },
      
      beforeDestroy() {
        if (tools.enabled && this.$options.devTools !== false) {
          // 记录组件销毁
          tools.debug(`Component destroyed: ${this.$options.name || 'anonymous'}`)
        }
      }
    })
  }
}

export default devTools
