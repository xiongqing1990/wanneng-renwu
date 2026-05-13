<template>
	<view class="container">
		<view class="header">
			<text class="title">支付</text>
		</view>
		
		<!-- 支付金额 -->
		<view class="amount-card">
			<text class="label">支付金额</text>
			<view class="amount-input">
				<text class=" yuan">¥</text>
				<input type="digit" v-model="amount" placeholder="0.00" />
			</view>
		</view>
		
		<!-- 支付方式 -->
		<view class="payment-methods">
			<text class="section-title">选择支付方式</text>
			
			<view class="method-item" @click="selectMethod('wechat')" :class="{ active: method === 'wechat' }">
				<text class="icon">💬</text>
				<text class="name">微信支付</text>
				<view class="check" v-if="method === 'wechat'">✓</view>
			</view>
			
			<view class="method-item" @click="selectMethod('alipay')" :class="{ active: method === 'alipay' }">
				<text class="icon">💙</text>
				<text class="name">支付宝</text>
				<view class="check" v-if="method === 'alipay'">✓</view>
			</view>
		</view>
		
		<!-- 安全提示 -->
		<view class="security-tip">
			<text class="icon">🔒</text>
			<text class="text">支付环境安全，信息已加密保护</text>
		</view>
		
		<!-- 支付按钮 -->
		<button class="btn-pay" @click="handlePay">确认支付 ¥{{ amount }}</button>
	</view>
</template>

<script>
export default {
	data() {
		return {
			amount: '',
			method: 'wechat'
		}
	},
	methods: {
		selectMethod(method) {
			this.method = method;
		},
		handlePay() {
			if (!this.amount || this.amount <= 0) {
				uni.showToast({ title: '请输入支付金额', icon: 'none' });
				return;
			}
			
			uni.showLoading({ title: '支付中...' });
			
			// 调用支付API（模拟）
			setTimeout(() => {
				uni.hideLoading();
				uni.showToast({ title: '支付成功', icon: 'success' });
				
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			}, 1500);
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 30rpx;
}
.header {
	text-align: center;
	padding: 30rpx 0;
}
.title {
	font-size: 36rpx;
	font-weight: bold;
}
.amount-card {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 30rpx;
}
.amount-card .label {
	font-size: 28rpx;
	color: #999;
	margin-bottom: 20rpx;
}
.amount-input {
	display: flex;
	align-items: center;
}
.amount-input .yuan {
	font-size: 48rpx;
	font-weight: bold;
	margin-right: 20rpx;
}
.amount-input input {
	flex: 1;
	font-size: 60rpx;
	font-weight: bold;
}
.payment-methods {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
}
.section-title {
	font-size: 28rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 20rpx;
}
.method-item {
	display: flex;
	align-items: center;
	padding: 30rpx;
	border: 2rpx solid #eee;
	border-radius: 15rpx;
	margin-bottom: 20rpx;
}
.method-item.active {
	border-color: #07C160;
	background-color: #f0fdf4;
}
.method-item .icon {
	font-size: 48rpx;
	margin-right: 20rpx;
}
.method-item .name {
	flex: 1;
	font-size: 30rpx;
}
.method-item .check {
	color: #07C160;
	font-weight: bold;
}
.security-tip {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx;
}
.security-tip .icon {
	font-size: 28rpx;
	margin-right: 10rpx;
}
.security-tip .text {
	font-size: 24rpx;
	color: #999;
}
.btn-pay {
	background-color: #07C160;
	color: #fff;
	padding: 30rpx;
	border-radius: 50rpx;
	font-size: 32rpx;
	margin-top: 60rpx;
}
</style>