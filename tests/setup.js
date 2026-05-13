/**
 * 测试环境设置
 */

// 设置jsDOM环境
global.navigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = String(value)
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  }
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    status: 200,
    statusText: 'OK'
  })
)

// Mock XMLHttpRequest
global.XMLHttpRequest = jest.fn()

// Mock performance
global.performance = {
  now: jest.fn(() => Date.now()),
  timing: {
    domainLookupEnd: 100,
    domainLookupStart: 0,
    connectEnd: 200,
    connectStart: 100,
    responseStart: 300,
    requestStart: 250,
    loadEventEnd: 500,
    navigationStart: 0,
    domInteractive: 350,
    domLoading: 150,
    domContentLoadedEventEnd: 400
  },
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 40000000
  }
}

// Mock crypto
global.crypto = {
  getRandomValues: jest.fn(arr => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256)
    }
    return arr
  })
}

// Mock requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 16)

// Mock cancelAnimationFrame
global.cancelAnimationFrame = id => clearTimeout(id)

// 设置测试超时
jest.setTimeout(10000)

// 控制台输出控制
global.console = {
  ...console,
  // 测试时隐藏特定警告
  warn: jest.fn(),
  error: jest.fn()
}
