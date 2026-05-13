<template>
  <view class="virtual-list" ref="container" @scroll="onScroll">
    <!-- 占位元素（撑起滚动条） -->
    <view class="virtual-list__phantom" :style="{ height: totalHeight + 'px' }"></view>
    
    <!-- 可见区域 -->
    <view class="virtual-list__content" :style="{ transform: `translateY(${offset}px)` }">
      <view
        v-for="item in visibleItems"
        :key="item[itemKey] || item.id"
        class="virtual-list__item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item" :index="item.__index"></slot>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="items.length === 0" class="virtual-list__empty">
      <slot name="empty">
        <text class="empty-text">暂无数据</text>
      </slot>
    </view>
  </view>
</template>

<script>
/**
 * 虚拟列表组件
 * 用于长列表性能优化，只渲染可见区域的元素
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

export default {
  name: 'VirtualList',
  
  props: {
    // 列表数据
    items: {
      type: Array,
      required: true
    },
    // 每项高度（固定高度优化）
    itemHeight: {
      type: Number,
      default: 80
    },
    // 额外缓冲区（上下各多渲染几条）
    buffer: {
      type: Number,
      default: 5
    },
    // 唯一键字段名
    itemKey: {
      type: String,
      default: 'id'
    }
  },
  
  data() {
    return {
      scrollTop: 0,
      containerHeight: 0
    }
  },
  
  computed: {
    /**
     * 总高度
     */
    totalHeight() {
      return this.items.length * this.itemHeight
    },
    
    /**
     * 可见区域起始索引
     */
    startIndex() {
      const start = Math.floor(this.scrollTop / this.itemHeight) - this.buffer
      return Math.max(0, start)
    },
    
    /**
     * 可见区域结束索引
     */
    endIndex() {
      const visibleCount = Math.ceil(this.containerHeight / this.itemHeight)
      const end = this.startIndex + visibleCount + this.buffer * 2
      return Math.min(this.items.length, end)
    },
    
    /**
     * 可见区域偏移量
     */
    offset() {
      return this.startIndex * this.itemHeight
    },
    
    /**
     * 可见项
     */
    visibleItems() {
      const visible = this.items.slice(this.startIndex, this.endIndex)
      // 添加索引标记
      visible.forEach((item, index) => {
        item.__index = this.startIndex + index
      })
      return visible
    }
  },
  
  mounted() {
    this.updateContainerHeight()
    
    // 监听容器大小变化
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateContainerHeight()
      })
      this.resizeObserver.observe(this.$refs.container)
    }
  },
  
  beforeDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  },
  
  methods: {
    /**
     * 滚动事件
     */
    onScroll(e) {
      this.scrollTop = e.detail.scrollTop
      this.$emit('scroll', e)
    },
    
    /**
     * 更新容器高度
     */
    updateContainerHeight() {
      const query = uni.createSelectorQuery().in(this)
      query.select('.virtual-list').boundingClientRect(rect => {
        if (rect) {
          this.containerHeight = rect.height
        }
      }).exec()
    },
    
    /**
     * 滚动到指定索引
     */
    scrollToIndex(index) {
      const scrollTop = index * this.itemHeight
      this.$refs.container.scrollTop = scrollTop
    },
    
    /**
     * 滚动到顶部
     */
    scrollToTop() {
      this.$refs.container.scrollTop = 0
    }
  }
}
</script>

<style lang="scss" scoped>
.virtual-list {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  -webkit-overflow-scrolling: touch; // iOS流畅滚动
  
  &__phantom {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    z-index: -1;
  }
  
  &__content {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
  }
  
  &__item {
    box-sizing: border-box;
  }
  
  &__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300rpx;
    
    .empty-text {
      font-size: 28rpx;
      color: #999;
    }
  }
}
</style>
