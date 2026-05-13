/**
 * 无障碍支持工具
 * 提供语音朗读、键盘导航等无障碍功能
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

class AccessibilityHelper {
  constructor() {
    this.enabled = true
    this.voiceEnabled = false
    this.voiceRate = 1.0
    this.voicePitch = 1.0
    this.voiceLang = 'zh-CN'
  }

  /**
   * 初始化无障碍支持
   */
  init(config = {}) {
    this.enabled = config.enabled !== false
    this.voiceEnabled = config.voiceEnabled || false
    this.voiceRate = config.voiceRate || 1.0
    this.voicePitch = config.voicePitch || 1.0
    this.voiceLang = config.voiceLang || 'zh-CN'
    
    if (this.enabled) {
      this._setupKeyboardNavigation()
      console.log('[Accessibility] 无障碍支持已启用')
    }
  }

  /**
   * 语音朗读
   * @param {string} text 要朗读的文本
   * @param {Object} options 配置项
   */
  speak(text, options = {}) {
    if (!this.enabled || !this.voiceEnabled) return
    
    if (!('speechSynthesis' in window)) {
      console.warn('[Accessibility] 当前浏览器不支持语音合成')
      return
    }
    
    // 停止当前朗读
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate || this.voiceRate
    utterance.pitch = options.pitch || this.voicePitch
    utterance.lang = options.lang || this.voiceLang
    utterance.volume = options.volume || 1.0
    
    window.speechSynthesis.speak(utterance)
  }

  /**
   * 停止朗读
   */
  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  /**
   * 设置键盘导航
   * @private
   */
  _setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Tab键导航
      if (e.key === 'Tab') {
        this._handleTabNavigation(e)
      }
      
      // Enter/Space键激活
      if (e.key === 'Enter' || e.key === ' ') {
        this._handleActivation(e)
      }
    })
  }

  /**
   * 处理Tab导航
   * @private
   */
  _handleTabNavigation(e) {
    const focusableElements = this._getFocusableElements()
    const currentIndex = focusableElements.indexOf(document.activeElement)
    
    if (e.shiftKey) {
      // Shift+Tab：向前导航
      if (currentIndex <= 0) {
        e.preventDefault()
        focusableElements[focusableElements.length - 1].focus()
      }
    } else {
      // Tab：向后导航
      if (currentIndex === focusableElements.length - 1) {
        e.preventDefault()
        focusableElements[0].focus()
      }
    }
  }

  /**
   * 处理激活（Enter/Space）
   * @private
   */
  _handleActivation(e) {
    const target = e.target
    
    // 如果当前焦点在可点击元素上
    if (target.hasAttribute('role') || target.tagName === 'BUTTON' || target.tagName === 'A') {
      // 触发点击事件
      target.click()
    }
  }

  /**
   * 获取所有可聚焦元素
   * @private
   */
  _getFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="link"]'
    ].join(',')
    
    return Array.from(document.querySelectorAll(selector))
      .filter(el => this._isVisible(el))
  }

  /**
   * 判断元素是否可见
   * @private
   */
  _isVisible(el) {
    const style = window.getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
  }

  /**
   * 为元素添加ARIA属性
   * @param {HTMLElement} element 目标元素
   * @param {Object} ariaAttrs ARIA属性对象
   */
  setAriaAttributes(element, ariaAttrs) {
    if (!this.enabled) return
    
    Object.keys(ariaAttrs).forEach(key => {
      const attrName = key.startsWith('aria-') ? key : `aria-${key}`
      element.setAttribute(attrName, ariaAttrs[key])
    })
  }

  /**
   * 创建可访问的按钮
   * @param {HTMLElement} element 目标元素
   * @param {string} label 标签文本
   */
  makeAccessibleButton(element, label) {
    if (!this.enabled) return
    
    element.setAttribute('role', 'button')
    element.setAttribute('tabindex', '0')
    element.setAttribute('aria-label', label)
  }

  /**
   * 创建可访问的链接
   * @param {HTMLElement} element 目标元素
   * @param {string} label 标签文本
   */
  makeAccessibleLink(element, label) {
    if (!this.enabled) return
    
    element.setAttribute('role', 'link')
    element.setAttribute('tabindex', '0')
    element.setAttribute('aria-label', label)
  }

  /**
   * 播报页面变化（用于屏幕阅读器）
   * @param {string} message 播报消息
   */
  announce(message) {
    if (!this.enabled) return
    
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'alert')
    announcement.setAttribute('aria-live', 'polite')
    announcement.style.position = 'absolute'
    announcement.style.left = '-9999px'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // 播报后移除
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * 启用语音朗读
   */
  enableVoice() {
    this.voiceEnabled = true
    console.log('[Accessibility] 语音朗读已启用')
  }

  /**
   * 禁用语音朗读
   */
  disableVoice() {
    this.voiceEnabled = false
    this.stopSpeaking()
    console.log('[Accessibility] 语音朗读已禁用')
  }
}

// 导出单例
const accessibility = new AccessibilityHelper()

export default accessibility
export { AccessibilityHelper }
