/**
 * 代码分割工具
 * 动态导入、按需加载
 */

class CodeSplitter {
  constructor(options = {}) {
    this.chunks = new Map()
    this.loadingChunks = new Map()
    this.preloadChunks = options.preloadChunks || []
  }
  
  /**
   * 注册代码块
   */
  register(name, loader) {
    this.chunks.set(name, {
      loader,
      loaded: false,
      module: null
    })
  }
  
  /**
   * 加载代码块
   */
  async load(name) {
    const chunk = this.chunks.get(name)
    
    if (!chunk) {
      throw new Error(`Chunk "${name}" not registered`)
    }
    
    // 已加载
    if (chunk.loaded) {
      return chunk.module
    }
    
    // 正在加载中
    if (this.loadingChunks.has(name)) {
      return this.loadingChunks.get(name)
    }
    
    // 开始加载
    const promise = chunk.loader()
      .then(module => {
        chunk.loaded = true
        chunk.module = module
        this.loadingChunks.delete(name)
        return module
      })
      .catch(error => {
        this.loadingChunks.delete(name)
        throw error
      })
    
    this.loadingChunks.set(name, promise)
    
    return promise
  }
  
  /**
   * 预加载代码块
   */
  preload(name) {
    if (this.preloadChunks.includes(name)) {
      this.load(name).catch(() => {})
    }
  }
  
  /**
   * 批量加载
   */
  async loadBatch(names) {
    const promises = names.map(name => this.load(name))
    return Promise.all(promises)
  }
  
  /**
   * 检查代码块是否已加载
   */
  isLoaded(name) {
    const chunk = this.chunks.get(name)
    return chunk ? chunk.loaded : false
  }
  
  /**
   * 卸载代码块（释放内存）
   */
  unload(name) {
    const chunk = this.chunks.get(name)
    
    if (chunk && chunk.loaded) {
      chunk.loaded = false
      chunk.module = null
      
      // 触发垃圾回收（如果可能）
      if (global.gc) {
        global.gc()
      }
    }
  }
  
  /**
   * 创建Vue异步组件
   */
  createAsyncComponent(name, options = {}) {
    return () => ({
      component: this.load(name),
      loading: options.loading || null,
      error: options.error || null,
      delay: options.delay || 200,
      timeout: options.timeout || 3000
    })
  }
  
  /**
   * 懒加载路由组件
   */
  lazyRoute(name, componentPath) {
    this.register(name, () => import(componentPath))
    
    return () => this.load(name)
  }
}

// 创建默认代码分割器
const codeSplitter = new CodeSplitter()

// 使用示例：注册异步组件
codeSplitter.register('HeavyComponent', () => import('@/components/HeavyComponent.vue'))

// Vue插件
export const CodeSplitPlugin = {
  install(Vue, options) {
    const splitter = new CodeSplitter(options)
    
    Vue.prototype.$loadChunk = (name) => splitter.load(name)
    Vue.prototype.$isChunkLoaded = (name) => splitter.isLoaded(name)
    
    // 全局混入
    Vue.mixin({
      beforeCreate() {
        // 如果组件配置了asyncComponents
        if (this.$options.asyncComponents) {
          Object.keys(this.$options.asyncComponents).forEach(key => {
            const chunkName = this.$options.asyncComponents[key]
            splitter.load(chunkName).then(module => {
              Vue.component(key, module.default || module)
            })
          })
        }
      }
    })
  }
}

export default codeSplitter
