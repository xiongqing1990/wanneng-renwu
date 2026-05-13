/**
 * 主题管理工具
 * 支持亮色/暗色模式切换
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'light'
    this.themes = {
      light: {
        name: '亮色模式',
        primaryColor: '#07C160',
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        subTextColor: '#666666',
        borderColor: '#E5E5E5',
        cardBackgroundColor: '#FFFFFF'
      },
      dark: {
        name: '暗色模式',
        primaryColor: '#07C160',
        backgroundColor: '#1A1A1A',
        textColor: '#FFFFFF',
        subTextColor: '#999999',
        borderColor: '#333333',
        cardBackgroundColor: '#2C2C2C'
      }
    }
    this.initialized = false
  }

  /**
   * 初始化主题管理器
   */
  init() {
    // 从本地存储恢复主题
    try {
      const savedTheme = uni.getStorageSync('theme')
      if (savedTheme && this.themes[savedTheme]) {
        this.currentTheme = savedTheme
      } else {
        // 检测系统主题
        const systemTheme = this._getSystemTheme()
        this.currentTheme = systemTheme
      }
    } catch (e) {
      console.warn('[ThemeManager] 恢复主题失败', e)
    }

    this.initialized = true
    this._applyTheme()
    console.log(`[ThemeManager] 主题初始化成功: ${this.currentTheme}`)
  }

  /**
   * 切换主题
   * @param {string} theme 主题名称（'light' 或 'dark'）
   */
  setTheme(theme) {
    if (!this.themes[theme]) {
      throw new Error(`无效的主题: ${theme}`)
    }

    this.currentTheme = theme
    this._applyTheme()
    this._saveTheme()

    // 触发主题变更事件
    uni.$emit('themeChanged', theme)
    
    console.log(`[ThemeManager] 主题已切换为: ${theme}`)
  }

  /**
   * 切换至下一个主题
   */
  toggleTheme() {
    const themes = Object.keys(this.themes)
    const currentIndex = themes.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    this.setTheme(themes[nextIndex])
  }

  /**
   * 获取当前主题
   * @returns {string} 主题名称
   */
  getTheme() {
    return this.currentTheme
  }

  /**
   * 获取主题配置
   * @param {string} theme 主题名称（可选，默认当前主题）
   * @returns {Object} 主题配置对象
   */
  getThemeConfig(theme = this.currentTheme) {
    return this.themes[theme] || this.themes.light
  }

  /**
   * 应用主题到页面
   * @private
   */
  _applyTheme() {
    const themeConfig = this.getThemeConfig()
    const root = document.documentElement

    // 设置CSS变量
    root.style.setProperty('--primary-color', themeConfig.primaryColor)
    root.style.setProperty('--background-color', themeConfig.backgroundColor)
    root.style.setProperty('--text-color', themeConfig.textColor)
    root.style.setProperty('--sub-text-color', themeConfig.subTextColor)
    root.style.setProperty('--border-color', themeConfig.borderColor)
    root.style.setProperty('--card-background-color', themeConfig.cardBackgroundColor)

    // 设置页面背景色
    document.body.style.backgroundColor = themeConfig.backgroundColor
    document.body.style.color = themeConfig.textColor
  }

  /**
   * 保存主题到本地存储
   * @private
   */
  _saveTheme() {
    try {
      uni.setStorageSync('theme', this.currentTheme)
    } catch (e) {
      console.warn('[ThemeManager] 保存主题失败', e)
    }
  }

  /**
   * 获取系统主题
   * @private
   * @returns {string} 系统主题（'light' 或 'dark'）
   */
  _getSystemTheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    }
    return 'light'
  }

  /**
   * 监听系统主题变化
   */
  watchSystemTheme() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const newTheme = e.matches ? 'dark' : 'light'
        this.setTheme(newTheme)
        console.log(`[ThemeManager] 系统主题变化，切换为: ${newTheme}`)
      })
    }
  }
}

// 导出单例
const themeManager = new ThemeManager()

export default themeManager
export { ThemeManager }
