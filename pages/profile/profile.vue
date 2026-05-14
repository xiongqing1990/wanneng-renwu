<template>
	<view class="container">
		<view class="header">
			<text class="title">我的主页</text>
		</view>

		<!-- 用户信息卡片 -->
		<view class="profile-card">
			<view class="avatar-wrapper" @click="changeAvatar">
				<image class="avatar" :src="userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill"></image>
				<view class="avatar-edit"><text>📷</text></view>
				<!-- 等级角标 -->
				<view class="level-corner" :style="{background: 'linear-gradient(135deg, '+ userLevel.color + ', '+ userLevel.color + 'cc)'}">
					<text>{{ userLevel.icon }}</text>
					<text>Lv.{{ userInfo.level }}</text>
				</view>
			</view>
			<view class="info">
				<view class="name-row">
					<text class="nickname">{{ userInfo.nickname }}</text>
					<view class="vip-badge" v-if="userInfo.isVip">VIP</view>
				</view>
				<text class="id">ID: {{ userInfo.id }}</text>
				<view class="bio">{{ userInfo.bio }}</view>
				
				<!-- 发布者评级标签 -->
				<view class="publisher-rating" v-if="publisherRating" :style="{color: publisherRating.color}">
					<text class="rating-icon">{{ publisherRating.icon }}</text>
					<text class="rating-name">{{ publisherRating.name }}</text>
				</view>
			</view>
			<text class="edit-btn" @click="editProfile">编辑</text>
		</view>

		<!-- 等级与积分卡片（新增） -->
		<view class="level-card">
			<view class="level-header">
				<view class="current-level">
					<text class="level-icon-lg">{{ userLevel.icon }}</text>
					<view class="level-info">
						<text class="level-name">{{ userLevel.name }}</text>
						<text class="level-range">Lv.{{ userInfo.level }} · {{ nextLevelText }}</text>
					</view>
				</view>
				<view class="points-box">
					<text class="points-num">{{ userInfo.points }}</text>
					<text class="points-label">积分</text>
				</view>
			</view>
			
			<!-- 升级进度条 -->
			<view class="progress-section">
				<view class="progress-bar">
					<view class="progress-fill" :style="{width: levelProgress + '%'}"></view>
				</view>
				<view class="progress-text">
					<text>距离 Lv.{{ userInfo.level + 1 }} 还差 <text class="highlight">{{ pointsToNextLevel }} 积分</text></text>
				</view>
			</view>

			<!-- 今日可获取积分 -->
			<view class="daily-points" v-if="todayEarnedPoints < 50">
				<text class="daily-label">🎯 今日还可获取</text>
				<text class="daily-num highlight">{{ 50 - todayEarnedPoints }}积分</text>
			</view>

			<!-- 等级权益预览 -->
			<view class="benefits-preview" @click="goToBenefits">
				<view class="benefit-item" v-for="(b, idx) in currentBenefits.slice(0,3)" :key="idx">
					<text class="benefit-icon">{{ b.icon }}</text>
					<text class="benefit-desc">{{ b.desc }}</text>
				</view>
				<text class="view-all">查看全部权益 ›</text>
			</view>
		</view>

		<!-- 统计数据 -->
		<view class="stats-row">
			<view class="stat-item" @click="goTo('/pages/profile/my-tasks')">
				<text class="num">{{ userInfo.tasks }}</text><text class="label">任务</text>
			</view>
			<view class="stat-item" @click="goTo('/pages/chat/chat')">
				<text class="num">{{ userInfo.chats }}</text><text class="label">聊天</text>
			</view>
			<view class="stat-item">
				<text class="num">{{ userInfo.followers }}</text><text class="label">粉丝</text>
			</view>
			<view class="stat-item">
				<text class="num">{{ userInfo.following }}</text><text class="label">关注</text>
			</view>
		</view>

		<!-- 信用分 -->
		<view class="credit-card">
			<view class="credit-header">
				<text class="title">信用分</text>
				<text class="score">{{ userInfo.credit }}</text>
			</view>
			<view class="credit-bar"><view class="bar" :style="{width: Math.min(userInfo.credit, 1000)/10 + '%'}"></view></view>
			<view class="credit-tips"><text>信用良好，交易更顺畅</text></view>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-section">
			<text class="section-title">我的服务</text>
			<view class="menu-grid">
				<view class="menu-item" @click="goTo('/pages/profile/my-tasks')">
					<text class="icon">📋</text><text class="label">我的任务</text>
					<view class="badge" v-if="userInfo.pendingTasks">{{ userInfo.pendingTasks }}</view>
				</view>
				<view class="menu-item" @click="goTo('/pages/rate/rate')">
					<text class="icon">⭐</text><text class="label">评价</text>
				</view>
				<view class="menu-item" @click="goTo('/pages/deposit/deposit')">
					<text class="icon">🔒</text><text class="label">保证金</text>
				</view>
				<view class="menu-item" @click="goTo('/pages/auth/auth')">
					<text class="icon">✅</text><text class="label">实名</text>
				</view>
				<!-- 新增：等级中心 / 广告中心 -->
				<view class="menu-item new-feature" @click="goToBenefits">
					<text class="icon">🏆</text><text class="label">等级中心</text>
					<view class="new-dot"></view>
				</view>
				<view class="menu-item new-feature" @click="goToAdCenter">
					<text class="icon">📢</text><text class="label">广告中心</text>
				</view>
			</view>
		</view>

		<view class="menu-section">
			<text class="section-title">其他</text>
			<view class="menu-list">
				<view class="menu-item" @click="goTo('/pages/settings/settings')"><text class="icon">⚙️</text><text class="label">设置</text><text class="arrow">></text></view>
				<view class="menu-item" @click="goTo('/pages/settings/help')"><text class="icon">❓</text><text class="label">帮助反馈</text><text class="arrow">></text></view>
				<view class="menu-item" @click="goTo('/pages/settings/about')"><text class="icon">ℹ️</text><text class="label">关于我们</text><text class="arrow">></text></view>
			</view>
		</view>
	</view>
</template>

<script>
import { USER_LEVELS, PUBLISHER_RATINGS, LEVEL_BENEFITS } from '@/utils/level-system.js'

export default {
	data() {
		return {
			userInfo: {
				id: '123456',
				nickname: '用户昵称',
				avatar: '',
				bio: '这个人很懒，什么都没写',
				isVip: false,
				level: 2,
				points: 150,
				tasks: 12,
				chats: 8,
				followers: 56,
				following: 30,
				credit: 720,
				pendingTasks: 2
			},
			todayEarnedPoints: 15
		}
	},
	computed: {
		userLevel() { return USER_LEVELS[this.userInfo.level] || USER_LEVELS[1]; },
		publisherRating() {
			for (let i = PUBLISHER_RATINGS.length - 1; i >= 0; i--) {
				if (this.userInfo.credit >= PUBLISHER_RATINGS[i].minCredit) return PUBLISHER_RATINGS[i]
			}
			return null
		},
		currentBenefits() { return LEVEL_BENEFITS[this.userInfo.level] || []; },
		levelProgress() {
			const lv = USER_LEVELS[this.userInfo.level]
			if (!lv || lv.maxPoints === Infinity) return 100
			const range = lv.maxPoints - lv.minPoints
			return ((this.userInfo.points - lv.minPoints) / range) * 100
		},
		pointsToNextLevel() {
			const nextLv = USER_LEVELS[this.userInfo.level + 1]
			if (!nextLv) return 0
			return nextLv.minPoints - this.userInfo.points
		},
		nextLevelText() {
			const nextLv = USER_LEVELS[this.userInfo.level + 1]
			return nextLv ? `下一级: ${nextLv.name}` : '已满级'
		}
	},
	methods: {
		changeAvatar() {
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				sourceType: ['album', 'camera'],
				success: (res) => {
					this.userInfo.avatar = res.tempFilePaths[0]
					uni.showToast({ title: '头像已更新', icon: 'success' })
					// TODO: 上传到服务器
				}
			})
		},
		editProfile() {
			// TODO: 跳转编辑资料页
			uni.showModal({
				title: '编辑资料',
				content: '是否修改昵称和简介？',
				success: (res) => {
					if (res.confirm) uni.showModal({ title: '开发中...', showCancel: false })
				}
			})
		},
		goTo(url) { uni.navigateTo({ url }) },
		goToBenefits() {
			uni.showModal({ title: '🏆 等级中心', content: '等级中心页面开发中\n包含完整等级说明、权益列表、升级攻略等', showCancel: false, confirmText: '知道了' })
		},
		goToAdCenter() {
			uni.showModal({ title: '📢 广告中心', content: '广告中心开发中\n购买广告位提升曝光量', showCancel: false, confirmText: '知道了' })
		}
	}
}
</script>

<style>
.container { min-height: 100vh; background-color: #f5f5f5; }
.header { background-color: #07C160; text-align: center; padding: 30rpx; }
.header .title { color: #fff; font-size: 34rpx; font-weight: bold; }

.profile-card { background-color: #fff; padding: 40rpx 30rpx; display: flex; align-items: center; }
.avatar-wrapper { position: relative; margin-right: 30rpx; flex-shrink: 0; }
.avatar-wrapper .avatar {
	width: 140rpx; height: 140rpx; border-radius: 16rpx;
	border: 4rpx solid #07C160;
}
.avatar-edit {
	position: absolute; bottom: -6rpx; right: -6rpx;
	width: 44rpx; height: 44rpx;
	background-color: #07C160; color: #fff;
	border-radius: 50%; display: flex; align-items: center; justify-content: center;
	font-size: 24rpx; border: 3rpx solid #fff;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15);
}
/* 等级角标 */
.level-corner {
	position: absolute; top: -10rpx; left: -10rpx;
	padding: 4rpx 14rpx; border-radius: 10rpx 10rpx 0 16rpx;
	display: flex; align-items: center; gap: 4rpx;
	color: #fff; font-size: 20rpx; font-weight: bold;
	z-index: 5;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2);
}
.profile-card .info { flex: 1; }
.profile-card .name-row { display: flex; align-items: center; margin-bottom: 10rpx; }
.profile-card .nickname { font-size: 36rpx; font-weight: bold; }
.vip-badge { background: linear-gradient(135deg, #FFD700, #FFA500); color: #fff; padding: 4rpx 12rpx; border-radius: 8rpx; font-size: 20rpx; margin-left: 15rpx; }
.profile-card .id { font-size: 26rpx; color: #999; display: block; margin-bottom: 10rpx; }
.profile-card .bio { font-size: 26rpx; color: #666; }
/* 发布者评级 */
.publisher-rating { display: inline-flex; align-items: center; gap: 6rpx; margin-top: 8rpx; padding: 6rpx 14rpx; border-radius: 10rpx; background-color: rgba(0,0,0,0.03); font-size: 22rpx; font-weight: 500; }
.rating-icon { font-size: 24rpx; }
.rating-name { font-weight: bold; }
.profile-card .edit-btn { padding: 15rpx 30rpx; background-color: #f5f5f5; border-radius: 30rpx; font-size: 26rpx; }

/* ====== 等级与积分卡片 ====== */
.level-card { background-color: #fff; margin: 20rpx; padding: 32rpx; border-radius: 20rpx; box-shadow: 0 4rpx 20rpx rgba(7,193,96,0.08); border-left: 8rpx solid #07C160; }
.level-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.current-level { display: flex; align-items: center; gap: 16rpx; }
.level-icon-lg { font-size: 56rpx; line-height: 1; }
.level-info {}
.level-name { font-size: 34rpx; font-weight: bold; color: #1d1d1f; display: block; }
.level-range { font-size: 24rpx; color: #999; margin-top: 4rpx; }
.points-box { text-align: right; }
.points-num { font-size: 48rpx; font-weight: bold; color: #07C160; display: block; line-height: 1.2; }
.points-label { font-size: 22rpx; color: #999; }

.progress-section { margin-bottom: 20rpx; }
.progress-bar { height: 18rpx; background-color: #e8e8e8; border-radius: 9rpx; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #07C160, #06AD56); border-radius: 9rpx; transition: width 0.5s ease; }
.progress-text { text-align: right; font-size: 24rpx; color: #999; margin-top: 8rpx; }
.highlight { color: #07C160; font-weight: bold; }

.daily-points { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 20rpx; background-color: #e8f5e9; border-radius: 12rpx; margin-bottom: 20rpx; }
.daily-label { font-size: 24rpx; color: #333; }
.daily-num { font-size: 28rpx; font-weight: bold; }

.benefits-preview { background-color: #fafafa; border-radius: 14rpx; padding: 20rpx; }
.benefit-item { display: flex; align-items: center; gap: 12rpx; padding: 10rpx 0; }
.benefit-icon { font-size: 28rpx; }
.benefit-desc { font-size: 24rpx; color: #555; }
.view-all { display: block; text-align: center; color: #07C160; font-size: 26rpx; font-weight: 500; padding-top: 12rpx; border-top: 1rpx solid #eee; margin-top: 8rpx; }

.stats-row { background-color: #fff; display: flex; padding: 40rpx 0; }
.stat-item { flex: 1; text-align: center; display: flex; flex-direction: column; }
.num { font-size: 40rpx; font-weight: bold; margin-bottom: 10rpx; }
.label { font-size: 24rpx; color: #999; }

.credit-card { background-color: #fff; margin: 20rpx; padding: 30rpx; border-radius: 16rpx; }
.credit-card .credit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.credit-card .title { font-size: 28rpx; font-weight: bold; }
.credit-card .score { font-size: 40rpx; font-weight: bold; color: #07C160; }
.credit-bar { height: 16rpx; background-color: #f5f5f5; border-radius: 8rpx; overflow: hidden; margin-bottom: 15rpx; }
.credit-bar .bar { height: 100%; background: linear-gradient(90deg, #07C160, #06ad56); border-radius: 8rpx; }
.credit-tips { font-size: 24rpx; color: #999; }

.menu-section { background-color: #fff; margin: 20rpx; padding: 30rpx; border-radius: 16rpx; }
.section-title { font-size: 28rpx; font-weight: bold; margin-bottom: 25rpx; display: block; }
.menu-grid { display: flex; flex-wrap: wrap; }
.menu-grid .menu-item { width: 25%; display: flex; flex-direction: column; align-items: center; margin-bottom: 30rpx; position: relative; }
.menu-grid .icon { font-size: 48rpx; margin-bottom: 10rpx; }
.menu-grid .label { font-size: 24rpx; color: #666; }
.menu-grid .badge { position: absolute; top: -10rpx; right: 30rpx; background-color: #f43530; color: #fff; font-size: 20rpx; min-width: 32rpx; height: 32rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; padding: 0 8rpx; }
.new-dot { position: absolute; top: 0; right: 25rpx; width: 14rpx; height: 14rpx; background-color: #f00; border-radius: 50%; }
.menu-list {}
.menu-list .menu-item { display: flex; align-items: center; padding: 25rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.menu-list .menu-item:last-child { border-bottom: none; }
.menu-list .icon { font-size: 40rpx; margin-right: 25rpx; }
.menu-list .label { flex: 1; font-size: 30rpx; }
.arrow { color: #ccc; }
</style>
