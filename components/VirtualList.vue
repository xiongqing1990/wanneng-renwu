<template>
  <div 
    class="virtual-list"
    ref="container"
    @scroll="handleScroll"
  >
    <div class="virtual-list-phantom" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-list-content" :style="{ transform: `translateY(${offset}px)` }">
      <div
        v-for="item in visibleItems"
        :key="item[keyField]"
        class="virtual-list-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item" :index="item.$index"></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VirtualList',
  
  props: {
    // 数据列表
    items: {
      type: Array,
      required: true
    },
    // 每项高度（固定）
    itemHeight: {
      type: Number,
      default: 50
    },
    // 容器高度
    height: {
      type: Number,
      default: 400
    },
    // 唯一键字段
    keyField: {
      type: String,
      default: 'id'
    },
    // 缓冲项数（上下各缓冲多少项）
    buffer: {
      type: Number,
      default: 5
    }
  },
  
  data() {
    return {
      scrollTop: 0,
      containerHeight: this.height
    }
  },
  
  computed: {
    // 总高度
    totalHeight() {
      return this.items.length * this.itemHeight
    },
    
    // 可见区域起始索引
    startIndex() {
      const start = Math.floor(this.scrollTop / this.itemHeight) - this.buffer
      return Math.max(0, start)
    },
    
    // 可见区域结束索引
    endIndex() {
      const visibleCount = Math.ceil(this.containerHeight / this.itemHeight)
      const end = Math.floor(this.scrollTop / this.itemHeight) + visibleCount + this.buffer
      return Math.min(this.items.length, end)
    },
    
    // 可见项
    visibleItems() {
      const visible = this.items.slice(this.startIndex, this.endIndex)
      // 添加索引
      return visible.map((item, index) => ({
        ...item,
        $index: this.startIndex + index
      }))
    },
    
    // 偏移量
    offset() {
      return this.startIndex * this.itemHeight
    }
  },
  
  mounted() {
    this.containerHeight = this.$refs.container.clientHeight
    window.addEventListener('resize', this.handleResize)
  },
  
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },
  
  methods: {
    handleScroll() {
      this.scrollTop = this.$refs.container.scrollTop
      this.$emit('scroll', this.scrollTop)
    },
    
    handleResize() {
      this.containerHeight = this.$refs.container.clientHeight
    },
    
    // 滚动到指定索引
    scrollToIndex(index) {
      const scrollTop = index * this.itemHeight
      this.$refs.container.scrollTop = scrollTop
    },
    
    // 滚动到顶部
    scrollToTop() {
      this.$refs.container.scrollTop = 0
    },
    
    // 获取当前滚动位置
    getScrollTop() {
      return this.scrollTop
    }
  }
}
</script>

<style scoped>
.virtual-list {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-list-content {
  position: relative;
  will-change: transform;
}

.virtual-list-item {
  box-sizing: border-box;
}
</style>
