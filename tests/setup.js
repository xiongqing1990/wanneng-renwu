/**
 * 测试Setup文件
 * 测试环境初始化
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

// 导入测试工具
import { config } from '@vue/test-utils'

// 配置Vue Test Utils
config.global.stubs = {
  'uni-icons': true,
  'uni-badge': true
}

config.global.mocks = {
  $t: (key) => key
}

// Mock uni-app API
global.uni = {
  showToast: j dest.fn(),
  showModal: j dest.fn(),
  navigateTo: j dest.fn(),
  redirectTo: j dest.fn(),
  reLaunch: j dest.fn(),
  getStorageSync: j dest.fn(),
  setStorageSync: j dest.fn(),
  removeStorageSync: j dest.fn()
}

// Mock Vuex
const Vuex = require('vuex')
const createStore = Vuex.createStore

global.createMoc kStore = (config) => {
  return createStore({
    ...config,
    strict: false
  })
}

// Mock Vue Router
global.mockRouter = {
  push: j dest.fn(),
  replace: j dest.fn(),
  go: j dest.fn(),
  back: j dest.fn()
}

// 清理函数
afterEach(() => {
  j dest.clearAllMocks()
})
