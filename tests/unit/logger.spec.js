/**
 * utils/logger.js 单元测试
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

import { shallowMount } from '@vue/test-utils'
import { jest } from '@jest/globals'
import logger, { LogLevel } from '@/utils/logger.js'

describe('Logger', () => {
  beforeEach(() => {
    // 清理Mock
    jest.clearAllMocks()
    // 重新初始化
    logger.init({
      level: LogLevel.DEBUG,
      enabled: true,
      persist: false  // 测试时不持久化
    })
    logger.clearLogs()
  })

  describe('基础日志功能', () => {
    test('debug日志', () => {
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
      
      logger.debug('TestModule', 'Debug message', { data: 'test' })
      
      expect(consoleDebugSpy).toHaveBeenCalled()
      consoleDebugSpy.mockRestore()
    })

    test('info日志', () => {
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
      
      logger.info('TestModule', 'Info message')
      
      expect(consoleInfoSpy).toHaveBeenCalled()
      consoleInfoSpy.mockRestore()
    })

    test('warn日志', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      logger.warn('TestModule', 'Warn message')
      
      expect(consoleWarnSpy).toHaveBeenCalled()
      consoleWarnSpy.mockRestore()
    })

    test('error日志', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      logger.error('TestModule', 'Error message')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('日志级别', () => {
    test('设置日志级别 - 只显示INFO及以上', () => {
      logger.setLevel(LogLevel.INFO)
      
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
      
      logger.debug('TestModule', 'Debug should not show')
      logger.info('TestModule', 'Info should show')
      
      expect(consoleDebugSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalled()
      
      consoleDebugSpy.mockRestore()
      consoleInfoSpy.mockRestore()
    })

    test('设置日志级别 - ERROR', () => {
      logger.setLevel(LogLevel.ERROR)
      
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      logger.info('TestModule', 'Info should not show')
      logger.error('TestModule', 'Error should show')
      
      expect(consoleInfoSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleInfoSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('日志存储', () => {
    test('日志记录到内存', () => {
      logger.info('TestModule', 'Test message')
      
      const logs = logger.getLogs()
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].module).toBe('TestModule')
      expect(logs[0].message).toBe('Test message')
    })

    test('日志过滤 - 按级别', () => {
      logger.debug('TestModule', 'Debug')
      logger.info('TestModule', 'Info')
      logger.error('TestModule', 'Error')
      
      const errorLogs = logger.getLogs({ level: 'error' })
      expect(errorLogs.length).toBe(1)
      expect(errorLogs[0].level).toBe('error')
    })

    test('日志过滤 - 按模块', () => {
      logger.info('ModuleA', 'Message A')
      logger.info('ModuleB', 'Message B')
      
      const moduleALogs = logger.getLogs({ module: 'ModuleA' })
      expect(moduleALogs.length).toBe(1)
      expect(moduleALogs[0].module).toBe('ModuleA')
    })

    test('清空日志', () => {
      logger.info('TestModule', 'Test')
      expect(logger.getLogs().length).toBeGreaterThan(0)
      
      logger.clearLogs()
      expect(logger.getLogs().length).toBe(0)
    })
  })

  describe('日志导出', () => {
    test('导出JSON格式', () => {
      logger.info('TestModule', 'Test message', { key: 'value' })
      
      const json = logger.exportLogs('json')
      const parsed = JSON.parse(json)
      
      expect(parsed).toBeInstanceOf(Array)
      expect(parsed[0].module).toBe('TestModule')
      expect(parsed[0].data).toEqual({ key: 'value' })
    })

    test('导出Text格式', () => {
      logger.info('TestModule', 'Test message')
      
      const text = logger.exportLogs('text')
      expect(text).toContain('[TestModule]')
      expect(text).toContain('Test message')
    })
  })

  describe('模块Logger', () => {
    test('创建模块专用logger', () => {
      const moduleLogger = logger.createModuleLogger('MyModule')
      
      expect(typeof moduleLogger.debug).toBe('function')
      expect(typeof moduleLogger.info).toBe('function')
      expect(typeof moduleLogger.warn).toBe('function')
      expect(typeof moduleLogger.error).toBe('function')
    })

    test('模块Logger记录日志', () => {
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
      
      const moduleLogger = logger.createModuleLogger('MyModule')
      moduleLogger.info('Test message')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Test message',
        expect.anything()
      )
      
      consoleInfoSpy.mockRestore()
    })
  })

  describe('性能', () => {
    test('大量日志不阻塞', () => {
      const start = Date.now()
      
      for (let i = 0; i < 1000; i++) {
        logger.info('TestModule', `Message ${i}`)
      }
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000)  // 应在1秒内完成
    })

    test('日志数量限制', () => {
      logger.init({
        level: LogLevel.DEBUG,
        enabled: true,
        persist: false,
        maxLogs: 100
      })
      
      for (let i = 0; i < 200; i++) {
        logger.info('TestModule', `Message ${i}`)
      }
      
      const logs = logger.getLogs()
      expect(logs.length).toBeLessThanOrEqual(100)
    })
  })
})
