/**
 * 组件测试示例
 * components/VirtualList.vue 单元测试
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

import { shallowMount } from '@vue/test-utils'
import { jest } from '@jest/globals'
import VirtualList from '@/components/VirtualList.vue'

describe('VirtualList', () => {
  const mockItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    title: `Item ${i}`
  }))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基础渲染', () => {
    test('渲染虚拟列表', () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems.slice(0, 10),
          itemHeight: 80
        }
      })

      expect(wrapper.find('.virtual-list').exists()).toBe(true)
      expect(wrapper.findAll('.virtual-list__item').length).toBeGreaterThan(0)
    })

    test('空数据渲染空状态', () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: [],
          itemHeight: 80
        }
      })

      expect(wrapper.find('.virtual-list__empty').exists()).toBe(true)
    })

    test('使用自定义空状态slot', () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: [],
          itemHeight: 80
        },
        slots: {
          empty: '<div class="custom-empty">暂无数据</div>'
        }
      })

      expect(wrapper.find('.custom-empty').text()).toBe('暂无数据')
    })
  })

  describe('虚拟滚动', () => {
    test('计算可见区域', async () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems,
          itemHeight: 80
        }
      })

      // 模拟容器高度
      wrapper.vm.containerHeight = 400

      // 模拟滚动
      await wrapper.find('.virtual-list').trigger('scroll')

      expect(wrapper.vm.startIndex).toBeGreaterThanOrEqual(0)
      expect(wrapper.vm.endIndex).toBeLessThanOrEqual(mockItems.length)
    })

    test('偏移量计算正确', () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems,
          itemHeight: 80
        }
      })

      wrapper.vm.scrollTop = 800
      expect(wrapper.vm.offset).toBe(800)
    })

    test('可见项数量正确', () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems,
          itemHeight: 80
        }
      })

      wrapper.vm.containerHeight = 400
      const visibleCount = wrapper.vm.endIndex - wrapper.vm.startIndex

      expect(visibleCount).toBeLessThanOrEqual(Math.ceil(400 / 80) + 10) // 容器高度/项高度 + 缓冲区
    })
  })

  describe('方法', () => {
    test('scrollToIndex方法', async () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems,
          itemHeight: 80
        }
      })

      const scrollToSpy = jest.spyOn(wrapper.vm.$refs.container, 'scrollTop', 'set')
      wrapper.vm.scrollToIndex(10)

      expect(scrollToSpy).toHaveBeenCalledWith(800) // 10 * 80
    })

    test('scrollToTop方法', async () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems,
          itemHeight: 80
        }
      })

      wrapper.vm.$refs.container.scrollTop = 1000
      wrapper.vm.scrollToTop()

      expect(wrapper.vm.$refs.container.scrollTop).toBe(0)
    })
  })

  describe('性能', () => {
    test('渲染1000条数据只渲染可见区域', () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems,
          itemHeight: 80
        }
      })

      // 应该只渲染可见区域（约5-10条），而不是1000条
      const renderedItems = wrapper.findAll('.virtual-list__item')
      expect(renderedItems.length).toBeLessThan(50) // 远大于可见区域，但远小于1000
    })

    test('滚动时只更新可见区域', async () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems,
          itemHeight: 80
        }
      })

      const initialRenderCount = wrapper.findAll('.virtual-list__item').length

      // 模拟滚动
      wrapper.vm.scrollTop = 1600
      await wrapper.vm.$nextTick()

      const afterScrollCount = wrapper.findAll('.virtual-list__item').length
      expect(afterScrollCount).toBeGreaterThan(0)
      expect(afterScrollCount).toBeLessThanOrEqual(initialRenderCount + 10)
    })
  })

  describe('Props验证', () => {
    test('itemHeight默认值', () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems.slice(0, 10)
        }
      })

      expect(wrapper.vm.itemHeight).toBe(80)
    })

    test('buffer默认值', () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems.slice(0, 10)
        }
      })

      expect(wrapper.vm.buffer).toBe(5)
    })

    test('itemKey默认值', () => {
      const wrapper = shallowMount(VirtualList, {
        propsData: {
          items: mockItems.slice(0, 10)
        }
      })

      expect(wrapper.vm.itemKey).toBe('id')
    })
  })
})
