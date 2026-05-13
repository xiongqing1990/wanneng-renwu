<template>
	<view class="container">
		<!-- 评分弹窗 -->
		<view class="rate-card" v-if="showRate">
			<view class="card-header">
				<text class="title">交易评价</text>
				<text class="close" @click="showRate = false">×</text>
			</view>
			
			<view class="user-info">
				<image class="avatar" :src="currentRate.user.avatar" mode="aspectFill"></image>
				<text class="name">{{ currentRate.user.name }}</text>
			</view>
			
			<!-- 评分 -->
			<view class="rating-section">
				<text class="label">服务评分</text>
				<view class="stars">
					<text 
						v-for="i in 5" 
						:key="i"
						class="star"
						:class="{ active: i <= currentRate.rating }"
						@click="currentRate.rating = i"
					>⭐</text>
				</view>
			</view>
			
			<!-- 标签 -->
			<view class="tags-section">
				<text class="label">评价标签</text>
				<view class="tags">
					<view 
						v-for="(tag, index) in tags" 
						:key="index"
						class="tag"
						:class="{ active: currentRate.tags.includes(tag) }"
						@click="toggleTag(tag)"
					>{{ tag }}</view>
				</view>
			</view>
			
			<!-- 评价内容 -->
			<view class="content-section">
				<textarea 
					v-model="currentRate.content" 
					placeholder="分享你的交易体验..."
					maxlength="200"
				/>
				<text class="count">{{ currentRate.content.length }}/200</text>
			</view>
			
			<button class="btn-submit" @click="submitRate">提交评价</button>
		</view>
		
		<!-- 我的评价 -->
		<view class="my-ratings">
			<view class="section-header">
				<text class="title">我的评价</text>
			</view>
			
			<view class="rating-summary">
				<view class="score">
					<text class="number">{{ ratingSummary.score }}</text>
					<view class="stars">
						<text v-for="i in 5" :key="i" class="star" :class="{ active: i <= ratingSummary.score }">⭐</text>
					</view>
				</view>
				<view class="counts">
					<view class="count-item">
						<text class="num">{{ ratingSummary.total }}</text>
						<text class="label">总评价</text>
					</view>
					<view class="count-item">
						<text class="num">{{ ratingSummary.good }}</text>
						<text class="label">好评</text>
					</view>
					<view class="count-item">
						<text class="num">{{ ratingSummary.bad }}</text>
						<text class="label">差评</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 全部评价 -->
		<view class="all-ratings">
			<view class="section-header">
				<text class="title">全部评价</text>
				<text class="filter">筛选</text>
			</view>
			
			<view class="rating-list">
				<view class="rating-item" v-for="(item, index) in ratings" :key="index">
					<image class="avatar" :src="item.avatar" mode="aspectFill"></image>
					<view class="content">
						<view class="header">
							<text class="name">{{ item.name }}</text>
							<text class="time">{{ item.time }}</text>
						</view>
						<view class="stars">
							<text v-for="i in 5" :key="i" class="star" :class="{ active: i <= item.rating }">⭐</text>
						</view>
						<view class="tags" v-if="item.tags && item.tags.length">
							<text class="tag" v-for="(tag, idx) in item.tags" :key="idx">{{ tag }}</text>
						</view>
						<text class="text">{{ item.content }}</text>
						<view class="task-info" v-if="item.task">
							<text class="label">评价任务：</text>
							<text class="task-title">{{ item.task }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			showRate: false,
			currentRate: {
				user: { avatar: '', name: '' },
				rating: 5,
				tags: [],
				content: ''
			},
			tags: ['服务好', '速度快', '态度好', '靠谱', '专业', '守时'],
			ratingSummary: {
				score: 4.8,
				total: 28,
				good: 26,
				bad: 0
			},
			ratings: [
				{
					avatar: '/static/avatar1.png',
					name: '小明',
					time: '2024-05-01',
					rating: 5,
					tags: ['服务好', '速度快'],
					content: '非常靠谱，票很快就买好了！',
					task: '求电影票2张'
				},
				{
					avatar: '/static/avatar2.png',
					name: '大王',
					time: '2024-04-28',
					rating: 5,
					tags: ['靠谱', '态度好'],
					content: '人很好，讲解很专业！',
					task: '景点讲解服务'
				},
				{
					avatar: '/static/avatar3.png',
					name: '小红',
					time: '2024-04-25',
					rating: 4,
					tags: ['守时'],
					content: '按时交付，整体不错',
					task: '代取快递'
				}
			]
		}
	},
	onLoad() {
		// 模拟进入评分页面
		// 如果有未评价的任务，弹出评分弹窗
	},
	methods: {
		toggleTag(tag) {
			const index = this.currentRate.tags.indexOf(tag);
			if (index > -1) {
				this.currentRate.tags.splice(index, 1);
			} else {
				if (this.currentRate.tags.length < 3) {
					this.currentRate.tags.push(tag);
				}
			}
		},
		submitRate() {
			uni.showLoading({ title: '提交中...' });
			setTimeout(() => {
				uni.hideLoading();
				uni.showToast({ title: '评价成功', icon: 'success' });
				this.showRate = false;
			}, 1000);
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
}
.rate-card {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	border-radius: 30rpx 30rpx 0 0;
	padding: 40rpx;
	z-index: 100;
}
.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}
.card-header .title {
	font-size: 34rpx;
	font-weight: bold;
}
.card-header .close {
	font-size: 50rpx;
	color: #999;
}
.user-info {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 30rpx;
}
.user-info .avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	margin-right: 20rpx;
}
.user-info .name {
	font-size: 30rpx;
	font-weight: bold;
}
.rating-section, .tags-section, .content-section {
	margin-bottom: 30rpx;
}
.rating-section .label, .tags-section .label, .content-section .label {
	font-size: 28rpx;
	color: #666;
	display: block;
	margin-bottom: 15rpx;
}
.stars {
	display: flex;
	gap: 15rpx;
	justify-content: center;
}
.star {
	font-size: 50rpx;
	color: #ddd;
}
.star.active {
	color: #FFD700;
}
.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 15rpx;
}
.tags .tag {
	padding: 15rpx 25rpx;
	background-color: #f5f5f5;
	border-radius: 30rpx;
	font-size: 26rpx;
	color: #666;
}
.tags .tag.active {
	background-color: #07C160;
	color: #fff;
}
.content-section {
	position: relative;
}
.content-section textarea {
	width: 100%;
	height: 150rpx;
	padding: 20rpx;
	border: 1rpx solid #eee;
	border-radius: 15rpx;
	font-size: 28rpx;
}
.content-section .count {
	position: absolute;
	right: 20rpx;
	bottom: 20rpx;
	font-size: 24rpx;
	color: #999;
}
.btn-submit {
	background-color: #07C160;
	color: #fff;
	padding: 25rpx;
	border-radius: 50rpx;
	font-size: 30rpx;
}
.my-ratings {
	background-color: #fff;
	margin: 20rpx;
	border-radius: 20rpx;
	padding: 30rpx;
}
.section-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}
.section-header .title {
	font-size: 32rpx;
	font-weight: bold;
}
.rating-summary {
	display: flex;
	align-items: center;
}
.rating-summary .score {
	text-align: center;
	margin-right: 60rpx;
}
.rating-summary .score .number {
	font-size: 60rpx;
	font-weight: bold;
	color: #FFD700;
}
.rating-summary .stars {
	justify-content: center;
}
.rating-summary .stars .star {
	font-size: 30rpx;
}
.rating-summary .counts {
	display: flex;
	gap: 40rpx;
}
.rating-summary .counts .count-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}
.rating-summary .counts .num {
	font-size: 36rpx;
	font-weight: bold;
}
.rating-summary .counts .label {
	font-size: 24rpx;
	color: #999;
}
.all-ratings {
	background-color: #fff;
	margin: 20rpx;
	border-radius: 20rpx;
	padding: 30rpx;
}
.filter {
	font-size: 26rpx;
	color: #07C160;
}
.rating-list {
	
}
.rating-item {
	display: flex;
	padding: 25rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}
.rating-item:last-child {
	border-bottom: none;
}
.rating-item .avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	margin-right: 20rpx;
}
.rating-item .content {
	flex: 1;
}
.rating-item .header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 10rpx;
}
.rating-item .name {
	font-size: 28rpx;
	font-weight: bold;
}
.rating-item .time {
	font-size: 24rpx;
	color: #999;
}
.rating-item .stars {
	justify-content: flex-start;
	margin-bottom: 10rpx;
}
.rating-item .stars .star {
	font-size: 24rpx;
}
.rating-item .tags {
	display: flex;
	gap: 10rpx;
	margin-bottom: 10rpx;
}
.rating-item .tags .tag {
	padding: 5rpx 15rpx;
	background-color: #f0fdf4;
	color: #07C160;
	border-radius: 20rpx;
	font-size: 22rpx;
}
.rating-item .text {
	font-size: 28rpx;
	color: #666;
	display: block;
	margin-bottom: 10rpx;
}
.rating-item .task-info {
	font-size: 24rpx;
	color: #999;
}
.rating-item .task-info .label {
	
}
.rating-item .task-info .task-title {
	color: #07C160;
}
</style>