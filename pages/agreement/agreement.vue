<template>
  <view class="agreement-page">
    <view class="header">
      <text class="title">用户协议</text>
    </view>
    
    <scroll-view class="content" scroll-y>
      <view class="section">
        <text class="section-title">欢迎使用万能任务APP</text>
        <text class="text">在使用我们的服务前，请仔细阅读本协议。一旦您使用本服务，即视为您已阅读并同意本协议的全部内容。</text>
      </view>
      
      <view class="section">
        <text class="section-title">一、服务说明</text>
        <text class="text">1. 万能任务APP是一个连接任务发布者和接受者的平台，为用户提供发布、接受、完成任务的社区服务。\n\n2. 我们保留随时修改或中断服务而不需通知用户的权利。\n\n3. 我们保留判定用户行为是否符合本协议要求的权利。</text>
      </view>
      
      <view class="section">
        <text class="section-title">二、账号注册与管理</text>
        <text class="text">1. 您应提供真实、准确、完整的个人信息，并在信息变更时及时更新。\n\n2. 您应妥善保管账号和密码，任何使用该账号和密码进行的活动均由您负责。\n\n3. 如发现账号被未经授权使用，应立即通知我们。\n\n4. 我们有权冻结、封禁违反本协议的用户账号。</text>
      </view>
      
      <view class="section">
        <text class="section-title">三、任务发布与接受</text>
        <text class="text">1. 发布任务应提供真实、准确、完整的信息，不得发布违法、违规内容。\n\n2. 任务价格应合理，不得低于当地最低工资标准。\n\n3. 接受任务者应按时、按质完成任务。\n\n4. 发布者应按时支付报酬，不得无故拖欠。\n\n5. 双方应友好协商解决争议，协商不成的，可向平台投诉。</text>
      </view>
      
      <view class="section">
        <text class="section-title">四、支付与退款</text>
        <text class="text">1. 平台支持微信支付、支付宝等支付方式。\n\n2. 支付完成后，资金将由平台托管，任务完成后再打给接受者。\n\n3. 如任务取消或失败，平台将在3-7个工作日内退款。\n\n4. 用户不得利用平台进行洗钱、诈骗等违法活动。</text>
      </view>
      
      <view class="section">
        <text class="section-title">五、知识产权</text>
        <text class="text">1. 用户在平台上发布的内容，其知识产权归用户所有。\n\n2. 平台有权为提供服务的目的，使用、存储、复制您发布的内容。\n\n3. 用户不得发布侵犯他人知识产权的内容，否则后果自负。\n\n4. 平台有权删除侵犯他人知识产权的内容。</text>
      </view>
      
      <view class="section">
        <text class="section-title">六、隐私保护</text>
        <text class="text">我们重视对您个人信息的保护，有关我们如何收集、使用、分享和保护您的个人信息，请阅读我们的《隐私政策》。</text>
      </view>
      
      <view class="section">
        <text class="section-title">七、免责声明</text>
        <text class="text">1. 平台仅提供信息撮合服务，不对任务完成质量提供担保。\n\n2. 因不可抗力（如地震、火灾、政府行为等）导致服务中断或数据丢失，平台不承担责任。\n\n3. 用户因使用本服务而产生的任何直接或间接损失，平台不承担责任。\n\n4. 平台保留最终解释权。</text>
      </view>
      
      <view class="section">
        <text class="section-title">八、协议修改</text>
        <text class="text">我们保留随时修改本协议的权利。修改后的协议将在平台上公布。您继续使用服务，即视为接受修改后的协议。</text>
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
 * 用户协议页面
 * 符合相关法律法规要求
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

export default {
  name: 'AgreementPage',
  
  methods: {
    /**
     * 同意用户协议
     */
    onAgree() {
      uni.setStorageSync('agreement_agreed', true)
      uni.setStorageSync('agreement_agree_time', Date.now())
      
      uni.showToast({
        title: '感谢您的同意',
        icon: 'success'
      })
      
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    },
    
    /**
     * 不同意用户协议
     */
    onDisagree() {
      uni.showModal({
        title: '提示',
        content: '不同意用户协议将无法使用本应用。确定不同意吗？',
        success: (res) => {
          if (res.confirm) {
            // 退出应用
            uni.showToast({
              title: '即将退出应用',
              icon: 'none'
            })
            setTimeout(() => {
              // 实际项目中应调用退出应用API
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
.agreement-page {
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
