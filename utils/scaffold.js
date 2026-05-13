/**
 * 脚手架工具
 * 项目脚手架、组件脚手架
 */

class Scaffold {
  constructor(options = {}) {
    this.templatesDir = options.templatesDir || './templates'
    this.outputDir = options.outputDir || './output'
  }
  
  /**
   * 创建项目脚手架
   */
  createProject(projectName, options = {}) {
    const fs = require('fs')
    const path = require('path')
    
    const projectDir = path.join(this.outputDir, projectName)
    
    // 创建项目目录
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true })
    }
    
    // 创建目录结构
    const dirs = [
      'src/components',
      'src/pages',
      'src/utils',
      'src/assets',
      'tests/unit',
      'docs',
      'public'
    ]
    
    dirs.forEach(dir => {
      const fullPath = path.join(projectDir, dir)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
      }
    })
    
    // 生成基础文件
    this.generateProjectFiles(projectDir, projectName, options)
    
    console.log(`Project created: ${projectDir}`)
    
    return projectDir
  }
  
  /**
   * 生成项目文件
   */
  generateProjectFiles(projectDir, projectName, options) {
    const fs = require('fs')
    const path = require('path')
    
    // package.json
    const packageJSON = {
      name: projectName,
      version: '1.0.0',
      description: options.description || 'A Vue project',
      scripts: {
        dev: 'vue-cli-service serve',
        build: 'vue-cli-service build',
        test: 'vue-cli-service test:unit',
        lint: 'vue-cli-service lint'
      },
      dependencies: {
        vue: '^2.6.14',
        'vue-router': '^3.5.4',
        vuex: '^3.6.2'
      },
      devDependencies: {
        '@vue/cli-service': '~4.5.0',
        '@vue/test-utils': '^1.0.0',
        jest: '^26.0.0'
      }
    }
    
    fs.writeFileSync(
      path.join(projectDir, 'package.json'),
      JSON.stringify(packageJSON, null, 2)
    )
    
    // README.md
    const readme = `# ${projectName}\n\n${options.description || 'A Vue project'}\n`
    fs.writeFileSync(path.join(projectDir, 'README.md'), readme)
    
    // .gitignore
    const gitignore = 'node_modules\n/dist\n.env\n.DS_Store\n*.log\n'
    fs.writeFileSync(path.join(projectDir, '.gitignore'), gitignore)
  }
  
  /**
   * 创建组件脚手架
   */
  createComponent(componentName, options = {}) {
    const fs = require('fs')
    const path = require('path')
    
    const componentDir = path.join(this.outputDir, 'src/components', componentName)
    
    // 创建组件目录
    if (!fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true })
    }
    
    // 生成组件文件
    this.generateComponentFiles(componentDir, componentName, options)
    
    console.log(`Component created: ${componentDir}`)
    
    return componentDir
  }
  
  /**
   * 生成组件文件
   */
  generateComponentFiles(componentDir, componentName, options) {
    const fs = require('fs')
    const path = require('path')
    
    // Vue单文件组件
    const vueContent = `<template>
  <div class="${componentName.toLowerCase()}">
    {{ msg }}
  </div>
</template>

<script>
export default {
  name: '${componentName}',
  
  props: {
    msg: {
      type: String,
      default: 'Hello World'
    }
  },
  
  data() {
    return {}
  },
  
  methods: {},
  
  mounted() {}
}
</script>

<style scoped>
.${componentName.toLowerCase()} {
  color: #333;
}
</style>
`
    
    fs.writeFileSync(path.join(componentDir, `${componentName}.vue`), vueContent)
    
    // 测试文件
    const testContent = `import { test, expect, describe } from '@jest/globals'
import { mount } from '@vue/test-utils'
import ${componentName} from './${componentName}.vue'

describe('${componentName}', () => {
  test('renders correctly', () => {
    const wrapper = mount(${componentName})
    expect(wrapper.exists()).toBe(true)
  })
})
`
    
    fs.writeFileSync(path.join(componentDir, `${componentName}.spec.js`), testContent)
    
    // 文档文件
    const docsContent = `# ${componentName}\n\n## 描述\n\n${options.description || 'A Vue component'}\n\n## Props\n\n| 名称 | 类型 | 默认值 | 说明 |\n|------|------|--------|------|\n| msg | String | 'Hello World' | 显示文本 |\n\n## 示例\n\n\`\`\`vue\n<template>\n  <${componentName} msg="Hello" />\n</template>\n\`\`\`\n`
    
    fs.writeFileSync(path.join(componentDir, `README.md`), docsContent)
  }
  
  /**
   * 创建页面脚手架
   */
  createPage(pageName, options = {}) {
    const fs = require('fs')
    const path = require('path')
    
    const pageDir = path.join(this.outputDir, 'src/pages', pageName)
    
    // 创建页面目录
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true })
    }
    
    // 生成页面文件
    this.generatePageFiles(pageDir, pageName, options)
    
    console.log(`Page created: ${pageDir}`)
    
    return pageDir
  }
  
  /**
   * 生成页面文件
   */
  generatePageFiles(pageDir, pageName, options) {
    const fs = require('fs')
    const path = require('path')
    
    // Vue单文件页面
    const vueContent = `<template>
  <view class="${pageName.toLowerCase()}-page">
    <${pageName}Page />
  </view>
</template>

<script>
export default {
  name: '${pageName}Page',
  
  data() {
    return {}
  },
  
  methods: {},
  
  mounted() {}
}
</script>

<style scoped>
.${pageName.toLowerCase()}-page {
  padding: 20px;
}
</style>
`
    
    fs.writeFileSync(path.join(pageDir, `${pageName}.vue`), vueContent)
  }
  
  /**
   * 从模板创建
   */
  createFromTemplate(templateName, outputName, variables = {}) {
    const fs = require('fs')
    const path = require('path')
    
    const templatePath = path.join(this.templatesDir, `${templateName}.template`)
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`)
    }
    
    let templateContent = fs.readFileSync(templatePath, 'utf8')
    
    // 替换变量
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
      templateContent = templateContent.replace(regex, variables[key])
    })
    
    const outputPath = path.join(this.outputDir, `${outputName}`)
    
    fs.writeFileSync(outputPath, templateContent, 'utf8')
    
    console.log(`Created from template: ${outputPath}`)
    
    return outputPath
  }
}

// 创建默认脚手架工具
const scaffold = new Scaffold({
  templatesDir: './templates',
  outputDir: './output'
})

// Vue插件
export const ScaffoldPlugin = {
  install(Vue, options) {
    const scaffoldInstance = new Scaffold(options)
    
    Vue.prototype.$scaffold = scaffoldInstance
  }
}

export default scaffold
