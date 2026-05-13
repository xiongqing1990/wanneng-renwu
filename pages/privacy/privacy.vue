<template>
  <view class="privacy-page">
    <view class="header">
      <text class="title">隐私政策</text>
    </view>
    
    <scroll-view class="content" scroll-y>
      <view class="section">
        <text class="section-title">引言</text>
        <text class="text">万能任务APP（以下简称"我们"）深知隐私对您的重要性，我们将按照法律法规要求，保护您的个人信息安全。本隐私政策描述了当我们处理您的个人信息时，我们收集什么信息、如何使用、分享和保护这些信息。</text>
      </view>
      
      <view class="section">
        <text class="section-title">信息收集</text>
        <text class="text">我们收集以下类型的信息：\n\n1. 您提供的信息：注册账号时提供的手机号、邮箱等；发布任务时的内容信息；支付时的交易信息。\n\n2. 我们自动收集的信息：设备信息（型号、系统版本）；位置信息（经您授权后）；使用日志（页面访问、操作记录）。\n\n3. 从第三方获取的信息：微信授权登录时获取的昵称、头像等。</text>
      </view>
      
      <view class="section">
        <text class="section-title">信息使用</text>
        <text class="text">我们使用您的信息用于：\n\n1. 提供、维护和改进我们的服务；\n2. 处理您的交易并完成订单；\n3. 向您发送服务通知、营销信息（可退订）；\n4. 防止欺诈和保护安全；\n5. 遵守法律法规要求。</text>
      </view>
      
      <view class="section">
        <text class="section-title">信息共享</text>
        <text class="text">我们不会出售您的个人信息。仅在以下情况下共享您的信息：\n\n1. 经您同意后与第三方共享；\n2. 与我们的服务提供商共享（仅用于提供服务目的）；\n3. 遵守法律法规要求；\n4. 保护我们或公众的安全与权利。</text>
      </view>
      
      <view class="section">
        <text class="section-title">信息安全</text>
        <text class="text">我们采取合理措施保护您的个人信息安全，包括：\n\n1. 使用SSL/TLS加密传输数据；\n2. 对敏感数据进行加密存储；\n3. 实施访问控制，限制可接触个人信息的人员；\n4. 定期进行安全审计和漏洞扫描。</text>
      </view>
      
      <view class="section">
        <text class="section-title">您的权利</text>
        <text class="text">根据适用法律法规，您可能享有以下权利：\n\n1. 访问和查看您的个人信息；\n2. 更正不准确的信息；\n3. 删除您的个人信息；\n4. 撤回同意（不影响撤回前的合法性）；\n5. 投诉和举报。</text>
      </view>
      
      <view class="section">
        <text class="section-title">联系我们</text>
        <text class="text">如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：\n\n邮箱：privacy@wanengrenwu.com\n电话：400-123-4567\n地址：北京市朝阳区xxx路xx号</text>
      </view>
      
      <view class="section">
        <text class="section-title">政策更新</text>
        <text class="text">我们可能会不时更新本隐私政策。当政策发生重大变更时，我们会通过应用内通知、邮件等方式通知您。建议您定期查看本页面以了解最新政策。</text>
        <text class="update-date">最后更新日期：2026年5月12日</text>
      </view>
    </scroll-view>
    
    <view class="footer">
      <button class="btn-agree" @click="onAgree">我同意</button>
      <button class="btn-disagree" @click="onDisagree">不同意</button>
    </view>
  </view>
</template>

<script>
/**
 * 隐私政策页面
 * 符合GDPR、个人信息保护法要求
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

export default {
  name: 'PrivacyPage',
  
  methods: {
    /**
     * 同意隐私政策
     */
    onAgree() {
      uni.setStorageSync('privacy_agreed', true)
      uni.setStorageSync('privacy_agree_time', Date.now())
      
      uni.showToast({
        title: '感谢您的同意',
        icon: 'success'
      })
      
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    },
    
    /**
     * 不同意隐私政策
     */
    onDisagree() {
      uni.showModal({
        title: '提示',
        content: '不同意隐私政策将无法使用本应用的部分功能。确定不同意吗？',
        success: (res) => {
          if (res.confirm) {
            // 退出应用或限制功能
            uni.showToast({
              title: '部分功能将受限',
              icon: 'none'
            })
            setTimeout(() => {
              uni.navigateBack()
            }, 1500)
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.privacy-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
  
  .header {
    background: linear-gradient(135deg, #07C160, #06AD56);
    padding: 30rpx;
    text-align: center;
    
    .title {
      font-size: 36rpx;
      color: #fff;
      font-weight: bold;
    }
  }
  
  .content {
    flex: 1;
    padding: 30rpx;
    
    .section {
      background: #fff;
      border-radius: 12rpx;
      padding: 30rpx;
      margin-bottom: 20rpx;
      
      &-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
        display: block;
      }
      
      .text {
        font-size: 28rpx;
        color: #666;
        line-height: 1.8;
        white-space: pre-wrap;
      }
      
      .update-date {
        font-size: 24rpx;
        color: #999;
        margin-top: 20rpx;
        display: block;
        text-align: right;
      }
    }
  }
  
  .footer {
    padding: 30rpx;
    background: #fff;
    border-top: 1rpx solid #eee;
    display: flex;
    gap: 20rpx;
    
    button {
      flex: 1;
      border-radius: 12rpx;
      font-size: 32rpx;
      padding: 20rpx 0;
    }
    
    .btn-agree {
      background: linear-gradient(135deg, #07C160, #06AD56);
      color: #fff;
    }
    
    .btn-disagree {
      background: #f5f5f5;
      color: #666;
    }
  }
}
</style>
