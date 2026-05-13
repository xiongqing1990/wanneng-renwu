<template>
  <view class="agreement-page">
    <view class="agreement-header">
      <text class="agreement-title">用户协议</text>
      <text class="agreement-version">版本：v2.0</text>
    </view>
    
    <view class="agreement-content">
      <section class="agreement-section">
        <h2>一、总则</h2>
        <p>1.1 本协议是您与本平台之间关于使用万能任务APP服务所订立的契约。</p>
        <p>1.2 使用本平台服务即表示您同意本协议的全部条款。</p>
        <p>1.3 我们保留修改本协议的权利，修改后的协议将在APP内公布。</p>
      </section>
      
      <section class="agreement-section">
        <h2>二、服务说明</h2>
        <p>2.1 本平台提供任务发布、接单、聊天等功能服务。</p>
        <p>2.2 用户需注册账号并完善个人信息后方可使用完整功能。</p>
        <p>2.3 我们保留随时变更、中断或终止部分或全部服务的权利。</p>
      </section>
      
      <section class="agreement-section">
        <h2>三、用户义务</h2>
        <p>3.1 用户需提供真实、准确、完整的个人信息。</p>
        <p>3.2 用户不得发布违法、违规、虚假信息。</p>
        <p>3.3 用户需妥善保管账号和密码，对账号下的一切行为负责。</p>
        <p>3.4 用户不得利用本平台从事任何违法活动。</p>
      </section>
      
      <section class="agreement-section">
        <h2>四、任务规则</h2>
        <p>4.1 发布任务需明确描述需求，设置合理预算。</p>
        <p>4.2 接单后需按约定时间完成，不得无故取消。</p>
        <p>4.3 任务完成后，发布者需及时确认并支付费用。</p>
        <p>4.4 争议由双方协商解决，协商不成可申请平台介入。</p>
      </section>
      
      <section class="agreement-section">
        <h2>五、费用与支付</h2>
        <p>5.1 平台收取交易金额的10%作为服务费。</p>
        <p>5.2 支付完成后，费用将冻结在平台，确认任务完成后释放给接单者。</p>
        <p>5.3 退款需双方协商一致，平台有权根据情况进行裁决。</p>
      </section>
      
      <section class="agreement-section">
        <h2>六、知识产权</h2>
        <p>6.1 用户在本平台发布的内容，其知识产权归用户所有。</p>
        <p>6.2 用户同意授予本平台在全球范围内免费使用、修改、复制、分发该内容的权利。</p>
        <p>6.3 用户不得侵犯他人的知识产权，否则自行承担法律责任。</p>
      </section>
      
      <section class="agreement-section">
        <h2>七、免责声明</h2>
        <p>7.1 本平台仅提供信息中介服务，不承担交易双方的任何责任。</p>
        <p>7.2 因不可抗力导致的服务中断或数据丢失，本平台不承担责任。</p>
        <p>7.3 用户因使用本平台服务而产生的任何损失，本平台不承担责任。</p>
      </section>
      
      <section class="agreement-section">
        <h2>八、违约责任</h2>
        <p>8.1 用户违反本协议的，本平台有权采取以下措施：</p>
        <ul>
          <li>警告、限制功能、暂停账号、永久封禁</li>
          <li>删除违规内容</li>
          <li>追究法律责任</li>
        </ul>
        <p>8.2 用户应赔偿因违反本协议给本平台造成的损失。</p>
      </section>
      
      <section class="agreement-section">
        <h2>九、争议解决</h2>
        <p>9.1 因本协议引起的争议，双方应友好协商解决。</p>
        <p>9.2 协商不成的，任何一方可向本平台所在地人民法院提起诉讼。</p>
      </section>
      
      <section class="agreement-section">
        <h2>十、其他</h2>
        <p>10.1 本协议自您注册账号之日起生效。</p>
        <p>10.2 本协议的解释权归本平台所有。</p>
        <p>10.3 本协议未尽事宜，按国家有关法律法规执行。</p>
      </section>
    </view>
    
    <view class="agreement-footer">
      <label class="agree-checkbox">
        <input type="checkbox" v-model="isAgreed" />
        <span>我已阅读并同意《用户协议》</span>
      </label>
      
      <button 
        class="btn-confirm" 
        :disabled="!isAgreed"
        @click="handleConfirm"
      >
        确认
      </button>
    </view>
  </view>
</template>

<script>
export default {
  name: 'AgreementPage',
  
  data() {
    return {
      isAgreed: false
    }
  },
  
  methods: {
    handleConfirm() {
      if (!this.isAgreed) {
        alert('请先勾选同意用户协议')
        return
      }
      
      // 记录同意
      localStorage.setItem('agreement_agreed', 'true')
      localStorage.setItem('agreement_agreed_time', new Date().toISOString())
      
      this.$emit('agree')
      
      // 返回上一页或跳转首页
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push('/')
      }
    }
  },
  
  mounted() {
    // 检查是否已经同意
    const agreed = localStorage.getItem('agreement_agreed')
    if (agreed === 'true') {
      this.$router.replace('/')
    }
  }
}
</script>

<style scoped>
.agreement-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
}

.agreement-header {
  background: #07C160;
  color: #fff;
  padding: 30px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.agreement-title {
  display: block;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.agreement-version {
  font-size: 14px;
  opacity: 0.8;
}

.agreement-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.agreement-section {
  margin-bottom: 24px;
}

.agreement-section h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #07C160;
}

.agreement-section p {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
}

.agreement-section ul {
  padding-left: 20px;
}

.agreement-section li {
  font-size: 15px;
  color: #666;
  line-height: 1.8;
}

.agreement-footer {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.agree-checkbox {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 15px;
  color: #666;
}

.agree-checkbox input {
  margin-right: 8px;
}

.btn-confirm {
  width: 100%;
  background: #07C160;
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
}

.btn-confirm:disabled {
  background: #ccc;
}
</style>
