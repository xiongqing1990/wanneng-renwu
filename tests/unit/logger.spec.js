/**
 * 日志系统测试
 */

import { test, expect, describe, beforeEach, afterEach } from '@jest/globals'
import logger from '@/utils/logger'

describe('Logger', () => {
  beforeEach(() => {
    // 清空日志
    logger.clearLogs()
    localStorage.clear()
  })
  
  afterEach(() => {
    localStorage.clear()
  })
  
  describe('Basic Logging', () => {
    test('debug should log debug level messages', () => {
      logger.debug('Debug message')
      const logs = logger.getLogs()
      expect(logs.length).toBe(1)
      expect(logs[0].level).toBe('debug')
      expect(logs[0].message).toBe('Debug message')
    })
    
    test('info should log info level messages', () => {
      logger.info('Info message')
      const logs = logger.getLogs()
      expect(logs[0].level).toBe('info')
    })
    
    test('warn should log warning level messages', () => {
      logger.warn('Warning message')
      const logs = logger.getLogs()
      expect(logs[0].level).toBe('warn')
    })
    
    test('error should log error level messages', () => {
      logger.error('Error message')
      const logs = logger.getLogs()
      expect(logs[0].level).toBe('error')
    })
    
    test('fatal should log fatal level messages', () => {
      logger.fatal('Fatal message')
      const logs = logger.getLogs()
      expect(logs[0].level).toBe('fatal')
    })
  })
  
  describe('Log Level Filtering', () => {
    test('should not log messages below current level', () => {
      logger.setLevel('warn')
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      
      const logs = logger.getLogs()
      expect(logs.length).toBe(1)
      expect(logs[0].level).toBe('warn')
    })
  })
  
  describe('Data Logging', () => {
    test('should log messages with data object', () => {
      const data = { userId: 123, action: 'login' }
      logger.info('User action', data)
      
      const logs = logger.getLogs()
      expect(logs[0].data).toEqual(data)
    })
  })
  
  describe('Log Retrieval', () => {
    test('getLogs should return all logs', () => {
      logger.info('Message 1')
      logger.info('Message 2')
      logger.info('Message 3')
      
      const logs = logger.getLogs()
      expect(logs.length).toBe(3)
    })
    
    test('getLogs should filter by level', () => {
      logger.debug('Debug')
      logger.info('Info')
      logger.error('Error')
      
      const errors = logger.getLogs({ level: 'error' })
      expect(errors.length).toBe(1)
      expect(errors[0].message).toBe('Error')
    })
  })
  
  describe('Log Export', () => {
    test('exportLogs should export as JSON', () => {
      logger.info('Test message')
      const exported = logger.exportLogs('json')
      
      expect(() => JSON.parse(exported)).not.toThrow()
      const parsed = JSON.parse(exported)
      expect(parsed[0].message).toBe('Test message')
    })
    
    test('exportLogs should export as CSV', () => {
      logger.info('Test message', { key: 'value' })
      const exported = logger.exportLogs('csv')
      
      expect(exported).toContain('timestamp')
      expect(exported).toContain('level')
      expect(exported).toContain('message')
    })
  })
  
  describe('Log Clearing', () => {
    test('clearLogs should remove all logs', () => {
      logger.info('Message 1')
      logger.info('Message 2')
      
      logger.clearLogs()
      
      const logs = logger.getLogs()
      expect(logs.length).toBe(0)
    })
  })
  
  describe('Persistence', () => {
    test('logs should be saved to localStorage', () => {
      logger.info('Persistent message')
      
      const stored = localStorage.getItem('app_logs')
      expect(stored).not.toBeNull()
      
      const parsed = JSON.parse(stored)
      expect(parsed.length).toBe(1)
      expect(parsed[0].message).toBe('Persistent message')
    })
  })
})
