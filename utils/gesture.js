/**
 * 手势操作增强工具
 * 支持：滑动左/右、长按、下拉刷新
 */

class Gesture {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      swipeThreshold: options.swipeThreshold || 50, // 滑动阈值
      swipeTimeThreshold: options.swipeTimeThreshold || 300, // 滑动时间阈值
      longPressDelay: options.longPressDelay || 500, // 长按延迟
      ...options
    }
    
    this.touchStartX = 0
    this.touchStartY = 0
    this.touchStartTime = 0
    this.longPressTimer = null
    this.isLongPress = false
    
    this.callbacks = {
      swipeLeft: options.onSwipeLeft || null,
      swipeRight: options.onSwipeRight || null,
      longPress: options.onLongPress || null,
      tap: options.onTap || null
    }
    
    this.init()
  }
  
  init() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
  }
  
  handleTouchStart(event) {
    const touch = event.touches[0]
    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
    this.touchStartTime = Date.now()
    this.isLongPress = false
    
    // 启动长按计时器
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true
      if (this.callbacks.longPress) {
        this.callbacks.longPress(event)
      }
    }, this.options.longPressDelay)
  }
  
  handleTouchMove(event) {
    // 如果移动了，取消长按
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }
  
  handleTouchEnd(event) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    // 如果是长按，不处理滑动
    if (this.isLongPress) return
    
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - this.touchStartX
    const deltaY = touch.clientY - this.touchStartY
    const deltaTime = Date.now() - this.touchStartTime
    
    // 判断是否为滑动
    if (
      Math.abs(deltaX) > this.options.swipeThreshold &&
      deltaTime < this.options.swipeTimeThreshold
    ) {
      if (deltaX > 0 && this.callbacks.swipeRight) {
        this.callbacks.swipeRight(event, deltaX, deltaY)
      } else if (deltaX < 0 && this.callbacks.swipeLeft) {
        this.callbacks.swipeLeft(event, deltaX, deltaY)
      }
    } else if (
      Math.abs(deltaX) < 10 &&
      Math.abs(deltaY) < 10 &&
      this.callbacks.tap
    ) {
      // 点击
      this.callbacks.tap(event)
    }
  }
  
  /**
   * 销毁事件监听
   */
  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart)
    this.element.removeEventListener('touchmove', this.handleTouchMove)
    this.element.removeEventListener('touchend', this.handleTouchEnd)
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
    }
  }
}

/**
 * 创建手势实例的工厂函数
 */
export function createSwipe(element, options = {}) {
  return new Gesture(element, options)
}

/**
 * Vue指令：v-swipe
 */
export const swipeDirective = {
  bind(el, binding) {
    const options = binding.value || {}
    el._gesture = new Gesture(el, options)
  },
  
  unbind(el) {
    if (el._gesture) {
      el._gesture.destroy()
      delete el._gesture
    }
  }
}

/**
 * 下拉刷新
 */
export function pullToRefresh(element, options = {}) {
  const config = {
    threshold: 60,
    maxPull: 120,
    onRefresh: null,
    ...options
  }
  
  let startY = 0
  let pulling = false
  let refreshTriggered = false
  
  const indicator = document.createElement('div')
  indicator.style.cssText = `
    position: absolute;
    top: -50px;
    left: 0;
    right: 0;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #999;
    transition: top 0.3s;
  `
  indicator.textContent = '下拉刷新'
  element.parentNode.insertBefore(indicator, element)
  
  element.addEventListener('touchstart', (e) => {
    if (element.scrollTop > 0) return
    
    startY = e.touches[0].clientY
    pulling = true
  })
  
  element.addEventListener('touchmove', (e) => {
    if (!pulling) return
    
    const currentY = e.touches[0].clientY
    const deltaY = currentY - startY
    
    if (deltaY > 0 && element.scrollTop <= 0) {
      e.preventDefault()
      
      const pullDistance = Math.min(deltaY, config.maxPull)
      element.style.transform = `translateY(${pullDistance}px)`
      indicator.style.top = `${pullDistance - 50}px`
      
      if (pullDistance >= config.threshold && !refreshTriggered) {
        indicator.textContent = '释放刷新'
        refreshTriggered = true
      } else if (pullDistance < config.threshold) {
        indicator.textContent = '下拉刷新'
        refreshTriggered = false
      }
    }
  })
  
  element.addEventListener('touchend', () => {
    if (!pulling) return
    
    pulling = false
    
    if (refreshTriggered && config.onRefresh) {
      indicator.textContent = '正在刷新...'
      config.onRefresh().then(() => {
        indicator.textContent = '刷新完成'
        setTimeout(() => {
          element.style.transform = ''
          indicator.style.top = '-50px'
          refreshTriggered = false
        }, 500)
      })
    } else {
      element.style.transform = ''
      indicator.style.top = '-50px'
    }
  })
}

export default Gesture
