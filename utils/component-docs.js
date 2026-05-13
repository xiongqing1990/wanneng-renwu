/**
 * 组件文档生成器
 * 自动生成组件文档（Storybook风格）
 */

class ComponentDocsGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './docs/components'
    this.format = options.format || 'markdown' // markdown, html, json
    this.includeExamples = options.includeExamples !== false
    this.includeAPI = options.includeAPI !== false
  }
  
  /**
   * 解析Vue单文件组件
   */
  parseVueSFC(sfcContent) {
    const result = {
      name: '',
      description: '',
      props: [],
      data: [],
      methods: [],
      computed: [],
      events: [],
      slots: [],
      examples: []
    }
    
    // 提取name
    const nameMatch = sfcContent.match(/name:\s*['"](.+?)['"]/)
    if (nameMatch) {
      result.name = nameMatch[1]
    }
    
    // 提取注释中的描述
    const commentMatch = sfcContent.match(/\/\*\*\s*([\s\S]*?)\s*\*\//)
    if (commentMatch) {
      result.description = commentMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line.length > 0)
        .join(' ')
    }
    
    // 提取props
    const propsMatch = sfcContent.match(/props:\s*\{([\s\S]*?)\}/)
    if (propsMatch) {
      const propsContent = propsMatch[1]
      const propMatches = propsContent.matchAll(/(\w+):\s*\{([\s\S]*?)\}/g)
      
      for (const match of propMatches) {
        result.props.push({
          name: match[1],
          details: match[2]
        })
      }
    }
    
    // 提取methods
    const methodsMatch = sfcContent.match(/methods:\s*\{([\s\S]*?)\}/)
    if (methodsMatch) {
      const methodsContent = methodsMatch[1]
      const methodMatches = methodsContent.match(/(\w+)\s*\([^)]*\)\s*\{/g)
      
      if (methodMatches) {
        result.methods = methodMatches.map(m => 
          m.replace(/\s*\([^)]*\)\s*\{/, '').trim()
        )
      }
    }
    
    return result
  }
  
  /**
   * 生成Markdown文档
   */
  generateMarkdown(componentInfo) {
    let md = `# ${componentInfo.name || 'Unnamed Component'}\n\n`
    
    if (componentInfo.description) {
      md += `## 描述\n\n${componentInfo.description}\n\n`
    }
    
    if (this.includeAPI && componentInfo.props.length > 0) {
      md += '## Props\n\n| 名称 | 类型 | 默认值 | 说明 |\n'
      md += '|------|------|--------|------|\n'
      
      componentInfo.props.forEach(prop => {
        md += `| ${prop.name} | - | - | - |\n`
      })
      
      md += '\n'
    }
    
    if (componentInfo.methods.length > 0) {
      md += '## 方法\n\n'
      componentInfo.methods.forEach(method => {
        md += `- \`${method}()\`\n`
      })
      md += '\n'
    }
    
    if (this.includeExamples) {
      md += '## 示例\n\n```vue\n<template>\n'
      md += `  <${componentInfo.name} />\n`
      md += '</template>\n```\n\n'
    }
    
    return md
  }
  
  /**
   * 生成HTML文档
   */
  generateHTML(componentInfo) {
    let html = '<!DOCTYPE html>\n<html>\n<head>\n'
    html += `<title>${componentInfo.name || 'Component'} - 文档</title>\n`
    html += '<style>body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }'
    html += 'table { border-collapse: collapse; width: 100%; }'
    html += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }'
    html += 'th { background-color: #f2f2f2; }'
    html += 'code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }'
    html += '</style>\n</head>\n<body>\n'
    
    html += `<h1>${componentInfo.name || 'Unnamed Component'}</h1>\n`
    
    if (componentInfo.description) {
      html += `<p>${componentInfo.description}</p>\n`
    }
    
    if (this.includeAPI && componentInfo.props.length > 0) {
      html += '<h2>Props</h2>\n<table>\n'
      html += '<tr><th>名称</th><th>类型</th><th>默认值</th><th>说明</th></tr>\n'
      
      componentInfo.props.forEach(prop => {
        html += `<tr><td>${prop.name}</td><td>-</td><td>-</td><td>-</td></tr>\n`
      })
      
      html += '</table>\n'
    }
    
    if (this.includeExamples) {
      html += '<h2>示例</h2>\n<pre><code>&lt;template&gt;\n'
      html += `  &lt;${componentInfo.name} /&gt;\n`
      html += '&lt;/template&gt;\n</code></pre>\n'
    }
    
    html += '</body>\n</html>'
    
    return html
  }
  
  /**
   * 生成JSON文档
   */
  generateJSON(componentInfo) {
    return JSON.stringify(componentInfo, null, 2)
  }
  
  /**
   * 保存文档到文件
   */
  async saveDocs(componentInfo, outputPath = null) {
    const fs = require('fs')
    const path = require('path')
    
    if (!outputPath) {
      outputPath = path.join(this.outputDir, `${componentInfo.name}.${this.format}`)
    }
    
    // 确保目录存在
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    let content = ''
    
    switch (this.format) {
      case 'markdown':
        content = this.generateMarkdown(componentInfo)
        break
      case 'html':
        content = this.generateHTML(componentInfo)
        break
      case 'json':
        content = this.generateJSON(componentInfo)
        break
    }
    
    fs.writeFileSync(outputPath, content, 'utf8')
    console.log(`Docs saved to: ${outputPath}`)
    
    return outputPath
  }
  
  /**
   * 批量生成组件文档
   */
  async generateBatch(components) {
    const results = []
    
    for (const component of components) {
      try {
        const docs = this.generateDocs(component)
        const outputPath = await this.saveDocs(docs)
        results.push({ success: true, path: outputPath })
      } catch (error) {
        results.push({ success: false, error: error.message })
      }
    }
    
    return results
  }
  
  /**
   * 生成所有文档
   */
  generateDocs(componentInfo) {
    switch (this.format) {
      case 'markdown':
        return this.generateMarkdown(componentInfo)
      case 'html':
        return this.generateHTML(componentInfo)
      case 'json':
        return this.generateJSON(componentInfo)
      default:
        return this.generateMarkdown(componentInfo)
    }
  }
}

// 创建默认文档生成器
const componentDocsGenerator = new ComponentDocsGenerator({
  outputDir: './docs/components',
  format: 'markdown',
  includeExamples: true,
  includeAPI: true
})

// Vue插件
export const ComponentDocsPlugin = {
  install(Vue, options) {
    const generator = new ComponentDocsGenerator(options)
    
    Vue.prototype.$generateComponentDocs = (componentInfo) => {
      return generator.generateDocs(componentInfo)
    }
  }
}

export default componentDocsGenerator
