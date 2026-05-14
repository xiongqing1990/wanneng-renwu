/**
 * 手势操作增强工具
 * 提供左滑、右滑、长按等手势支持
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

class GestureHandler {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      swipeThreshold: options.swipeThreshold || 50,   // 滑动阈值
      longPressDelay: options.longPressDelay || 500,   // 长按延迟
      vibrate: options.vibrate !== false,               // 是否震动反馈
      ...options
    }
    
    this.touchStartX = 0
    this.touchStartY = 0
    this.touchStartTime = 0
    this.longPressTimer = null
    this.isSwiping = false
    
    this._bindEvents()
  }

  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    this.element.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false })
    this.element.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false })
    this.element.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false })
    this.element.addEventListener('touchcancel', this._onTouchCancel.bind(this), { passive: false })
  }

  /**
   * 触摸开始
   * @private
   */
  _onTouchStart(e) {
    const touch = e.touches[0]
    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
    this.touchStartTime = Date.now()
    this.isSwiping = false
    
    // 长按检测
    this.longPressTimer = setTimeout(() => {
      if (!this.isSwiping) {
        this._emit('longpress', e)
        
        // 震动反馈
        if (this.options.vibrate && navigator.vibrate) {
          navigator.vibrate(50)
        }
      }
    }, this.options.longPressDelay)
    
    this._emit('touchstart', e)
  }

  /**
   * 触摸移动
   * @private
   */
  _onTouchMove(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - this.touchStartX
    const deltaY = touch.clientY - this.touchStartY
    
    // 判断是否为滑动
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      this.isSwiping = true
      
      // 阻止默认行为（防止页面滚动）
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault()
      }
    }
    
    this._emit('touchmove', e, { deltaX, deltaY })
  }

  /**
   * 触摸结束
   * @private
   */
  _onTouchEnd(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - this.touchStartX
    const deltaY = touch.clientY - this.touchStartY
    const deltaTime = Date.now() - this.touchStartTime
    
    // 滑动手势
    if (Math.abs(deltaX) > this.options.swipeThreshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (deltaX > 0) {
          this._emit('swiperight', e, { deltaX, deltaY, deltaTime })
        } else {
          this._emit('swipeleft', e, { deltaX, deltaY, deltaTime })
        }
      } else {
        // 垂直滑动
        if (deltaY > 0) {
          this._emit('swipedown', e, { deltaX, deltaY, deltaTime })
        } else {
          this._emit('swipeup', e, { deltaX, deltaY, deltaTime })
        }
      }
    }
    // 点击（没有滑动）
    else if (!this.isSwiping) {
      this._emit('tap', e)
    }
    
    this._emit('touchend', e, { deltaX, deltaY, deltaTime })
  }

  /**
   * 触摸取消
   * @private
   */
  _onTouchCancel(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    this._emit('touchcancel', e)
  }

  /**
   * 触发事件
   * @private
   */
  _emit(eventName, originalEvent, extraData = {}) {
    if (this.options[`on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`]) {
      this.options[`on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`]({
        originalEvent,
        ...extraData
      })
    }
  }

  /**
   * 销毁（移除事件监听）
   */
  destroy() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
    }
    
    this.element.removeEventListener('touchstart', this._onTouchStart)
    this.element.removeEventListener('touchmove', this._onTouchMove)
    this.element.removeEventListener('touchend', this._onTouchEnd)
    this.element.removeEventListener('touchcancel', this._onTouchCancel)
  }
}

/**
 * 创建手势处理器
 * @param {HTMLElement} element 目标元素
 * @param {Object} options 配置项
 * @returns {GestureHandler} 手势处理器实例
 */
export function createGesture(element, options = {}) {
  return new GestureHandler(element, options)
}

/**
 * Vue指令：v-gesture
 * 用法：<view v-gesture:swipeleft="onSwipeLeft"></view>
 */
export const gestureDirective = {
  bind(el, binding) {
    const eventName = binding.arg  // swipeleft/swiperight/longpress/tap
    const handler = binding.value
    
    const gesture = createGesture(el, {
      [`on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`]: handler
    })
    
    el._gesture = gesture
  },
  
  unbind(el) {
    if (el._gesture) {
      el._gesture.destroy()
      delete el._gesture
    }
  }
}

export default GestureHandler
