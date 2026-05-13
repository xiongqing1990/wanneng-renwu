<template>
  <view class="privacy-page">
    <view class="privacy-header">
      <text class="privacy-title">隐私政策</text>
      <text class="privacy-update">最后更新：2026年5月12日</text>
    </view>
    
    <view class="privacy-content">
      <section class="privacy-section">
        <h2>1. 信息收集</h2>
        <p>我们收集以下信息：</p>
        <ul>
          <li>基本信息：手机号、昵称、头像</li>
          <li>位置信息：用于任务匹配</li>
          <li>设备信息：设备型号、操作系统</li>
          <li>使用数据：操作日志、性能指标</li>
        </ul>
      </section>
      
      <section class="privacy-section">
        <h2>2. 信息使用</h2>
        <p>我们使用收集的信息用于：</p>
        <ul>
          <li>提供核心功能服务</li>
          <li>优化用户体验</li>
          <li>安全保障和风控</li>
          <li>数据分析和服务改进</li>
        </ul>
      </section>
      
      <section class="privacy-section">
        <h2>3. 信息保护</h2>
        <p>我们采取以下措施保护您的信息：</p>
        <ul>
          <li>数据传输加密（HTTPS/TLS）</li>
          <li>敏感数据加密存储</li>
          <li>访问权限控制</li>
          <li>定期安全审计</li>
        </ul>
      </section>
      
      <section class="privacy-section">
        <h2>4. 信息共享</h2>
        <p>我们不会向第三方分享您的个人信息，除非：</p>
        <ul>
          <li>获得您的明确同意</li>
          <li>法律法规要求</li>
          <li>保护本平台和用户权益</li>
        </ul>
      </section>
      
      <section class="privacy-section">
        <h2>5. 您的权利</h2>
        <p>您有权：</p>
        <ul>
          <li>查看和导出个人数据</li>
          <li>更正不准确的信息</li>
          <li>删除个人账号和数据</li>
          <li>撤回已同意的授权</li>
        </ul>
      </section>
      
      <section class="privacy-section">
        <h2>6. 联系我们</h2>
        <p>如有疑问，请联系：</p>
        <p>邮箱：support@wannengtask.com</p>
        <p>电话：400-123-4567</p>
      </section>
    </view>
    
    <view class="privacy-footer">
      <button class="btn-agree" @click="handleAgree">同意并继续</button>
      <button class="btn-disagree" @click="handleDisagree">不同意</button>
    </view>
  </view>
</template>

<script>
export default {
  name: 'PrivacyPage',
  
  methods: {
    handleAgree() {
      // 记录同意
      localStorage.setItem('privacy_agreed', 'true')
      localStorage.setItem('privacy_agreed_time', new Date().toISOString())
      
      this.$emit('agree')
      
      // 返回上一页或跳转首页
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push('/')
      }
    },
    
    handleDisagree() {
      if (confirm('不同意隐私政策将无法使用本应用，确定吗？')) {
        // 退出应用
        if (navigator.app) {
          navigator.app.exitApp()
        }
      }
    }
  },
  
  mounted() {
    // 检查是否已经同意
    const agreed = localStorage.getItem('privacy_agreed')
    if (agreed === 'true') {
      this.$router.replace('/')
    }
  }
}
</script>

<style scoped>
.privacy-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.privacy-header {
  background: #07C160;
  color: #fff;
  padding: 30px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.privacy-title {
  display: block;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.privacy-update {
  font-size: 14px;
  opacity: 0.8;
}

.privacy-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.privacy-section {
  margin-bottom: 24px;
}

.privacy-section h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #07C160;
}

.privacy-section p {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
}

.privacy-section ul {
  padding-left: 20px;
}

.privacy-section li {
  font-size: 15px;
  color: #666;
  line-height: 1.8;
}

.privacy-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}

.btn-agree {
  background: #07C160;
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
}

.btn-disagree {
  background: #fff;
  color: #666;
  border: 1px solid #ddd;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
}
</style>
