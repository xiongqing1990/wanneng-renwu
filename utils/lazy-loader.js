/**
 * 懒加载工具
 * 图片懒加载、组件懒加载
 */

class LazyLoader {
  constructor(options = {}) {
    this.observerOptions = {
      root: options.root || null,
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.1
    }
    
    this.observer = null
    this.init()
  }
  
  init() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, falling back to scroll listener')
      this.initScrollBased()
      return
    }
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadElement(entry.target)
          this.observer.unobserve(entry.target)
        }
      })
    }, this.observerOptions)
  }
  
  initScrollBased() {
    this.scrollHandler = () => {
      const lazyElements = document.querySelectorAll('[data-lazy]')
      
      lazyElements.forEach(el => {
        if (this.isElementInViewport(el)) {
          this.loadElement(el)
          el.removeAttribute('data-lazy')
        }
      })
    }
    
    window.addEventListener('scroll', this.scrollHandler)
    window.addEventListener('resize', this.scrollHandler)
    window.addEventListener('load', this.scrollHandler)
  }
  
  isElementInViewport(el) {
    const rect = el.getBoundingClientRect()
    const rootMargin = parseInt(this.observerOptions.rootMargin) || 0
    
    return (
      rect.top >= -rootMargin &&
      rect.left >= -rootMargin &&
      rect.bottom <= (window.innerHeight + rootMargin || document.documentElement.clientHeight + rootMargin) &&
      rect.right <= (window.innerWidth + rootMargin || document.documentElement.clientWidth + rootMargin)
    )
  }
  
  /**
   * 观察元素
   */
  observe(element) {
    if (this.observer) {
      this.observer.observe(element)
    } else {
      // Fallback
      element.setAttribute('data-lazy', 'true')
      this.scrollHandler()
    }
  }
  
  /**
   * 停止观察元素
   */
  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element)
    }
  }
  
  /**
   * 加载元素
   */
  loadElement(element) {
    const type = element.dataset.lazyType || 'image'
    
    switch (type) {
      case 'image':
        this.loadImage(element)
        break
      case 'component':
        this.loadComponent(element)
        break
      case 'script':
        this.loadScript(element)
        break
      case 'stylesheet':
        this.loadStylesheet(element)
        break
      default:
        console.warn(`Unknown lazy load type: ${type}`)
    }
  }
  
  /**
   * 懒加载图片
   */
  loadImage(element) {
    const src = element.dataset.src
    const srcset = element.dataset.srcset
    
    if (src) {
      element.src = src
    }
    
    if (srcset) {
      element.srcset = srcset
    }
    
    element.onload = () => {
      element.classList.add('lazy-loaded')
    }
    
    element.onerror = () => {
      console.error(`Failed to load image: ${src}`)
      element.classList.add('lazy-error')
    }
  }
  
  /**
   * 懒加载组件
   */
  loadComponent(element) {
    const componentName = element.dataset.component
    
    if (componentName && window.Vue) {
      // 动态导入组件
      import(`@/components/${componentName}.vue`)
        .then(module => {
          const Component = module.default || module
          
          // 创建Vue实例
          new Vue({
            render: h => h(Component)
          }).$mount(element)
          
          element.classList.add('lazy-loaded')
        })
        .catch(error => {
          console.error(`Failed to load component: ${componentName}`, error)
        })
    }
  }
  
  /**
   * 懒加载脚本
   */
  loadScript(element) {
    const src = element.dataset.src
    
    if (src) {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      
      script.onload = () => {
        element.classList.add('lazy-loaded')
      }
      
      script.onerror = () => {
        console.error(`Failed to load script: ${src}`)
      }
      
      document.head.appendChild(script)
    }
  }
  
  /**
   * 懒加载样式表
   */
  loadStylesheet(element) {
    const href = element.dataset.href
    
    if (href) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      
      link.onload = () => {
        element.classList.add('lazy-loaded')
      }
      
      link.onerror = () => {
        console.error(`Failed to load stylesheet: ${href}`)
      }
      
      document.head.appendChild(link)
    }
  }
  
  /**
   * 销毁
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler)
      window.removeEventListener('resize', this.scrollHandler)
      window.removeEventListener('load', this.scrollHandler)
    }
  }
}

// 创建默认懒加载器
const lazyLoader = new LazyLoader()

// Vue指令：v-lazy
export const LazyDirective = {
  inserted(el, binding) {
    const { value } = binding
    
    // 设置data属性
    el.dataset.lazy = 'true'
    el.dataset.lazyType = value.type || 'image'
    
    if (value.type === 'image') {
      el.dataset.src = value.src
      if (value.srcset) {
        el.dataset.srcset = value.srcset
      }
    } else if (value.type === 'component') {
      el.dataset.component = value.name
    } else if (value.type === 'script') {
      el.dataset.src = value.src
    } else if (value.type === 'stylesheet') {
      el.dataset.href = value.href
    }
    
    // 开始观察
    lazyLoader.observe(el)
  },
  
  unbind(el) {
    lazyLoader.unobserve(el)
  }
}

// Vue插件
export const LazyLoadPlugin = {
  install(Vue, options) {
    const loader = new LazyLoader(options)
    
    Vue.prototype.$lazyLoader = loader
    Vue.directive('lazy', LazyDirective)
  }
}

export default lazyLoader
