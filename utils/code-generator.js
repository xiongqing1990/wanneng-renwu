/**
 * 代码生成器
 * 根据模板生成代码
 */

class CodeGenerator {
  constructor(options = {}) {
    this.templates = new Map()
    this.outputDir = options.outputDir || './generated'
  }
  
  /**
   * 注册模板
   */
  registerTemplate(name, template) {
    this.templates.set(name, template)
  }
  
  /**
   * 从文件加载模板
   */
  loadTemplateFromFile(name, filePath) {
    const fs = require('fs')
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Template file not found: ${filePath}`)
    }
    
    const template = fs.readFileSync(filePath, 'utf8')
    this.registerTemplate(name, template)
  }
  
  /**
   * 生成代码
   */
  generate(templateName, variables = {}, outputPath = null) {
    const template = this.templates.get(templateName)
    
    if (!template) {
      throw new Error(`Template not found: ${templateName}`)
    }
    
    let code = template
    
    // 替换变量
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
      code = code.replace(regex, variables[key])
    })
    
    // 保存文件
    if (outputPath) {
      this.saveToFile(code, outputPath)
    }
    
    return code
  }
  
  /**
   * 批量生成代码
   */
  generateBatch(tasks) {
    const results = []
    
    tasks.forEach(task => {
      try {
        const code = this.generate(task.template, task.variables, task.output)
        results.push({ success: true, output: task.output, code })
      } catch (error) {
        results.push({ success: false, error: error.message })
      }
    })
    
    return results
  }
  
  /**
   * 保存代码到文件
   */
  saveToFile(code, filePath) {
    const fs = require('fs')
    const path = require('path')
    
    // 确保目录存在
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(filePath, code, 'utf8')
    console.log(`Code saved to: ${filePath}`)
  }
  
  /**
   * 生成Vue组件代码
   */
  generateVueComponent(options = {}) {
    const template = `<template>
  <div class="${options.name.toLowerCase()}">
    ${options.template || '<!-- TODO: add template -->'}
  </div>
</template>

<script>
export default {
  name: '${options.name}',
  
  props: ${JSON.stringify(options.props || {}, null, 2)},
  
  data() {
    return ${JSON.stringify(options.data || {}, null, 2)}
  },
  
  methods: ${JSON.stringify(options.methods || {}, null, 2)},
  
  computed: ${JSON.stringify(options.computed || {}, null, 2)},
  
  mounted() {
    ${options.mounted || ''}
  }
}
</script>

<style scoped>
.${options.name.toLowerCase()} {
  ${options.style || ''}
}
</style>
`
    
    return template
  }
  
  /**
   * 生成Vue页面代码
   */
  generateVuePage(options = {}) {
    const template = `<template>
  <view class="${options.name.toLowerCase()}-page">
    ${options.template || '<!-- TODO: add template -->'}
  </view>
</template>

<script>
export default {
  name: '${options.name}',
  
  data() {
    return ${JSON.stringify(options.data || {}, null, 2)}
  },
  
  methods: ${JSON.stringify(options.methods || {}, null, 2)},
  
  mounted() {
    ${options.mounted || ''}
  }
}
</script>

<style scoped>
.${options.name.toLowerCase()}-page {
  ${options.style || ''}
}
</style>
`
    
    return template
  }
  
  /**
   * 生成Express路由代码
   */
  generateExpressRoute(options = {}) {
    const template = `const express = require('express')
const router = express.Router()
${options.imports || ''}

/**
 * ${options.description || 'API Endpoint'}
 */

// GET ${options.path || '/'}

router.get('${options.path || '/'}', async (req, res) => {
  try {
    ${options.get || 'res.json({ message: "Success" }')}
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST ${options.path || '/'}

router.post('${options.path || '/'}', async (req, res) => {
  try {
    ${options.post || 'res.json({ message: "Created" }')}
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
`
    
    return template
  }
  
  /**
   * 生成单元测试代码
   */
  generateUnitTest(options = {}) {
    const template = `import { test, expect, describe } from '@jest/globals'
import { mount } from '@vue/test-utils'
import ${options.componentName} from '${options.componentPath || "./" + options.componentName + ".vue"}'

describe('${options.componentName}', () => {
  test('renders correctly', () => {
    const wrapper = mount(${options.componentName})
    expect(wrapper.exists()).toBe(true)
  })
  ${options.tests || ''}
})
`
    
    return template
  }
}

// 预定义模板
const templates = {
  'vue-component': `
<template>
  <div class="\${name.toLowerCase()}">
    \${template}
  </div>
</template>

<script>
export default {
  name: '\${name}',
  
  props: \${JSON.stringify(props || {}, null, 2)},
  
  data() {
    return \${JSON.stringify(data || {}, null, 2)}
  },
  
  methods: {},
  
  mounted() {}
}
</script>

<style scoped>
.\${name.toLowerCase()} {
  /* styles */
}
</style>
`,
  
  'express-route': `
const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  try {
    res.json({ message: "Success" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
`,
  
  'jest-test': `
import { test, expect, describe } from '@jest/globals'

describe('\${description}', () => {
  test('\${testName || "should work correctly"}', () => {
    \${testBody || 'expect(true).toBe(true)'}
  })
})
`
}

// 创建默认代码生成器
const codeGenerator = new CodeGenerator({
  outputDir: './generated'
})

// 注册预定义模板
Object.keys(templates).forEach(name => {
  codeGenerator.registerTemplate(name, templates[name])
})

// Vue插件
export const CodeGeneratorPlugin = {
  install(Vue, options) {
    const generator = new CodeGenerator(options)
    
    Vue.prototype.$generateCode = (templateName, variables) => {
      return generator.generate(templateName, variables)
    }
  }
}

export default codeGenerator
