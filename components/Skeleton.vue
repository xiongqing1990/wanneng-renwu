<template>
  <div class="skeleton" :class="{ 'skeleton--animate': animate }">
    <template v-if="type === 'text'">
      <div 
        v-for="i in count"
        :key="i"
        class="skeleton__text"
        :style="{ 
          width: getWidth(i),
          height: height + 'px',
          marginBottom: spacing + 'px'
        }"
      ></div>
    </template>
    
    <template v-else-if="type === 'title'">
      <div 
        class="skeleton__title"
        :style="{ 
          width: width,
          height: height + 'px',
          marginBottom: spacing + 'px'
        }"
      ></div>
    </template>
    
    <template v-else-if="type === 'avatar'">
      <div 
        class="skeleton__avatar"
        :style="{ 
          width: size + 'px',
          height: size + 'px',
          borderRadius: round ? '50%' : '4px',
          marginRight: spacing + 'px'
        }"
      ></div>
    </template>
    
    <template v-else-if="type === 'image'">
      <div 
        class="skeleton__image"
        :style="{ 
          width: width,
          height: height + 'px',
          marginBottom: spacing + 'px'
        }"
      ></div>
    </template>
    
    <template v-else-if="type === 'card'">
      <div 
        v-for="i in count"
        :key="i"
        class="skeleton__card"
        :style="{ 
          marginBottom: spacing + 'px',
          padding: padding + 'px'
        }"
      >
        <div class="skeleton__card-avatar"></div>
        <div class="skeleton__card-content">
          <div class="skeleton__card-title"></div>
          <div class="skeleton__card-text"></div>
        </div>
      </div>
    </template>
    
    <template v-else-if="type === 'list'">
      <div 
        v-for="i in count"
        :key="i"
        class="skeleton__list-item"
        :style="{ padding: padding + 'px' }"
      >
        <slot name="item">
          <div class="skeleton__list-avatar"></div>
          <div class="skeleton__list-content">
            <div class="skeleton__list-title"></div>
            <div class="skeleton__list-desc"></div>
          </div>
        </slot>
      </div>
    </template>
    
    <template v-else>
      <div 
        class="skeleton__rect"
        :style="{ 
          width: width,
          height: height + 'px',
          marginBottom: spacing + 'px'
        }"
      ></div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'Skeleton',
  
  props: {
    // 骨架屏类型
    type: {
      type: String,
      default: 'rect', // text, title, avatar, image, card, list, rect
    },
    
    // 宽度
    width: {
      type: String,
      default: '100%'
    },
    
    // 高度
    height: {
      type: Number,
      default: 20
    },
    
    // 数量（用于text、card、list）
    count: {
      type: Number,
      default: 3
    },
    
    // 间距
    spacing: {
      type: Number,
      default: 12
    },
    
    // 内边距
    padding: {
      type: Number,
      default: 16
    },
    
    // 是否圆形（用于avatar）
    round: {
      type: Boolean,
      default: true
    },
    
    // 尺寸（用于avatar）
    size: {
      type: Number,
      default: 40
    },
    
    // 是否开启动画
    animate: {
      type: Boolean,
      default: true
    }
  },
  
  methods: {
    getWidth(index) {
      if (this.width !== '100%') return this.width
      
      // 随机宽度，模拟真实文本
      if (index === this.count) return '60%'
      if (index % 3 === 0) return '80%'
      return '100%'
    }
  }
}
</script>

<style scoped>
.skeleton__text,
.skeleton__title,
.skeleton__rect,
.skeleton__image {
  background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%);
  background-size: 400% 100%;
}

.skeleton--animate .skeleton__text,
.skeleton--animate .skeleton__title,
.skeleton--animate .skeleton__rect,
.skeleton--animate .skeleton__image,
.skeleton--animate .skeleton__avatar,
.skeleton--animate .skeleton__card,
.skeleton--animate .skeleton__list-item {
  animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

.skeleton__avatar {
  background: #f2f2f2;
  flex-shrink: 0;
}

.skeleton__card {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton__card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  background: #f2f2f2;
  margin-right: 12px;
  flex-shrink: 0;
}

.skeleton__card-content {
  flex: 1;
}

.skeleton__card-title {
  width: 40%;
  height: 20px;
  background: #f2f2f2;
  margin-bottom: 8px;
  border-radius: 2px;
}

.skeleton__card-text {
  width: 80%;
  height: 16px;
  background: #f2f2f2;
  border-radius: 2px;
}

.skeleton__list-item {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton__list-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f2f2f2;
  margin-right: 12px;
  flex-shrink: 0;
}

.skeleton__list-content {
  flex: 1;
}

.skeleton__list-title {
  width: 50%;
  height: 18px;
  background: #f2f2f2;
  margin-bottom: 6px;
  border-radius: 2px;
}

.skeleton__list-desc {
  width: 70%;
  height: 14px;
  background: #f2f2f2;
  border-radius: 2px;
}
</style>
