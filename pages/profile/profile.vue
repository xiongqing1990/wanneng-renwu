<template>
	<view class="container">
		<view class="header">
			<text class="title">我的主页</text>
		</view>
		
		<!-- 用户信息 -->
		<view class="profile-card">
			<image class="avatar" :src="userInfo.avatar" mode="aspectFill" @click="changeAvatar"></image>
			<view class="info">
				<view class="name-row">
					<text class="nickname">{{ userInfo.nickname }}</text>
					<view class="vip-badge" v-if="userInfo.isVip">VIP</view>
				</view>
				<text class="id">ID: {{ userInfo.id }}</text>
				<view class="bio">{{ userInfo.bio }}</view>
			</view>
			<text class="edit-btn" @click="editProfile">编辑</text>
		</view>
		
		<!-- 统计数据 -->
		<view class="stats-row">
			<view class="stat-item" @click="goTo('/pages/profile/my-tasks')">
				<text class="num">{{ userInfo.tasks }}</text>
				<text class="label">任务</text>
			</view>
			<view class="stat-item" @click="goTo('/pages/profile/my-chats')">
				<text class="num">{{ userInfo.chats }}</text>
				<text class="label">聊天</text>
			</view>
			<view class="stat-item">
				<text class="num">{{ userInfo.followers }}</text>
				<text class="label">粉丝</text>
			</view>
			<view class="stat-item">
				<text class="num">{{ userInfo.following }}</text>
				<text class="label">关注</text>
			</view>
		</view>
		
		<!-- 信用分 -->
		<view class="credit-card">
			<view class="credit-header">
				<text class="title">信用分</text>
				<text class="score">{{ userInfo.credit }}</text>
			</view>
			<view class="credit-bar">
				<view class="bar" :style="{width: userInfo.credit + '%'}"></view>
			</view>
			<view class="credit-tips">
				<text>信用良好，交易更顺畅</text>
			</view>
		</view>
		
		<!-- 功能菜单 -->
		<view class="menu-section">
			<text class="section-title">我的服务</text>
			<view class="menu-grid">
				<view class="menu-item" @click="goTo('/pages/profile/my-tasks')">
					<text class="icon">📋</text>
					<text class="label">我的任务</text>
					<view class="badge" v-if="userInfo.pendingTasks">{{ userInfo.pendingTasks }}</view>
				</view>
				<view class="menu-item" @click="goTo('/pages/rate/rate')">
					<text class="icon">⭐</text>
					<text class="label">评价</text>
				</view>
				<view class="menu-item" @click="goTo('/pages/deposit/deposit')">
					<text class="icon">🔒</text>
					<text class="label">保证金</text>
				</view>
				<view class="menu-item" @click="goTo('/pages/auth/auth')">
					<text class="icon">✅</text>
					<text class="label">实名</text>
				</view>
			</view>
		</view>
		
		<view class="menu-section">
			<text class="section-title">其他</text>
			<view class="menu-list">
				<view class="menu-item" @click="goTo('/pages/settings/settings')">
					<text class="icon">⚙️</text>
					<text class="label">设置</text>
					<text class="arrow">></text>
				</view>
				<view class="menu-item" @click="goTo('/pages/settings/help')">
					<text class="icon">❓</text>
					<text class="label">帮助反馈</text>
					<text class="arrow">></text>
				</view>
				<view class="menu-item" @click="goTo('/pages/settings/about')">
					<text class="icon">ℹ️</text>
					<text class="label">关于我们</text>
					<text class="arrow">></text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			userInfo: {
				id: '123456',
				nickname: '用户昵称',
				avatar: '/static/default-avatar.png',
				bio: '这个人很懒，什么都没写',
				isVip: false,
				tasks: 12,
				chats: 8,
				followers: 56,
				following: 30,
				credit: 750,
				pendingTasks: 2
			}
		}
	},
	methods: {
		changeAvatar() {
			uni.chooseImage({
				count: 1,
				success: (res) => {
					this.userInfo.avatar = res.tempFilePaths[0];
				}
			});
		},
		editProfile() {
			uni.showToast({ title: '编辑资料', icon: 'none' });
		},
		goTo(url) {
			uni.navigateTo({ url });
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
}
.header {
	background-color: #07C160;
	text-align: center;
	padding: 30rpx;
}
.header .title {
	color: #fff;
	font-size: 34rpx;
	font-weight: bold;
}
.profile-card {
	background-color: #fff;
	padding: 40rpx 30rpx;
	display: flex;
	align-items: center;
}
.profile-card .avatar {
	width: 140rpx;
	height: 140rpx;
	border-radius: 16rpx;
	margin-right: 30rpx;
}
.profile-card .info {
	flex: 1;
}
.profile-card .name-row {
	display: flex;
	align-items: center;
	margin-bottom: 10rpx;
}
.profile-card .nickname {
	font-size: 36rpx;
	font-weight: bold;
}
.profile-card .vip-badge {
	background: linear-gradient(135deg, #FFD700, #FFA500);
	color: #fff;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	font-size: 20rpx;
	margin-left: 15rpx;
}
.profile-card .id {
	font-size: 26rpx;
	color: #999;
	display: block;
	margin-bottom: 10rpx;
}
.profile-card .bio {
	font-size: 26rpx;
	color: #666;
}
.profile-card .edit-btn {
	padding: 15rpx 30rpx;
	background-color: #f5f5f5;
	border-radius: 30rpx;
	font-size: 26rpx;
}
.stats-row {
	background-color: #fff;
	display: flex;
	padding: 40rpx 0;
	margin-top: 20rpx;
}
.stats-row .stat-item {
	flex: 1;
	text-align: center;
	display: flex;
	flex-direction: column;
}
.stats-row .num {
	font-size: 40rpx;
	font-weight: bold;
	margin-bottom: 10rpx;
}
.stats-row .label {
	font-size: 24rpx;
	color: #999;
}
.credit-card {
	background-color: #fff;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
}
.credit-card .credit-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}
.credit-card .title {
	font-size: 28rpx;
	font-weight: bold;
}
.credit-card .score {
	font-size: 40rpx;
	font-weight: bold;
	color: #07C160;
}
.credit-card .credit-bar {
	height: 16rpx;
	background-color: #f5f5f5;
	border-radius: 8rpx;
	overflow: hidden;
	margin-bottom: 15rpx;
}
.credit-card .bar {
	height: 100%;
	background: linear-gradient(90deg, #07C160, #06ad56);
	border-radius: 8rpx;
}
.credit-card .credit-tips {
	font-size: 24rpx;
	color: #999;
}
.menu-section {
	background-color: #fff;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
}
.menu-section .section-title {
	font-size: 28rpx;
	font-weight: bold;
	margin-bottom: 25rpx;
	display: block;
}
.menu-section .menu-grid {
	display: flex;
	flex-wrap: wrap;
}
.menu-section .menu-grid .menu-item {
	width: 25%;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 30rpx;
	position: relative;
}
.menu-section .menu-grid .icon {
	font-size: 48rpx;
	margin-bottom: 10rpx;
}
.menu-section .menu-grid .label {
	font-size: 24rpx;
	color: #666;
}
.menu-section .menu-grid .badge {
	position: absolute;
	top: -10rpx;
	right: 30rpx;
	background-color: #f43530;
	color: #fff;
	font-size: 20rpx;
	min-width: 32rpx;
	height: 32rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 8rpx;
}
.menu-section .menu-list {
	
}
.menu-section .menu-list .menu-item {
	display: flex;
	align-items: center;
	padding: 25rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}
.menu-section .menu-list .menu-item:last-child {
	border-bottom: none;
}
.menu-section .menu-list .icon {
	font-size: 40rpx;
	margin-right: 25rpx;
}
.menu-section .menu-list .label {
	flex: 1;
	font-size: 30rpx;
}
.menu-section .menu-list .arrow {
	color: #ccc;
}
</style>