<template>
	<view class="container">
		<!-- Logo -->
		<view class="logo-area">
			<text class="logo">📋</text>
			<text class="app-name">万能任务</text>
			<text class="slogan">发布需求 · 轻松对接</text>
		</view>
		
		<!-- 登录表单 -->
		<view class="form">
			<view class="form-item">
				<text class="label">手机号</text>
				<input type="number" v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
			</view>
			<view class="form-item">
				<text class="label">验证码</text>
				<view class="code-input">
					<input type="number" v-model="form.code" placeholder="请输入验证码" maxlength="6" />
					<button class="code-btn" @click="sendCode" :disabled="countdown > 0">
						{{ countdown > 0 ? countdown + 's' : '获取验证码' }}
					</button>
				</view>
			</view>
		</view>
		
		<!-- 登录按钮 -->
		<button class="btn-login" @click="handleLogin">登录</button>
		
		<!-- 其他登录方式 -->
		<view class="other-login">
			<view class="divider">
				<view class="line"></view>
				<text class="text">其他登录方式</text>
				<view class="line"></view>
			</view>
			<view class="login-icons">
				<view class="icon-item" @click="wechatLogin">
					<text class="icon">💬</text>
					<text class="name">微信</text>
				</view>
			</view>
		</view>
		
		<!-- 用户协议 -->
		<view class="agreement">
			<checkbox-group @change="onAgreeChange">
				<label>
					<checkbox value="agree" :checked="agreed" />
					<text class="text">我已阅读并同意</text>
				</label>
			</checkbox-group>
			<text class="link">《用户协议》</text>
			<text class="text">和</text>
			<text class="link">《隐私政策》</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			form: {
				phone: '',
				code: ''
			},
			countdown: 0,
			agreed: false
		}
	},
	methods: {
		sendCode() {
			if (!this.form.phone || this.form.phone.length !== 11) {
				uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
				return
			}
			
			// 模拟发送验证码
			uni.showToast({ title: '验证码已发送', icon: 'success' })
			
			this.countdown = 60
			const timer = setInterval(() => {
				this.countdown--
				if (this.countdown <= 0) {
					clearInterval(timer)
				}
			}, 1000)
		},
		onAgreeChange(e) {
			this.agreed = e.detail.value.length > 0
		},
		handleLogin() {
			if (!this.form.phone || !this.form.code) {
				uni.showToast({ title: '请填写完整信息', icon: 'none' })
				return
			}
			
			if (!this.agreed) {
				uni.showToast({ title: '请先同意用户协议', icon: 'none' })
				return
			}
			
			// 模拟登录
			uni.showLoading({ title: '登录中...' })
			setTimeout(() => {
				uni.hideLoading()
				// 保存登录状态
				uni.setStorageSync('token', 'mock_token_' + Date.now())
				uni.setStorageSync('userInfo', {
					id: 1,
					nickname: '用户' + this.form.phone.slice(-4),
					phone: this.form.phone
				})
				
				uni.showToast({ title: '登录成功', icon: 'success' })
				setTimeout(() => {
					uni.switchTab({ url: '/pages/index/index' })
				}, 1500)
			}, 1000)
		},
		wechatLogin() {
			uni.showToast({ title: '微信登录开发中', icon: 'none' })
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background: linear-gradient(180deg, #07C160 0%, #f5f5f5 40%);
	padding: 100rpx 60rpx 60rpx;
}
.logo-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 80rpx;
}
.logo {
	font-size: 120rpx;
	margin-bottom: 20rpx;
}
.app-name {
	font-size: 48rpx;
	font-weight: bold;
	color: #fff;
	margin-bottom: 10rpx;
}
.slogan {
	font-size: 28rpx;
	color: rgba(255,255,255,0.8);
}
.form {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 40rpx;
}
.form-item {
	margin-bottom: 30rpx;
}
.form-item .label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 15rpx;
}
.form-item input {
	width: 100%;
	padding: 25rpx;
	border: 1rpx solid #eee;
	border-radius: 10rpx;
	font-size: 28rpx;
}
.code-input {
	display: flex;
	gap: 20rpx;
}
.code-input input {
	flex: 1;
}
.code-btn {
	width: 240rpx;
	padding: 25rpx;
	background-color: #07C160;
	color: #fff;
	border-radius: 10rpx;
	font-size: 26rpx;
}
.code-btn[disabled] {
	background-color: #ccc;
}
.btn-login {
	background-color: #07C160;
	color: #fff;
	padding: 30rpx;
	border-radius: 50rpx;
	font-size: 32rpx;
	font-weight: bold;
	margin-bottom: 40rpx;
}
.other-login {
	margin-bottom: 40rpx;
}
.divider {
	display: flex;
	align-items: center;
	margin-bottom: 40rpx;
}
.divider .line {
	flex: 1;
	height: 1rpx;
	background-color: #ddd;
}
.divider .text {
	padding: 0 30rpx;
	font-size: 24rpx;
	color: #999;
}
.login-icons {
	display: flex;
	justify-content: center;
	gap: 60rpx;
}
.icon-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}
.icon-item .icon {
	font-size: 60rpx;
	margin-bottom: 10rpx;
}
.icon-item .name {
	font-size: 24rpx;
	color: #666;
}
.agreement {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-wrap: wrap;
	font-size: 24rpx;
}
.agreement .text {
	color: #999;
}
.agreement .link {
	color: #07C160;
}
</style>