/**
 * 无障碍支持工具
 * 屏幕阅读器、键盘导航、ARIA
 */

class Accessibility {
  constructor() {
    this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  }
  
  /**
   * 为元素添加ARIA标签
   */
  addARIALabel(element, label) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (element) {
      element.setAttribute('aria-label', label)
    }
  }
  
  /**
   * 为元素添加ARIA描述
   */
  addARIADescription(element, description) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (element) {
      const id = this.generateUniqueId()
      element.setAttribute('aria-describedby', id)
      
      const descEl = document.createElement('div')
      descEl.id = id
      descEl.className = 'sr-only'
      descEl.textContent = description
      element.parentNode.insertBefore(descEl, element.nextSibling)
    }
  }
  
  /**
   * 设置ARIA角色
   */
  setARIARole(element, role) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (element) {
      element.setAttribute('role', role)
    }
  }
  
  /**
   * 设置ARIA状态
   */
  setARIAState(element, state, value) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (element) {
      element.setAttribute(`aria-${state}`, value)
    }
  }
  
  /**
   * 使元素可聚焦
   */
  makeFocusable(element, tabIndex = 0) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (element) {
      element.setAttribute('tabindex', tabIndex)
    }
  }
  
  /**
   * 使元素不可聚焦
   */
  makeUnfocusable(element) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (element) {
      element.setAttribute('tabindex', '-1')
      element.setAttribute('aria-hidden', 'true')
    }
  }
  
  /**
   * 焦点管理：聚焦到第一个可聚焦元素
   */
  focusFirst(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container)
    }
    
    if (!container) return
    
    const focusable = container.querySelectorAll(this.focusableElements)
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }
  
  /**
   * 焦点管理：聚焦到最后一个可聚焦元素
   */
  focusLast(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container)
    }
    
    if (!container) return
    
    const focusable = container.querySelectorAll(this.focusableElements)
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus()
    }
  }
  
  /**
   * 键盘导航：捕获Tab键
   */
  trapFocus(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container)
    }
    
    if (!container) return
    
    const focusable = container.querySelectorAll(this.focusableElements)
    if (focusable.length === 0) return
    
    const firstFocusable = focusable[0]
    const lastFocusable = focusable[focusable.length - 1]
    
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable.focus()
          }
        }
      }
    })
  }
  
  /**
   * 通知屏幕阅读器
   */
  announce(message, priority = 'polite') {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    
    document.body.appendChild(announcement)
    
    // 3秒后移除
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 3000)
  }
  
  /**
   * 跳过链接（跳到主要内容）
   */
  addSkipLink(target, text = '跳到主要内容') {
    const skipLink = document.createElement('a')
    skipLink.href = `#${target}`
    skipLink.className = 'skip-link'
    skipLink.textContent = text
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      z-index: 100;
      padding: 8px;
      background: #000;
      color: #fff;
      text-decoration: none;
    `
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0'
    })
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })
    
    document.body.insertBefore(skipLink, document.body.firstChild)
  }
  
  /**
   * 增加点击区域（适用于移动端）
   */
  enlargeClickArea(element, size = 44) {
    if (typeof element === 'string') {
      element = document.querySelector(element)
    }
    
    if (!element) return
    
    const existingPadding = parseInt(window.getComputedStyle(element).padding)
    const newPadding = Math.max(existingPadding, Math.floor((size - element.offsetHeight) / 2))
    
    element.style.padding = `${newPadding}px`
    element.style.cursor = 'pointer'
  }
  
  /**
   * 生成唯一ID
   */
  generateUniqueId() {
    return `a11y-${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 检测是否使用屏幕阅读器
   */
  isUsingScreenReader() {
    // 简单检测：检查是否通过Tab导航
    let usingKeyboard = false
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        usingKeyboard = true
      }
    })
    
    return usingKeyboard
  }
}

/**
 * Vue混入：无障碍支持
 */
export const a11yMixin = {
  mounted() {
    // 自动为按钮添加ARIA标签（如果没有文本）
    const buttons = this.$el.querySelectorAll('button:not([aria-label])')
    buttons.forEach(button => {
      if (!button.textContent.trim()) {
        console.warn('Button missing aria-label:', button)
      }
    })
  }
}

/**
 * 创建无障碍实例
 */
const a11y = new Accessibility()

export default a11y
