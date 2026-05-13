/**
 * Jest 测试配置文件
 * 单元测试、组件测试配置
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试匹配模式
  testMatch: [
    '**/tests/**/*.spec.js',
    '**/tests/**/*.test.js',
    '**/*.spec.js',
    '**/*.test.js'
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: ['js', 'json', 'vue'],
  
  // 转换配置（Vue单文件组件）
  transform: {
    '^.+\\.vue$': '@vue/vue-jest',
    '^.+\\.js$': 'babel-jest'
  },
  
  // 模块别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 覆盖率配置
  collectCoverageFrom: [
    'utils/**/*.js',
    'components/**/*.vue',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup文件
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 快照序列化器
  snapshotSerializers: ['jest-serializer-vue'],
  
  // 报告器
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'tests/results' }]
  ]
}
