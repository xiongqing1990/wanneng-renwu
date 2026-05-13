<template>
	<view class="container">
		<!-- 顶部搜索栏 -->
		<view class="header">
			<view class="search-box">
				<text class="icon">🔍</text>
				<input type="text" v-model="keyword" placeholder="搜索任务、服务..." @confirm="handleSearch" />
				<text class="clear" v-if="keyword" @click="clearSearch">×</text>
			</view>
		</view>
		
		<!-- 分类标签 -->
		<scroll-view scroll-x class="category-bar">
			<view 
				v-for="(cat, index) in categories" 
				:key="index"
				:class="['cat-tag', currentCategory === cat.id ? 'active' : '']"
				@click="changeCategory(cat.id)"
			>
				{{ cat.name }}
			</view>
		</scroll-view>
		
		<!-- 任务列表 -->
		<scroll-view 
			scroll-y 
			class="task-list"
			@scrolltolower="loadMore"
			refresher-enabled
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
			refresher-background="#f5f5f5"
		>
			<!-- 加载动画 -->
			<view class="loading-top" v-if="isRefreshing">
				<view class="loading-spinner"></view>
				<text>刷新中...</text>
			</view>
			
			<!-- 任务卡片 -->
			<view class="task-card" v-for="(task, idx) in tasks" :key="task.id" @click="goToDetail(task)">
				<view class="card-badge" v-if="task.isNew">新</view>
				<image v-if="task.cover" :src="task.cover" mode="aspectFill" class="cover"></image>
				<view class="info">
					<text class="title">{{ task.title }}</text>
					<text class="desc">{{ task.description }}</text>
					<view class="bottom">
						<view class="budget-row">
							<text class="budget-label">预算</text>
							<text class="budget">¥{{ task.budget }}</text>
						</view>
						<view class="user">
							<image :src="task.avatar" class="avatar"></image>
							<text class="name">{{ task.nickname }}</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty" v-if="tasks.length === 0 && !isLoading">
				<view class="empty-illustration">
					<text class="empty-icon">📭</text>
				</view>
				<text class="empty-text">暂无相关任务</text>
				<text class="empty-tip">换个分类试试吧</text>
				<view class="empty-action" @click="resetCategory">查看全部</view>
			</view>
			
			<!-- 加载状态 -->
			<view class="loading-bottom" v-if="isLoading">
				<view class="loading-dots">
					<view class="dot"></view>
					<view class="dot"></view>
					<view class="dot"></view>
				</view>
				<text>加载中...</text>
			</view>
			
			<view class="no-more" v-if="noMore && tasks.length > 0">
				<view class="divider-line"></view>
				<text>— 没有更多了 —</text>
				<view class="divider-line"></view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			keyword: '',
			currentCategory: 'all',
			isRefreshing: false,
			isLoading: false,
			noMore: false,
			page: 1,
			categories: [
				{ id: 'all', name: '全部' },
				{ id: 'ticket', name: '票券' },
				{ id: 'dining', name: '餐饮优惠' },
				{ id: 'secondhand', name: '二手' },
				{ id: 'life', name: '生活服务' },
				{ id: 'shopping', name: '代购' },
				{ id: 'transport', name: '跑腿' },
				{ id: 'other', name: '其他' },
				{ id: 'game', name: '游戏' }
			],
			tasks: []
		}
	},
	onLoad() {
		this.loadTasks();
	},
	onPullDownRefresh() {
		this.onRefresh();
	},
	methods: {
		loadTasks() {
			// 模拟数据
			const mockTasks = [
				{ id: 1, title: '求5月15日电影票2张', description: '3排5座，预算15元/张', budget: 30, nickname: '小明', avatar: '/static/avatar1.png', cover: '', isNew: true },
				{ id: 2, title: '出售游戏金币1000个', description: '诚心出售，100元', budget: 100, nickname: '大王', avatar: '/static/avatar2.png', cover: '', isNew: false },
				{ id: 3, title: '求XX餐厅5折券', description: '明天去吃饭，想买2张', budget: 80, nickname: '小红', avatar: '/static/avatar3.png', cover: '', isNew: true },
				{ id: 4, title: '帮忙取快递', description: '菜鸟驿站，送上门', budget: 5, nickname: '阿强', avatar: '/static/avatar4.png', cover: '', isNew: false },
				{ id: 5, title: '代买奶茶一杯', description: '喜茶，多冰少糖', budget: 15, nickname: '小李', avatar: '/static/avatar5.png', cover: '', isNew: false },
				{ id: 6, title: '求购二手自行车', description: '学生党预算有限', budget: 200, nickname: '小王', avatar: '/static/avatar6.png', cover: '', isNew: false }
			];
			
			this.tasks = mockTasks;
		},
		handleSearch() {
			if (!this.keyword.trim()) {
				uni.showToast({ title: '请输入搜索内容', icon: 'none' });
				return;
			}
			uni.showLoading({ title: '搜索中...' });
			setTimeout(() => {
				uni.hideLoading();
				this.loadTasks();
				uni.showToast({ title: '找到' + this.tasks.length + '个任务', icon: 'success' });
			}, 500);
		},
		clearSearch() {
			this.keyword = '';
			this.loadTasks();
		},
		changeCategory(id) {
			this.currentCategory = id;
			this.page = 1;
			this.noMore = false;
			this.loadTasks();
		},
		resetCategory() {
			this.currentCategory = 'all';
			this.loadTasks();
		},
		onRefresh() {
			this.isRefreshing = true;
			this.page = 1;
			this.noMore = false;
			setTimeout(() => {
				this.loadTasks();
				this.isRefreshing = false;
				uni.showToast({ title: '已刷新', icon: 'success', duration: 1000 });
			}, 1000);
		},
		loadMore() {
			if (this.isLoading || this.noMore) return;
			this.isLoading = true;
			this.page++;
			setTimeout(() => {
				this.isLoading = false;
				if (this.page > 3) {
					this.noMore = true;
				}
			}, 1000);
		},
		goToDetail(task) {
			uni.navigateTo({
				url: `/pages/detail/detail?id=${task.id}`
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
	background: linear-gradient(135deg, #07C160, #06AD56);
	padding: 20rpx 30rpx;
	padding-top: 60rpx;
}
.search-box {
	background-color: #fff;
	border-radius: 40rpx;
	padding: 18rpx 30rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}
.search-box .icon {
	font-size: 32rpx;
	margin-right: 15rpx;
}
.search-box input {
	flex: 1;
	font-size: 28rpx;
}
.search-box .clear {
	font-size: 40rpx;
	color: #999;
	margin-left: 15rpx;
	padding: 0 10rpx;
}
.category-bar {
	background-color: #fff;
	white-space: nowrap;
	padding: 20rpx 30rpx;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
.cat-tag {
	display: inline-block;
	padding: 12rpx 35rpx;
	margin-right: 20rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
	color: #666;
	background-color: #f5f5f5;
	transition: all 0.3s;
}
.cat-tag.active {
	background-color: #07C160;
	color: #fff;
	box-shadow: 0 4rpx 12rpx rgba(7,193,96,0.3);
}
.task-list {
	height: calc(100vh - 280rpx);
	padding: 20rpx;
}
.task-card {
	background-color: #fff;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
	position: relative;
	transition: transform 0.2s;
}
.task-card:active {
	transform: scale(0.98);
}
.card-badge {
	position: absolute;
	top: 20rpx;
	left: 20rpx;
	background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
	color: #fff;
	padding: 6rpx 20rpx;
	border-radius: 20rpx;
	font-size: 22rpx;
	font-weight: bold;
	z-index: 10;
	box-shadow: 0 4rpx 8rpx rgba(238,90,111,0.3);
}
.task-card .cover {
	width: 100%;
	height: 320rpx;
}
.task-card .info {
	padding: 25rpx;
}
.task-card .title {
	font-size: 30rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 12rpx;
	color: #1d1d1f;
}
.task-card .desc {
	font-size: 26rpx;
	color: #666;
	display: block;
	margin-bottom: 20rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.task-card .bottom {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.budget-row {
	display: flex;
	align-items: center;
	gap: 10rpx;
}
.budget-label {
	font-size: 22rpx;
	color: #999;
}
.budget {
	font-size: 34rpx;
	font-weight: bold;
	color: #07C160;
}
.task-card .user {
	display: flex;
	align-items: center;
}
.task-card .avatar {
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	margin-right: 10rpx;
}
.task-card .name {
	font-size: 24rpx;
	color: #999;
}
/* 加载动画 */
.loading-top {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx;
	gap: 15rpx;
	font-size: 24rpx;
	color: #07C160;
}
.loading-spinner {
	width: 40rpx;
	height: 40rpx;
	border: 4rpx solid #e5e5e5;
	border-top-color: #07C160;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}
@keyframes spin {
	to { transform: rotate(360deg); }
}
/* 底部加载 */
.loading-bottom {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 30rpx;
	gap: 15rpx;
	font-size: 24rpx;
	color: #999;
}
.loading-dots {
	display: flex;
	gap: 8rpx;
}
.loading-dots .dot {
	width: 12rpx;
	height: 12rpx;
	background-color: #07C160;
	border-radius: 50%;
	animation: bounce 1.4s infinite ease-in-out both;
}
.loading-dots .dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dots .dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce {
	0%, 80%, 100% { transform: scale(0); }
	40% { transform: scale(1.0); }
}
/* 空状态 */
.empty {
	text-align: center;
	padding: 100rpx 0;
}
.empty-illustration {
	margin-bottom: 30rpx;
}
.empty-icon {
	font-size: 120rpx;
}
.empty-text {
	font-size: 32rpx;
	color: #999;
	display: block;
	margin-bottom: 15rpx;
}
.empty-tip {
	font-size: 26rpx;
	color: #ccc;
	display: block;
	margin-bottom: 40rpx;
}
.empty-action {
	display: inline-block;
	padding: 15rpx 50rpx;
	background-color: #07C160;
	color: #fff;
	border-radius: 30rpx;
	font-size: 28rpx;
	box-shadow: 0 4rpx 12rpx rgba(7,193,96,0.3);
}
.empty-action:active {
	transform: scale(0.95);
}
/* 没有更多 */
.no-more {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 30rpx;
	gap: 20rpx;
	font-size: 24rpx;
	color: #ccc;
}
.divider-line {
	flex: 1;
	height: 1rpx;
	background-color: #e5e5e5;
}
</style>
