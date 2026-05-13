/**
 * 人性化功能工具集
 * 智能提示、输入建议、操作引导
 */

class Humanize {
  constructor() {
    this.tips = []
    this.guides = []
    this.suggestions = []
  }
  
  /**
   * 智能提示
   */
  addTip(message, options = {}) {
    const tip = {
      id: this.generateId(),
      message,
      type: options.type || 'info', // info, warning, error, success
      duration: options.duration || 3000,
      action: options.action || null,
      dismissed: false
    }
    
    this.tips.push(tip)
    
    // 显示提示
    this.showTip(tip)
    
    return tip.id
  }
  
  showTip(tip) {
    // 创建提示元素
    const tipEl = document.createElement('div')
    tipEl.className = `humanize-tip humanize-tip--${tip.type}`
    tipEl.innerHTML = `
      <span class="humanize-tip-message">${tip.message}</span>
      ${tip.action ? '<button class="humanize-tip-action">查看</button>' : ''}
      <button class="humanize-tip-close">&times;</button>
    `
    
    tipEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      background: ${this.getTipColor(tip.type)};
      color: #fff;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      animation: slideIn 0.3s ease;
    `
    
    document.body.appendChild(tipEl)
    
    // 自动消失
    setTimeout(() => {
      this.dismissTip(tipEl)
    }, tip.duration)
    
    // 关闭按钮
    tipEl.querySelector('.humanize-tip-close').addEventListener('click', () => {
      this.dismissTip(tipEl)
    })
    
    // 操作按钮
    if (tip.action) {
      tipEl.querySelector('.humanize-tip-action').addEventListener('click', () => {
        tip.action()
        this.dismissTip(tipEl)
      })
    }
  }
  
  dismissTip(tipEl) {
    tipEl.style.animation = 'slideOut 0.3s ease'
    setTimeout(() => {
      if (tipEl.parentNode) {
        tipEl.parentNode.removeChild(tipEl)
      }
    }, 300)
  }
  
  getTipColor(type) {
    const colors = {
      info: '#1890ff',
      warning: '#faad14',
      error: '#ff4d4f',
      success: '#52c41a'
    }
    return colors[type] || colors.info
  }
  
  /**
   * 输入建议
   */
  addSuggestion(input, suggestions) {
    const suggestionBox = document.createElement('div')
    suggestionBox.className = 'humanize-suggestions'
    suggestionBox.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #fff;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 1000;
      display: none;
    `
    
    input.parentNode.style.position = 'relative'
    input.parentNode.appendChild(suggestionBox)
    
    input.addEventListener('input', (e) => {
      const value = e.target.value.toLowerCase()
      
      if (!value) {
        suggestionBox.style.display = 'none'
        return
      }
      
      const matches = suggestions.filter(s => 
        s.toLowerCase().includes(value)
      )
      
      if (matches.length > 0) {
        suggestionBox.innerHTML = matches.map(s => 
          `<div class="humanize-suggestion-item">${s}</div>`
        ).join('')
        
        suggestionBox.style.display = 'block'
        
        // 点击建议
        suggestionBox.querySelectorAll('.humanize-suggestion-item').forEach(item => {
          item.addEventListener('click', () => {
            input.value = item.textContent
            suggestionBox.style.display = 'none'
            input.dispatchEvent(new Event('change'))
          })
        })
      } else {
        suggestionBox.style.display = 'none'
      }
    })
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
        suggestionBox.style.display = 'none'
      }
    })
  }
  
  /**
   * 操作引导
   */
  addGuide(steps) {
    let currentStep = 0
    
    const showStep = (index) => {
      if (index >= steps.length) {
        this.completeGuide()
        return
      }
      
      const step = steps[index]
      const target = document.querySelector(step.selector)
      
      if (!target) {
        console.warn('Guide target not found:', step.selector)
        showStep(index + 1)
        return
      }
      
      // 创建遮罩
      const overlay = document.createElement('div')
      overlay.className = 'humanize-guide-overlay'
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
      `
      
      // 创建提示框
      const tooltip = document.createElement('div')
      tooltip.className = 'humanize-guide-tooltip'
      tooltip.innerHTML = `
        <div class="humanize-guide-title">${step.title || '引导'}</div>
        <div class="humanize-guide-content">${step.content}</div>
        <div class="humanize-guide-actions">
          ${index > 0 ? '<button class="humanize-guide-prev">上一步</button>' : ''}
          <button class="humanize-guide-next">${index < steps.length - 1 ? '下一步' : '完成'}</button>
        </div>
      `
      
      tooltip.style.cssText = `
        position: absolute;
        padding: 16px;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        max-width: 300px;
        z-index: 10001;
      `
      
      // 定位提示框
      const rect = target.getBoundingClientRect()
      tooltip.style.top = `${rect.bottom + 10}px`
      tooltip.style.left = `${rect.left}px`
      
      // 高亮目标元素
      target.style.position = 'relative'
      target.style.zIndex = '10001'
      target.style.boxShadow = '0 0 0 4px #1890ff'
      
      document.body.appendChild(overlay)
      document.body.appendChild(tooltip)
      
      // 按钮事件
      tooltip.querySelector('.humanize-guide-next').addEventListener('click', () => {
        overlay.remove()
        tooltip.remove()
        target.style.zIndex = ''
        target.style.boxShadow = ''
        showStep(index + 1)
      })
      
      if (index > 0) {
        tooltip.querySelector('.humanize-guide-prev').addEventListener('click', () => {
          overlay.remove()
          tooltip.remove()
          target.style.zIndex = ''
          target.style.boxShadow = ''
          showStep(index - 1)
        })
      }
    }
    
    showStep(0)
  }
  
  completeGuide() {
    console.log('Guide completed')
  }
  
  /**
   * 空状态提示
   */
  showEmptyState(container, options = {}) {
    const emptyEl = document.createElement('div')
    emptyEl.className = 'humanize-empty'
    emptyEl.innerHTML = `
      <div class="humanize-empty-icon">${options.icon || '📭'}</div>
      <div class="humanize-empty-title">${options.title || '暂无数据'}</div>
      <div class="humanize-empty-description">${options.description || '暂时没有内容'}</div>
      ${options.action ? `<button class="humanize-empty-action">${options.actionText || '刷新'}</button>` : ''}
    `
    
    emptyEl.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #999;
    `
    
    container.innerHTML = ''
    container.appendChild(emptyEl)
    
    if (options.action) {
      emptyEl.querySelector('.humanize-empty-action').addEventListener('click', options.action)
    }
  }
  
  /**
   * 加载状态
   */
  showLoading(container, text = '加载中...') {
    const loadingEl = document.createElement('div')
    loadingEl.className = 'humanize-loading'
    loadingEl.innerHTML = `
      <div class="humanize-loading-spinner"></div>
      <div class="humanize-loading-text">${text}</div>
    `
    
    loadingEl.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
    `
    
    container.innerHTML = ''
    container.appendChild(loadingEl)
  }
  
  generateId() {
    return `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// 添加CSS动画
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .humanize-loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #1890ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
document.head.appendChild(style)

const humanize = new Humanize()

export default humanize
