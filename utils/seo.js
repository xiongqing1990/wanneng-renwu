/**
 * SEO优化工具
 * 搜索引擎优化、Meta标签管理
 */

class SEO {
  constructor(options = {}) {
    this.defaultTitle = options.defaultTitle || '万能任务APP'
    this.defaultDescription = options.defaultDescription || '万能任务APP - 让任务变得更简单'
    this.defaultKeywords = options.defaultKeywords || '任务,接单,发布任务,万能任务'
    this.titleSeparator = options.titleSeparator || ' - '
  }
  
  /**
   * 设置页面标题
   */
  setTitle(title) {
    if (title) {
      document.title = `${title}${this.titleSeparator}${this.defaultTitle}`
    } else {
      document.title = this.defaultTitle
    }
  }
  
  /**
   * 设置Meta标签
   */
  setMeta(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`)
    
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = name
      document.head.appendChild(meta)
    }
    
    meta.content = content
  }
  
  /**
   * 设置Meta标签（属性）
   */
  setMetaProperty(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`)
    
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('property', property)
      document.head.appendChild(meta)
    }
    
    meta.content = content
  }
  
  /**
   * 设置页面描述
   */
  setDescription(description) {
    this.setMeta('description', description || this.defaultDescription)
  }
  
  /**
   * 设置页面关键词
   */
  setKeywords(keywords) {
    this.setMeta('keywords', keywords || this.defaultKeywords)
  }
  
  /**
   * 设置OG标签（Open Graph）
   */
  setOGTags(options = {}) {
    this.setMetaProperty('og:title', options.title || document.title)
    this.setMetaProperty('og:description', options.description || this.defaultDescription)
    this.setMetaProperty('og:image', options.image || '')
    this.setMetaProperty('og:url', options.url || window.location.href)
    this.setMetaProperty('og:type', options.type || 'website')
  }
  
  /**
   * 设置Twitter Card标签
   */
  setTwitterTags(options = {}) {
    this.setMeta('twitter:card', options.card || 'summary_large_image')
    this.setMeta('twitter:title', options.title || document.title)
    this.setMeta('twitter:description', options.description || this.defaultDescription)
    this.setMeta('twitter:image', options.image || '')
  }
  
  /**
   * 设置Canonical链接
   */
  setCanonical(url) {
    let link = document.querySelector('link[rel="canonical"]')
    
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    
    link.href = url || window.location.href
  }
  
  /**
   * 设置Robots标签
   */
  setRobots(content) {
    this.setMeta('robots', content || 'index, follow')
  }
  
  /**
   * 添加结构化数据（JSON-LD）
   */
  addStructuredData(data) {
    let script = document.querySelector('script[type="application/ld+json"]')
    
    if (!script) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    
    script.textContent = JSON.stringify(data)
  }
  
  /**
   * 添加面包屑导航结构化数据
   */
  addBreadcrumbStructuredData(breadcrumbs) {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url
      }))
    }
    
    this.addStructuredData(data)
  }
  
  /**
   * 添加网站结构化数据
   */
  addWebsiteStructuredData(options = {}) {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: options.name || this.defaultTitle,
      description: options.description || this.defaultDescription,
      url: options.url || window.location.origin
    }
    
    if (options.searchURL) {
      data.potentialAction = {
        '@type': 'SearchAction',
        target: `${options.searchURL}{search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    }
    
    this.addStructuredData(data)
  }
  
  /**
   * 添加组织结构化数据
   */
  addOrganizationStructuredData(options = {}) {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: options.name || '万能任务',
      url: options.url || window.location.origin,
      logo: options.logo || '',
      contactPoint: options.contactPoint || {}
    }
    
    this.addStructuredData(data)
  }
  
  /**
   * 更新所有SEO标签
   */
  update(options = {}) {
    if (options.title !== undefined) {
      this.setTitle(options.title)
    }
    
    if (options.description !== undefined) {
      this.setDescription(options.description)
    }
    
    if (options.keywords !== undefined) {
      this.setKeywords(options.keywords)
    }
    
    if (options.og) {
      this.setOGTags(options.og)
    }
    
    if (options.twitter) {
      this.setTwitterTags(options.twitter)
    }
    
    if (options.canonical !== undefined) {
      this.setCanonical(options.canonical)
    }
    
    if (options.robots !== undefined) {
      this.setRobots(options.robots)
    }
    
    if (options.structuredData) {
      this.addStructuredData(options.structuredData)
    }
  }
  
  /**
   * 生成站点地图（伪代码）
   */
  generateSitemap(routes) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    routes.forEach(route => {
      xml += '  <url>\n'
      xml += `    <loc>${route.url}</loc>\n`
      xml += `    <lastmod>${route.lastmod || new Date().toISOString()}</lastmod>\n`
      xml += `    <changefreq>${route.changefreq || 'weekly'}</changefreq>\n`
      xml += `    <priority>${route.priority || '0.5'}</priority>\n`
      xml += '  </url>\n'
    })
    
    xml += '</urlset>'
    
    return xml
  }
}

// 创建默认SEO实例
const seo = new SEO()

// Vue插件
export const SEOPlugin = {
  install(Vue, options) {
    const seoInstance = new SEO(options)
    
    Vue.prototype.$seo = seoInstance
    
    Vue.mixin({
      mounted() {
        // 如果组件定义了SEO配置
        if (this.$options.seo) {
          seoInstance.update(this.$options.seo)
        }
      },
      
      beforeRouteUpdate(to, from, next) {
        // 路由更新时更新SEO
        if (this.$options.seo) {
          seoInstance.update(this.$options.seo)
        }
        next()
      }
    })
  }
}

export default seo
