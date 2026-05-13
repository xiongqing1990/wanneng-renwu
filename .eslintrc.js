/**
 * ESLint 配置文件
 * 企业级代码规范
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

module.exports = {
  root: true,
  
  // 解析器
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  
  // 环境
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  
  // 扩展规则集
  extends: [
    'eslint:recommended',
    'plugin:vue/recommended'
  ],
  
  // 插件
  plugins: [
    'vue',
    'import'
  ],
  
  // 规则
  rules: {
    // ==================== 最佳实践 ====================
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-alert': 'warn',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-script-url': 'error',
    'no-unused-expressions': 'warn',
    'no-useless-concat': 'warn',
    'no-useless-escape': 'warn',
    
    // ==================== 变量声明 ====================
    'no-undef': 'error',
    'no-unused-vars': ['warn', { vars: 'all', args: 'none' }],
    'no-redeclare': 'error',
    
    // ==================== 代码风格 ====================
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'warn',
    'eol-last': 'error',
    'object-curly-spacing': ['error', 'never'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', 'never'],
    'keyword-spacing': 'error',
    
    // ==================== Vue规范 ====================
    'vue/no-unused-components': 'warn',
    'vue/no-parsing-error': 'error',
    'vue/require-prop-types': 'warn',
    'vue/require-default-prop': 'warn',
    'vue/name-property-casing': ['error', 'PascalCase'],
    'vue/order-in-components': 'warn',
    'vue/html-self-closing': ['error', {
      html: {
        void: 'never',
        normal: 'never',
        component: 'always'
      }
    }],
    
    // ==================== 导入排序 ====================
    'import/order': ['warn', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }],
    
    // ==================== 复杂度限制 ====================
    'complexity': ['warn', { max: 15 }],
    'max-depth': ['warn', { max: 4 }],
    'max-nested-callbacks': ['warn', { max: 3 }],
    'max-params': ['warn', { max: 5 }],
    
    // ==================== 注释规范 ====================
    'require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true
      }
    }],
    
    // ==================== 安全规则 ====================
    'security/detect-object-injection': 'warn',
    'security/detect-eval-with-expression': 'error'
  },
  
  // 全局变量
  globals: {
    uni: 'readonly',
    Vue: 'readonly',
    wx: 'readonly'
  },
  
  // 忽略文件
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'unpackage/',
    '*.min.js',
    '*.bundle.js'
  ],
  
  // 覆盖配置
  overrides: [
    {
      files: ['*.test.js', '*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-unused-expressions': 'off'
      }
    }
  ]
}
