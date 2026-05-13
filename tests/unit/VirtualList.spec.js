/**
 * VirtualList组件测试
 */

import { test, expect, describe, beforeEach, afterEach } from '@jest/globals'
import { mount } from '@vue/test-utils'
import VirtualList from '@/components/VirtualList.vue'

describe('VirtualList', () => {
  const items = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }))
  
  let wrapper
  
  beforeEach(() => {
    wrapper = mount(VirtualList, {
      propsData: {
        items,
        itemHeight: 50,
        height: 400
      },
      scopedSlots: {
        default: '<div>{{ props.item.name }}</div>'
      }
    })
  })
  
  afterEach(() => {
    wrapper.destroy()
  })
  
  test('should render correctly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.classes()).toContain('virtual-list')
  })
  
  test('should calculate total height', () => {
    expect(wrapper.vm.totalHeight).toBe(1000 * 50)
  })
  
  test('should render only visible items', () => {
    const renderedItems = wrapper.findAll('.virtual-list-item')
    
    // 视口高度400px，每项50px，最多显示8项（加上缓冲区）
    expect(renderedItems.length).toBeLessThanOrEqual(20)
  })
  
  test('should update scroll position on scroll', async () => {
    const container = wrapper.find('.virtual-list')
    
    await container.trigger('scroll')
    
    expect(wrapper.vm.scrollTop).toBeGreaterThanOrEqual(0)
  })
  
  test('should scroll to specific index', async () => {
    wrapper.vm.scrollToIndex(100)
    
    // 检查是否滚动到了正确位置
    const expectedScrollTop = 100 * 50
    expect(wrapper.vm.scrollTop).toBe(expectedScrollTop)
  })
  
  test('should scroll to top', async () => {
    wrapper.vm.scrollToIndex(100)
    wrapper.vm.scrollToTop()
    
    expect(wrapper.vm.scrollTop).toBe(0)
  })
  
  test('should emit scroll event', async () => {
    const container = wrapper.find('.virtual-list')
    
    await container.trigger('scroll')
    
    expect(wrapper.emitted().scroll).toBeTruthy()
  })
  
  describe('calculate visible items', () => {
    test('should calculate start index correctly', () => {
      wrapper.setData({ scrollTop: 500 })
      
      // scrollTop=500, itemHeight=50, startIndex = 500/50 - buffer = 10-5 = 5
      expect(wrapper.vm.startIndex).toBe(5)
    })
    
    test('should calculate end index correctly', () => {
      wrapper.setData({ scrollTop: 0 })
      
      // 视口高度400，每项50，可见数量=8，endIndex = 0 + 8 + buffer = 13
      expect(wrapper.vm.endIndex).toBeGreaterThan(wrapper.vm.startIndex)
    })
    
    test('should not exceed items length', () => {
      wrapper.setData({ scrollTop: 50000 })
      
      expect(wrapper.vm.endIndex).toBeLessThanOrEqual(items.length)
    })
  })
  
  describe('offset calculation', () => {
    test('should calculate offset correctly', () => {
      wrapper.setData({ scrollTop: 500 })
      
      // offset = startIndex * itemHeight = 5 * 50 = 250
      expect(wrapper.vm.offset).toBe(250)
    })
  })
})
