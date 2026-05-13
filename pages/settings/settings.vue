<template>
	<view class="container">
		<view class="section">
			<text class="section-title">基本设置</text>
			<view class="menu-list">
				<view class="menu-item">
					<text class="icon">🔔</text>
					<text class="label">新消息通知</text>
					<switch :checked="settings.messageNotify" @change="settings.messageNotify = !settings.messageNotify" color="#07C160" />
				</view>
				<view class="menu-item">
					<text class="icon">🔊</text>
					<text class="label">声音</text>
					<switch :checked="settings.sound" @change="settings.sound = !settings.sound" color="#07C160" />
				</view>
				<view class="menu-item">
					<text class="icon">📳</text>
					<text class="label">震动</text>
					<switch :checked="settings.vibrate" @change="settings.vibrate = !settings.vibrate" color="#07C160" />
				</view>
				<view class="menu-item">
					<text class="icon">🌙</text>
					<text class="label">夜间模式</text>
					<switch :checked="settings.nightMode" @change="settings.nightMode = !settings.nightMode" color="#07C160" />
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">隐私设置</text>
			<view class="menu-list">
				<view class="menu-item" @click="goTo('privacy')">
					<text class="label">好友验证</text>
					<text class="value">需要验证</text>
					<text class="arrow">></text>
				</view>
				<view class="menu-item" @click="goTo('visible')">
					<text class="label">展示对我的印象</text>
					<switch :checked="settings.showImpression" @change="settings.showImpression = !settings.showImpression" color="#07C160" />
				</view>
				<view class="menu-item" @click="goTo('blacklist')">
					<text class="label">黑名单</text>
					<text class="arrow">></text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">通用设置</text>
			<view class="menu-list">
				<view class="menu-item" @click="goTo('language')">
					<text class="label">语言</text>
					<text class="value">简体中文</text>
					<text class="arrow">></text>
				</view>
				<view class="menu-item" @click="goTo('theme')">
					<text class="label">主题</text>
					<text class="value">绿色</text>
					<text class="arrow">></text>
				</view>
				<view class="menu-item" @click="goTo('storage')">
					<text class="label">存储空间</text>
					<text class="value">256MB</text>
					<text class="arrow">></text>
				</view>
			</view>
		</view>
		
		<view class="section">
			<text class="section-title">账号安全</text>
			<view class="menu-list">
				<view class="menu-item" @click="goTo('password')">
					<text class="label">修改密码</text>
					<text class="arrow">></text>
				</view>
				<view class="menu-item" @click="goTo('phone')">
					<text class="label">更换手机号</text>
					<text class="value">138****8888</text>
					<text class="arrow">></text>
				</view>
				<view class="menu-item" @click="goTo('wechat')">
					<text class="label">绑定微信</text>
					<text class="value">已绑定</text>
					<text class="arrow">></text>
				</view>
			</view>
		</view>
		
		<view class="btn-logout" @click="handleLogout">
			退出登录
		</view>
		
		<view class="version">
			<text>万能任务 v1.0.0</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			settings: {
				messageNotify: true,
				sound: true,
				vibrate: true,
				nightMode: false,
				showImpression: true
			}
		}
	},
	methods: {
		goTo(page) {
			uni.showToast({ title: '功能开发中', icon: 'none' });
		},
		handleLogout() {
			uni.showModal({
				title: '退出登录',
				content: '确定要退出登录吗？',
				success: (res) => {
					if (res.confirm) {
						uni.removeStorageSync('token');
						uni.reLaunch({ url: '/pages/login/login' });
					}
				}
			});
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 20rpx;
}
.section {
	background-color: #fff;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
}
.section .section-title {
	display: block;
	padding: 25rpx 30rpx 15rpx;
	font-size: 26rpx;
	color: #999;
}
.menu-list {
	
}
.menu-item {
	display: flex;
	align-items: center;
	padding: 25rpx 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
}
.menu-item:last-child {
	border-bottom: none;
}
.menu-item .icon {
	font-size: 40rpx;
	margin-right: 20rpx;
}
.menu-item .label {
	flex: 1;
	font-size: 30rpx;
}
.menu-item .value {
	font-size: 28rpx;
	color: #999;
	margin-right: 15rpx;
}
.menu-item .arrow {
	color: #ccc;
}
.btn-logout {
	background-color: #fff;
	padding: 30rpx;
	text-align: center;
	border-radius: 16rpx;
	color: #f43530;
	font-size: 32rpx;
	margin-top: 40rpx;
}
.version {
	text-align: center;
	padding: 40rpx;
	font-size: 24rpx;
	color: #ccc;
}
</style>