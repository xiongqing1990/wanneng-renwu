<template>
	<view class="container">
		<view class="header">
			<text class="title">我的任务</text>
		</view>
		
		<!-- 任务筛选 -->
		<view class="tabs">
			<view 
				v-for="(tab, index) in tabs" 
				:key="index"
				:class="['tab-item', currentTab === index ? 'active' : '']"
				@click="currentTab = index"
			>
				{{ tab }}
			</view>
		</view>
		
		<!-- 任务列表 -->
		<scroll-view scroll-y class="task-list">
			<view v-if="currentTab === 0" class="task-section">
				<view class="section-title">进行中 (2)</view>
				
				<view class="task-card" v-for="(task, index) in publishingTasks" :key="index" @click="goToDetail(task)">
					<view class="task-header">
						<text class="status">进行中</text>
						<text class="time">{{ task.time }}</text>
					</view>
					<view class="task-title">{{ task.title }}</view>
					<view class="task-info">
						<text class="budget">💰 ¥{{ task.budget }}</text>
						<text class="bids">{{ task.bids }}人接单</text>
					</view>
					<view class="task-actions">
						<button class="btn btn-secondary" @click.stop="editTask(task)">编辑</button>
						<button class="btn btn-primary" @click.stop="deleteTask(task)">删除</button>
					</view>
				</view>
			</view>
			
			<view v-if="currentTab === 1" class="task-section">
				<view class="section-title">已接任务 (3)</view>
				
				<view class="task-card" v-for="(task, index) in acceptedTasks" :key="index" @click="goToDetail(task)">
					<view class="task-header">
						<text class="status">进行中</text>
						<text class="time">{{ task.time }}</text>
					</view>
					<view class="task-title">{{ task.title }}</view>
					<view class="task-info">
						<text class="budget">💰 ¥{{ task.budget }}</text>
						<text class="deadline">截止: {{ task.deadline }}</text>
					</view>
					<view class="task-actions">
						<button class="btn btn-primary" @click.stop="completeTask(task)">完成</button>
					</view>
				</view>
			</view>
			
			<view v-if="currentTab === 2" class="task-section">
				<view class="section-title">已完成 (5)</view>
				
				<view class="task-card completed" v-for="(task, index) in completedTasks" :key="index" @click="goToDetail(task)">
					<view class="task-header">
						<text class="status done">已完成</text>
						<text class="time">{{ task.time }}</text>
					</view>
					<view class="task-title">{{ task.title }}</view>
					<view class="task-info">
						<text class="budget">💰 ¥{{ task.budget }}</text>
						<text class="rating" v-if="task.rating">⭐ {{ task.rating }}</text>
					</view>
				</view>
			</view>
		</scroll-view>
		
		<!-- 空状态 -->
		<view class="empty" v-if="getCurrentTasks().length === 0">
			<text class="icon">📋</text>
			<text class="text">暂无任务</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			currentTab: 0,
			tabs: ['我发布的', '我接的', '已完成'],
			publishingTasks: [
				{ id: 1, title: '求5月15日电影票2张', budget: 30, bids: 3, time: '2小时前' },
				{ id: 2, title: '代购奶茶一杯', budget: 15, bids: 1, time: '5小时前' }
			],
			acceptedTasks: [
				{ id: 3, title: '帮忙取快递', budget: 5, time: '1小时前', deadline: '今天18:00' },
				{ id: 4, title: '代送文件到市中心', budget: 20, time: '3小时前', deadline: '今天20:00' },
				{ id: 5, title: '帮忙遛狗1小时', budget: 30, time: '昨天', deadline: '明天10:00' }
			],
			completedTasks: [
				{ id: 6, title: '代买早餐', budget: 10, time: '3天前', rating: 5 },
				{ id: 7, title: '帮忙打印资料', budget: 5, time: '5天前', rating: 5 },
				{ id: 8, title: '代取外卖', budget: 3, time: '1周前', rating: 4 },
				{ id: 9, title: '帮忙买水', budget: 2, time: '1周前', rating: 5 },
				{ id: 10, title: '代送钥匙', budget: 10, time: '2周前', rating: 5 }
			]
		}
	},
	methods: {
		getCurrentTasks() {
			if (this.currentTab === 0) return this.publishingTasks;
			if (this.currentTab === 1) return this.acceptedTasks;
			return this.completedTasks;
		},
		goToDetail(task) {
			uni.navigateTo({ url: `/pages/detail/detail?id=${task.id}` });
		},
		editTask(task) {
			uni.navigateTo({ url: `/pages/publish/publish?edit=1&id=${task.id}` });
		},
		deleteTask(task) {
			uni.showModal({
				title: '确认删除',
				content: '确定要删除这个任务吗？',
				success: (res) => {
					if (res.confirm) {
						uni.showToast({ title: '删除成功', icon: 'success' });
					}
				}
			});
		},
		completeTask(task) {
			uni.showModal({
				title: '确认完成',
				content: '确认任务已完成吗？',
				success: (res) => {
					if (res.confirm) {
						uni.showToast({ title: '任务已完成', icon: 'success' });
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
.tabs {
	background-color: #fff;
	display: flex;
	border-bottom: 1rpx solid #e0e0e0;
}
.tabs .tab-item {
	flex: 1;
	text-align: center;
	padding: 25rpx 0;
	font-size: 28rpx;
	color: #666;
	position: relative;
}
.tabs .tab-item.active {
	color: #07C160;
	font-weight: bold;
}
.tabs .tab-item.active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 60rpx;
	height: 4rpx;
	background-color: #07C160;
}
.task-list {
	height: calc(100vh - 200rpx);
	padding: 20rpx;
}
.task-section {
	
}
.task-section .section-title {
	font-size: 28rpx;
	color: #999;
	margin-bottom: 20rpx;
}
.task-card {
	background-color: #fff;
	border-radius: 16rpx;
	padding: 25rpx;
	margin-bottom: 20rpx;
}
.task-card.completed {
	opacity: 0.7;
}
.task-card .task-header {
	display: flex;
	justify-content: space-between;
	margin-bottom: 15rpx;
}
.task-card .status {
	font-size: 24rpx;
	color: #07C160;
	background-color: #e8f5e9;
	padding: 5rpx 15rpx;
	border-radius: 8rpx;
}
.task-card .status.done {
	color: #999;
	background-color: #f5f5f5;
}
.task-card .time {
	font-size: 24rpx;
	color: #999;
}
.task-card .task-title {
	font-size: 30rpx;
	font-weight: bold;
	margin-bottom: 15rpx;
}
.task-card .task-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}
.task-card .budget {
	font-size: 28rpx;
	color: #07C160;
	font-weight: bold;
}
.task-card .bids, .task-card .deadline {
	font-size: 24rpx;
	color: #999;
}
.task-card .rating {
	font-size: 24rpx;
	color: #FFD700;
}
.task-card .task-actions {
	display: flex;
	justify-content: flex-end;
	gap: 20rpx;
}
.task-card .btn {
	font-size: 26rpx;
	padding: 15rpx 30rpx;
	border-radius: 30rpx;
}
.task-card .btn-primary {
	background-color: #07C160;
	color: #fff;
}
.task-card .btn-secondary {
	background-color: #f5f5f5;
	color: #666;
}
.empty {
	text-align: center;
	padding: 100rpx 0;
}
.empty .icon {
	font-size: 100rpx;
	display: block;
	margin-bottom: 20rpx;
}
.empty .text {
	font-size: 28rpx;
	color: #999;
}
</style>