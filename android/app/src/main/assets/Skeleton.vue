<template>
  <view class="skeleton" v-if="loading">
    <!-- 标题骨架 -->
    <view v-if="type === 'title'" class="skeleton__title">
      <view class="skeleton__line" :style="{ width: width }"></view>
    </view>
    
    <!-- 段落骨架 -->
    <view v-else-if="type === 'paragraph'" class="skeleton__paragraph">
      <view
        v-for="(line, index) in lines"
        :key="index"
        class="skeleton__line"
        :style="{ width: line.width, height: line.height || '28rpx' }"
      ></view>
    </view>
    
    <!-- 卡片骨架 -->
    <view v-else-if="type === 'card'" class="skeleton__card">
      <view class="skeleton__card-avatar" v-if="showAvatar"></view>
      <view class="skeleton__card-content">
        <view class="skeleton__line" style="width: 40%"></view>
        <view class="skeleton__line" style="width: 80%"></view>
        <view class="skeleton__line" style="width: 60%"></view>
      </view>
    </view>
    
    <!-- 列表骨架 -->
    <view v-else-if="type === 'list'" class="skeleton__list">
      <view
        v-for="n in count"
        :key="n"
        class="skeleton__list-item"
      >
        <view class="skeleton__list-avatar"></view>
        <view class="skeleton__list-content">
          <view class="skeleton__line" style="width: 50%"></view>
          <view class="skeleton__line" style="width: 80%"></view>
        </view>
      </view>
    </view>
    
    <!-- 自定义 -->
    <view v-else class="skeleton__custom">
      <slot></slot>
    </view>
  </view>
</template>

<script>
/**
 * 骨架屏组件
 * 用于页面加载时的占位显示
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

export default {
  name: 'Skeleton',
  
  props: {
    // 是否显示骨架屏
    loading: {
      type: Boolean,
      default: true
    },
    // 骨架类型：title/paragraph/card/list/custom
    type: {
      type: String,
      default: 'paragraph'
    },
    // 段落行数
    lines: {
      type: [Number, Array],
      default: 3,
      validator(value) {
        if (typeof value === 'number') {
          return value > 0
        }
        return Array.isArray(value)
      }
    },
    // 列表项数
    count: {
      type: Number,
      default: 5
    },
    // 是否显示头像
    showAvatar: {
      type: Boolean,
      default: true
    },
    // 宽度（用于title类型）
    width: {
      type: String,
      default: '60%'
    }
  },
  
  computed: {
    /**
     * 段落行配置
     */
    lineConfigs() {
      if (Array.isArray(this.lines)) {
        return this.lines
      }
      
      const configs = []
      for (let i = 0; i < this.lines; i++) {
        // 最后一行短一些
        const width = i === this.lines - 1 ? '60%' : '100%'
        configs.push({ width, height: '28rpx' })
      }
      return configs
    }
  }
}
</script>

<style lang="scss" scoped>
.skeleton {
  padding: 20rpx;
  
  &__line {
    height: 28rpx;
    margin-bottom: 20rpx;
    background: linear-gradient(
      90deg,
      #f2f2f2 25%,
      #e6e6e6 50%,
      #f2f2f2 75%
    );
    background-size: 400% 100%;
    animation: skeleton-loading 1.4s ease infinite;
    border-radius: 4rpx;
  }
  
  &__title {
    .skeleton__line {
      height: 40rpx;
      margin-bottom: 30rpx;
    }
  }
  
  &__paragraph {
    padding: 20rpx 0;
  }
  
  &__card {
    display: flex;
    padding: 20rpx;
    background: #fff;
    border-radius: 12rpx;
    margin-bottom: 20rpx;
    
    &-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%);
      background-size: 400% 100%;
      animation: skeleton-loading 1.4s ease infinite;
      margin-right: 20rpx;
      flex-shrink: 0;
    }
    
    &-content {
      flex: 1;
    }
  }
  
  &__list {
    &-item {
      display: flex;
      padding: 20rpx;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    &-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background: linear-gradient(90deg, #f2f2f2 25%, #e6e6e6 50%, #f2f2f2 75%);
      background-size: 400% 100%;
      animation: skeleton-loading 1.4s ease infinite;
      margin-right: 20rpx;
      flex-shrink: 0;
    }
    
    &-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
