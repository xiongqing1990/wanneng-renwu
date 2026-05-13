/**
 * 图片压缩工具
 * 客户端图片压缩和CDN加速
 */

class ImageOptimizer {
  constructor(options = {}) {
    this.maxWidth = options.maxWidth || 1920
    this.maxHeight = options.maxHeight || 1080
    this.quality = options.quality || 0.8
    this.outputFormat = options.outputFormat || 'image/jpeg'
    this.enableWebP = options.enableWebP && this.supportsWebP()
  }
  
  /**
   * 检查是否支持WebP
   */
  supportsWebP() {
    const canvas = document.createElement('canvas')
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }
  
  /**
   * 压缩图片（从File对象）
   */
  compressFromFile(file, options = {}) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Not an image file'))
        return
      }
      
      const reader = new FileReader()
      
      reader.onload = (e) => {
        this.compressFromDataURL(e.target.result, options)
          .then(resolve)
          .catch(reject)
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      
      reader.readAsDataURL(file)
    })
  }
  
  /**
   * 压缩图片（从Data URL）
   */
  compressFromDataURL(dataURL, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // 计算新的尺寸
        const dimensions = this.calculateDimensions(
          img.width,
          img.height,
          options.maxWidth || this.maxWidth,
          options.maxHeight || this.maxHeight
        )
        
        canvas.width = dimensions.width
        canvas.height = dimensions.height
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)
        
        // 导出
        const format = options.outputFormat || this.outputFormat
        const quality = options.quality || this.quality
        
        const compressedDataURL = canvas.toDataURL(format, quality)
        
        resolve({
          dataURL: compressedDataURL,
          width: dimensions.width,
          height: dimensions.height,
          size: this.getDataURLSize(compressedDataURL)
        })
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      
      img.src = dataURL
    })
  }
  
  /**
   * 压缩图片（从URL）
   */
  compressFromURL(url, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        const dimensions = this.calculateDimensions(
          img.width,
          img.height,
          options.maxWidth || this.maxWidth,
          options.maxHeight || this.maxHeight
        )
        
        canvas.width = dimensions.width
        canvas.height = dimensions.height
        
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height)
        
        const format = options.outputFormat || this.outputFormat
        const quality = options.quality || this.quality
        
        const compressedDataURL = canvas.toDataURL(format, quality)
        
        resolve({
          dataURL: compressedDataURL,
          width: dimensions.width,
          height: dimensions.height,
          size: this.getDataURLSize(compressedDataURL)
        })
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      
      img.src = url
    })
  }
  
  /**
   * 计算压缩后的尺寸（保持宽高比）
   */
  calculateDimensions(width, height, maxWidth, maxHeight) {
    let newWidth = width
    let newHeight = height
    
    if (newWidth > maxWidth) {
      newHeight = (newHeight * maxWidth) / newWidth
      newWidth = maxWidth
    }
    
    if (newHeight > maxHeight) {
      newWidth = (newWidth * maxHeight) / newHeight
      newHeight = maxHeight
    }
    
    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    }
  }
  
  /**
   * 获取Data URL的大小（字节）
   */
  getDataURLSize(dataURL) {
    const base64 = dataURL.split(',')[1]
    return Math.round(base64.length * 3 / 4)
  }
  
  /**
   * 将Data URL转换为Blob
   */
  dataURLToBlob(dataURL) {
    const arr = dataURL.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    return new Blob([u8arr], { type: mime })
  }
  
  /**
   * 将Data URL转换为File对象
   */
  dataURLToFile(dataURL, filename) {
    const blob = this.dataURLToBlob(dataURL)
    return new File([blob], filename, { type: blob.type })
  }
  
  /**
   * 批量压缩图片
   */
  compressBatch(files, options = {}) {
    const promises = Array.from(files).map(file => {
      return this.compressFromFile(file, options)
    })
    
    return Promise.all(promises)
  }
  
  /**
   * 生成响应式图片srcset
   */
  generateSrcset(dataURL, widths = [320, 640, 960, 1280]) {
    const promises = widths.map(width => {
      return this.compressFromDataURL(dataURL, { maxWidth: width })
        .then(result => ({
          width: result.width,
          dataURL: result.dataURL
        }))
    })
    
    return Promise.all(promises).then(results => {
      return results.map(r => `${r.dataURL} ${r.width}w`).join(', ')
    })
  }
  
  /**
   * 使用CDN加速（伪代码）
   */
  async uploadToCDN(file, cdnConfig) {
    // 这里需要实际的CDN上传逻辑
    // 示例：使用阿里云OSS
    console.log('Uploading to CDN...')
    
    // 伪代码
    const formData = new FormData()
    formData.append('file', file)
    formData.append('signature', cdnConfig.signature)
    
    const response = await fetch(cdnConfig.uploadURL, {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    
    return {
      url: result.url,
      cdnURL: result.cdnURL
    }
  }
}

// 创建默认图片压缩器
const imageOptimizer = new ImageOptimizer()

// Vue指令：v-image-optimize
export const imageOptimizeDirective = {
  inserted(el, binding) {
    const input = el.querySelector('input[type="file"]')
    
    if (input) {
      input.addEventListener('change', (e) => {
        const files = e.target.files
        
        if (files.length > 0) {
          imageOptimizer.compressFromFile(files[0], binding.value || {})
            .then(result => {
              // 触发自定义事件
              el.dispatchEvent(new CustomEvent('image-optimized', {
                detail: result
              }))
            })
            .catch(error => {
              console.error('Image optimization failed:', error)
            })
        }
      })
    }
  }
}

// Vue插件
export const ImageOptimizerPlugin = {
  install(Vue, options) {
    const optimizer = new ImageOptimizer(options)
    
    Vue.prototype.$imageOptimizer = optimizer
    
    Vue.directive('image-optimize', imageOptimizeDirective)
  }
}

export default imageOptimizer
