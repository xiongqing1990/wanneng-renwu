/**
 * 主题管理
 * 支持亮色/暗色模式
 */

class Theme {
  constructor(options = {}) {
    this.currentTheme = options.default || 'light'
    this.storageKey = options.storageKey || 'app_theme'
    this.followSystem = options.followSystem !== false
    this.systemThemeMediaQuery = null
    
    this.themes = {
      light: {
        'primary-color': '#07C160',
        'bg-color': '#ffffff',
        'bg-secondary': '#f5f5f5',
        'text-primary': '#333333',
        'text-secondary': '#666666',
        'border-color': '#e0e0e0',
        'shadow': '0 2px 8px rgba(0,0,0,0.1)'
      },
      dark: {
        'primary-color': '#07C160',
        'bg-color': '#1a1a1a',
        'bg-secondary': '#2d2d2d',
        'text-primary': '#ffffff',
        'text-secondary': '#aaaaaa',
        'border-color': '#404040',
        'shadow': '0 2px 8px rgba(0,0,0,0.3)'
      }
    }
    
    this.init()
  }
  
  init() {
    // 从localStorage读取主题
    const savedTheme = localStorage.getItem(this.storageKey)
    
    if (savedTheme && this.themes[savedTheme]) {
      this.setTheme(savedTheme)
    } else if (this.followSystem) {
      // 跟随系统
      this.setupSystemThemeListener()
    } else {
      this.setTheme(this.currentTheme)
    }
  }
  
  setupSystemThemeListener() {
    if (!window.matchMedia) return
    
    this.systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleSystemThemeChange = (e) => {
      this.setTheme(e.matches ? 'dark' : 'light')
    }
    
    // 初始设置
    handleSystemThemeChange(this.systemThemeMediaQuery)
    
    // 监听变化
    if (this.systemThemeMediaQuery.addEventListener) {
      this.systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange)
    } else {
      // 兼容旧浏览器
      this.systemThemeMediaQuery.addListener(handleSystemThemeChange)
    }
  }
  
  setTheme(themeName) {
    if (!this.themes[themeName]) {
      console.warn(`Theme "${themeName}" does not exist`)
      return
    }
    
    this.currentTheme = themeName
    
    // 保存到localStorage
    localStorage.setItem(this.storageKey, themeName)
    
    // 应用主题
    this.applyTheme(themeName)
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: themeName }
    }))
  }
  
  applyTheme(themeName) {
    const theme = this.themes[themeName]
    const root = document.documentElement
    
    // 设置CSS变量
    Object.keys(theme).forEach(key => {
      root.style.setProperty(`--${key}`, theme[key])
    })
    
    // 设置data-theme属性
    root.setAttribute('data-theme', themeName)
    
    // 兼容不支持CSS变量的浏览器
    if (!this.supportsCSSVariables()) {
      this.applyFallbackTheme(themeName)
    }
  }
  
  supportsCSSVariables() {
    return window.CSS && window.CSS.supports && window.CSS.supports('--test', '0')
  }
  
  applyFallbackTheme(themeName) {
    const theme = this.themes[themeName]
    const body = document.body
    
    if (themeName === 'dark') {
      body.style.backgroundColor = theme['bg-color']
      body.style.color = theme['text-primary']
    } else {
      body.style.backgroundColor = theme['bg-color']
      body.style.color = theme['text-primary']
    }
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    this.setTheme(newTheme)
  }
  
  getTheme() {
    return this.currentTheme
  }
  
  getThemes() {
    return Object.keys(this.themes)
  }
  
  addTheme(name, variables) {
    this.themes[name] = variables
  }
  
  removeTheme(name) {
    if (name === 'light' || name === 'dark') {
      console.warn(`Cannot remove built-in theme: ${name}`)
      return false
    }
    
    delete this.themes[name]
    
    // 如果正在使用被删除的主题，切换到light
    if (this.currentTheme === name) {
      this.setTheme('light')
    }
    
    return true
  }
  
  destroy() {
    if (this.systemThemeMediaQuery) {
      if (this.systemThemeMediaQuery.removeEventListener) {
        this.systemThemeMediaQuery.removeEventListener('change')
      } else {
        this.systemThemeMediaQuery.removeListener()
      }
    }
  }
}

// 创建默认主题实例
const theme = new Theme({
  default: 'light',
  followSystem: true
})

// Vue插件
export const ThemePlugin = {
  install(Vue, options) {
    const themeInstance = new Theme(options)
    
    Vue.prototype.$theme = themeInstance
    
    Vue.mixin({
      computed: {
        currentTheme() {
          return themeInstance.getTheme()
        }
      },
      
      methods: {
        toggleTheme() {
          themeInstance.toggleTheme()
        },
        
        setTheme(themeName) {
          themeInstance.setTheme(themeName)
        }
      }
    })
  }
}

export default theme
