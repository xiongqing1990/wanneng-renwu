<template>
	<view class="container">
		<!-- Logo -->
		<view class="logo-section">
			<text class="logo">📋</text>
			<text class="app-name">万能任务</text>
			<text class="version">v1.0.0</text>
		</view>
		
		<!-- 简介 -->
		<view class="intro-section">
			<text class="title">关于我们</text>
			<text class="content">万能任务是一个简洁的任务发布与接单平台，致力于帮助用户快速匹配需求与服务，让做任何事情变得更简单。</text>
		</view>
		
		<!-- 统计数据 -->
		<view class="stats-section">
			<view class="stat-item">
				<text class="num">10万+</text>
				<text class="label">注册用户</text>
			</view>
			<view class="stat-item">
				<text class="num">50万+</text>
				<text class="label">完成任务</text>
			</view>
			<view class="stat-item">
				<text class="num">99%</text>
				<text class="label">满意度</text>
			</view>
		</view>
		
		<!-- 功能介绍 -->
		<view class="feature-section">
			<text class="title">核心功能</text>
			<view class="feature-list">
				<view class="feature-item">
					<text class="icon">📋</text>
					<view class="info">
						<text class="name">发布任务</text>
						<text class="desc">一键发布任何需求</text>
					</view>
				</view>
				<view class="feature-item">
					<text class="icon">💬</text>
					<view class="info">
						<text class="name">即时聊天</text>
						<text class="desc">像微信一样聊天</text>
					</view>
				</view>
				<view class="feature-item">
					<text class="icon">🔒</text>
					<view class="info">
						<text class="name">押金担保</text>
						<text class="desc">保障交易安全</text>
					</view>
				</view>
				<view class="feature-item">
					<text class="icon">⭐</text>
					<view class="info">
						<text class="name">信用评价</text>
						<text class="desc">建立信任体系</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 联系方式 -->
		<view class="contact-section">
			<text class="title">联系我们</text>
			<view class="contact-list">
				<view class="contact-item" @click="copyWechat">
					<text class="label">微信客服</text>
					<text class="value">wanneng001</text>
				</view>
				<view class="contact-item">
					<text class="label">邮箱</text>
					<text class="value">support@wanneng.com</text>
				</view>
				<view class="contact-item">
					<text class="label">电话</text>
					<text class="value">400-888-8888</text>
				</view>
				<view class="contact-item">
					<text class="label">官网</text>
					<text class="value">www.wanneng.com</text>
				</view>
			</view>
		</view>
		
		<!-- 法规 -->
		<view class="law-section">
			<view class="law-item" @click="goTo('terms')">
				<text class="label">用户协议</text>
				<text class="arrow">></text>
			</view>
			<view class="law-item" @click="goTo('privacy')">
				<text class="label">隐私政策</text>
				<text class="arrow">></text>
			</view>
			<view class="law-item" @click="goTo('law')">
				<text class="label">法律声明</text>
				<text class="arrow">></text>
			</view>
		</view>
		
		<!-- 版权 -->
		<view class="copyright">
			<text>© 2024 万能任务 版权所有</text>
			<text>All Rights Reserved</text>
		</view>
	</view>
</template>

<script>
export default {
	methods: {
		copyWechat() {
			uni.setClipboardData({
				data: 'wanneng001',
				success: () => {
					uni.showToast({ title: '微信号已复制', icon: 'success' });
				}
			});
		},
		goTo(page) {
			uni.showToast({ title: '功能开发中', icon: 'none' });
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 50rpx;
}
.logo-section {
	background: linear-gradient(135deg, #07C160 0%, #06ad56 100%);
	padding: 80rpx 30rpx;
	text-align: center;
}
.logo-section .logo {
	font-size: 120rpx;
	display: block;
	margin-bottom: 20rpx;
}
.logo-section .app-name {
	font-size: 48rpx;
	font-weight: bold;
	color: #fff;
	display: block;
	margin-bottom: 10rpx;
}
.logo-section .version {
	font-size: 26rpx;
	color: rgba(255,255,255,0.8);
}
.intro-section {
	background-color: #fff;
	margin: 20rpx;
	padding: 40rpx 30rpx;
	border-radius: 16rpx;
}
.intro-section .title {
	font-size: 32rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 20rpx;
}
.intro-section .content {
	font-size: 28rpx;
	color: #666;
	line-height: 1.8;
}
.stats-section {
	background-color: #fff;
	margin: 20rpx;
	padding: 40rpx 30rpx;
	border-radius: 16rpx;
	display: flex;
	justify-content: space-around;
}
.stats-section .stat-item {
	text-align: center;
	display: flex;
	flex-direction: column;
}
.stats-section .num {
	font-size: 40rpx;
	font-weight: bold;
	color: #07C160;
	margin-bottom: 10rpx;
}
.stats-section .label {
	font-size: 24rpx;
	color: #999;
}
.feature-section {
	background-color: #fff;
	margin: 20rpx;
	padding: 40rpx 30rpx;
	border-radius: 16rpx;
}
.feature-section .title {
	font-size: 32rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 30rpx;
}
.feature-section .feature-list {
	
}
.feature-section .feature-item {
	display: flex;
	align-items: center;
	padding: 25rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}
.feature-section .feature-item:last-child {
	border-bottom: none;
}
.feature-section .feature-item .icon {
	font-size: 50rpx;
	margin-right: 25rpx;
}
.feature-section .feature-item .info {
	
}
.feature-section .feature-item .name {
	font-size: 30rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 8rpx;
}
.feature-section .feature-item .desc {
	font-size: 26rpx;
	color: #999;
}
.contact-section {
	background-color: #fff;
	margin: 20rpx;
	padding: 40rpx 30rpx;
	border-radius: 16rpx;
}
.contact-section .title {
	font-size: 32rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 30rpx;
}
.contact-section .contact-list {
	
}
.contact-section .contact-item {
	display: flex;
	justify-content: space-between;
	padding: 25rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}
.contact-section .contact-item:last-child {
	border-bottom: none;
}
.contact-section .contact-item .label {
	font-size: 28rpx;
	color: #666;
}
.contact-section .contact-item .value {
	font-size: 28rpx;
	color: #07C160;
}
.law-section {
	background-color: #fff;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
}
.law-section .law-item {
	display: flex;
	justify-content: space-between;
	padding: 25rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}
.law-section .law-item:last-child {
	border-bottom: none;
}
.law-section .law-item .label {
	font-size: 28rpx;
}
.law-section .law-item .arrow {
	color: #ccc;
}
.copyright {
	text-align: center;
	padding: 50rpx 30rpx;
}
.copyright text {
	display: block;
	font-size: 24rpx;
	color: #ccc;
	margin-bottom: 10rpx;
}
</style>