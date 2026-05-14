<template>
	<view class="container">
		<!-- 顶部搜索栏 -->
		<view class="header">
			<view class="search-box">
				<text class="icon">🔍</text>
				<input type="text" v-model="keyword" placeholder="搜索任务、服务..." @confirm="handleSearch" />
				<text class="clear" v-if="keyword" @click="clearSearch">×</text>
			</view>
			<!-- 广告位入口 -->
			<view class="ad-entry" @click="goToAdCenter">
				<text class="ad-icon">📢</text>
			</view>
		</view>

		<!-- 分类标签 + 任务类型切换 -->
		<scroll-view scroll-x class="category-bar">
			<view 
				v-for="(cat, index) in categories" 
				:key="index"
				:class="['cat-tag', currentCategory === cat.id ? 'active' : '']"
				@click="changeCategory(cat.id)"
			>{{ cat.name }}</view>
			<view class="type-switcher">
				<text :class="['type-btn', taskType === 'short' ? 'active' : '']" @click="switchTaskType('short')">⚡短期</text>
				<text :class="['type-btn', taskType === 'long' ? 'active' : '']" @click="switchTaskType('long')">📅长期</text>
				<text :class="['type-btn', taskType === 'all' ? 'active' : '']" @click="switchTaskType('all')">全部</text>
			</view>
		</scroll-view>

		<!-- 排序选项 -->
		<view class="sort-bar">
			<text 
				v-for="(s, idx) in sortOptions" 
				:key="idx"
				:class="['sort-tag', currentSort === s.id ? 'active' : '']"
				@click="changeSort(s.id)"
			><text v-if="s.icon" class="sort-icon">{{ s.icon }}</text>{{ s.name }}</text>
		</view>

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

			<!-- ====== 广告位任务（置顶）====== -->
			<view class="task-card ad-card" v-for="(task, idx) in adTasks" :key="'ad-'+task.id" @click="goToDetail(task)">
				<view class="ad-badge" :class="'level-' + (task.adLevel || 1)">
					<text class="ad-label">{{ getAdBadge(task.adLevel).label }}</text>
					<text class="ad-icon">{{ getAdBadge(task.adLevel).icon }}</text>
				</view>
				<image v-if="task.cover" :src="task.cover" mode="aspectFill" class="cover"></image>
				<view class="info">
					<!-- 发布者信息：头像+等级+评级 -->
					<view class="publisher-row">
						<image class="avatar" :src="task.avatar || '/static/default-avatar.png'" mode="aspectFill" @click.stop="viewUser(task)"></image>
						<view class="publisher-info">
							<view class="name-line">
								<text class="nickname">{{ task.nickname }}</text>
								<view class="level-badge" :style="{backgroundColor: getUserLevel(task.userLevel).color}">
									<text>{{ getUserLevel(task.userLevel).icon }}</text>
									<text>Lv.{{ task.userLevel }}</text>
								</view>
								<view class="rating-badge" :style="{color: getPublisherRating(task.credit).color}" v-if="task.credit >= 650">
									<text>{{ getPublisherRating(task.credit).icon }}</text>
									<text>{{ getPublisherRating(task.credit).name }}</text>
								</view>
							</view>
						</view>
					</view>
					<text class="title">{{ task.title }}</text>
					<text class="desc">{{ task.description }}</text>
					<view class="bottom">
						<view class="budget-row">
							<text class="budget-label">预算</text>
							<text class="budget">¥{{ task.budget }}</text>
						</view>
						<view class="meta-tags">
							<text class="tag-type" :class="task.taskType">{{ task.taskType === 'short' ? '⚡短期' : '📅长期' }}</text>
							<text class="tag-bids">👥{{ task.bids || 0 }}人接取</text>
						</view>
					</view>
				</view>
			</view>

			<!-- ====== 普通任务列表（按信用/等级排序）====== -->
			<view class="task-card" v-for="(task, idx) in normalTasks" :key="task.id" @click="goToDetail(task)">
				<view class="card-badge" v-if="task.isNew">新</view>
				<image v-if="task.cover" :src="task.cover" mode="aspectFill" class="cover"></image>
				<view class="info">
					<!-- 发布者信息行 -->
					<view class="publisher-row">
						<image class="avatar" :src="task.avatar || '/static/default-avatar.png'" mode="aspectFill" @click.stop="viewUser(task)"></image>
						<view class="publisher-info">
							<view class="name-line">
								<text class="nickname">{{ task.nickname }}</text>
								<view class="level-badge" :style="{backgroundColor: getUserLevel(task.userLevel).color}">
									<text>{{ getUserLevel(task.userLevel).icon }}</text>
									<text>Lv.{{ task.userLevel || 1 }}</text>
								</view>
								<view class="rating-badge small" v-if="task.credit >= 650">
									<text>{{ getPublisherRating(task.credit).icon }}</text>
								</view>
							</view>
						</view>
					</view>
					<text class="title">{{ task.title }}</text>
					<text class="desc">{{ task.description }}</text>
					<view class="bottom">
						<view class="budget-row">
							<text class="budget-label">预算</text>
							<text class="budget">¥{{ task.budget }}</text>
						</view>
						<view class="meta-tags">
							<text class="tag-type" :class="task.taskType">{{ task.taskType === 'short' ? '⚡短期' : '📅长期' }}</text>
							<text class="tag-bids">👥{{ task.bids || 0 }}人接取</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 空状态 -->
			<view class="empty" v-if="displayedTasks.length === 0 && !isLoading">
				<view class="empty-illustration"><text class="empty-icon">📭</text></view>
				<text class="empty-text">暂无相关任务</text>
				<text class="empty-tip">换个分类试试吧</text>
				<view class="empty-action" @click="resetCategory">查看全部</view>
			</view>

			<!-- 加载状态 -->
			<view class="loading-bottom" v-if="isLoading">
				<view class="loading-dots"><view class="dot"></view><view class="dot"></view><view class="dot"></view></view>
				<text>加载中...</text>
			</view>

			<view class="no-more" v-if="noMore && displayedTasks.length > 0">
				<view class="divider-line"></view>
				<text>— 没有更多了 —</text>
				<view class="divider-line"></view>
			</view>
		</scroll-view>

		<!-- 底部快捷发布按钮 -->
		<view class="quick-publish-bar">
			<button class="btn-quick-publish" @click="goPublish">
				<text class="plus">+</text>
				<text class="label">发布任务</text>
			</button>
		</view>
	</view>
</template>

<script>
import { USER_LEVELS, PUBLISHER_RATINGS, AD_BADGE_LEVELS } from '@/utils/level-system.js'

export default {
	data() {
		return {
			keyword: '',
			currentCategory: 'all',
			taskType: 'all', // all | short | long
			currentSort: 'smart',
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
			sortOptions: [
				{ id: 'smart', name: '综合排序', icon: '' },
				{ id: 'credit', name: '信用优先', icon: '✓' },
				{ id: 'newest', name: '最新发布', icon: '🕐' },
				{ id: 'budget_high', name: '预算最高', icon: '💰' }
			],
			allTasks: []
		}
	},
	computed: {
		// 广告位任务（置顶显示）
		adTasks() { return this.displayedTasks.filter(t => t.isAd); },
		// 普通任务
		normalTasks() { return this.displayedTasks.filter(t => !t.isAd); },
		// 最终展示的任务列表
		displayedTasks() {
			let list = [...this.allTasks]
			
			// 分类过滤
			if (this.currentCategory !== 'all') {
				list = list.filter(t => t.category === this.currentCategory)
			}
			
			// 任务类型过滤
			if (this.taskType !== 'all') {
				list = list.filter(t => t.taskType === this.taskType)
			}
			
			// 关键词搜索
			if (this.keyword.trim()) {
				const kw = this.keyword.toLowerCase()
				list = list.filter(t => 
					t.title.toLowerCase().includes(kw) || 
					t.description.toLowerCase().includes(kw) ||
					t.nickname.includes(kw)
				)
			}

			// 排序
			list = this.sortTasks(list)

			return list
		}
	},
	onLoad() { this.loadTasks(); },
	onPullDownRefresh() { this.onRefresh(); },
	methods: {
		getUserLevel(lv) {
			return USER_LEVELS[lv] || USER_LEVELS[1]
		},
		getPublisherRating(credit) {
			for (let i = PUBLISHER_RATINGS.length - 1; i >= 0; i--) {
				if (credit >= PUBLISHER_RATINGS[i].minCredit) return PUBLISHER_RATINGS[i]
			}
			return PUBLISHER_RATINGS[0]
		},
		getAdBadge(level) {
			return AD_BADGE_LEVELS[(level || 1) - 1] || AD_BADGE_LEVELS[0]
		},
		
		loadTasks() {
			this.allTasks = [
				// ===== 广告位任务（模拟置顶）=====
				{
					id: 101, title: '【广告】急招代驾司机，日结200+', description: '长期合作，多劳多得，时间自由', budget: 200,
					nickname: '专业代驾', avatar: '', cover: '', isNew: false,
					userLevel: 6, credit: 920, isAd: true, adLevel: 4,
					category: 'life', taskType: 'long', bids: 15, isVerified: true, completedTasks: 120
				},
				{
					id: 102, title: '【推广】iPhone16 Pro Max 低价出', description: '全新未拆封，比官网便宜800元', budget: 7999,
					nickname: '数码达人王哥', avatar: '', cover: '', isNew: false,
					userLevel: 8, credit: 960, isAd: true, adLevel: 3,
					category: 'secondhand', taskType: 'short', bids: 3, isVerified: true, completedTasks: 89
				},
				
				// ===== 普通任务（按信用分排序）=====
				{
					id: 1, title: '求5月15日电影票2张', description: '3排5座，预算15元/张', budget: 30,
					nickname: '小明', avatar: '', cover: '', isNew: true,
					userLevel: 2, credit: 720, category: 'ticket', taskType: 'short', bids: 0, isVerified: true, completedTasks: 28
				},
				{
					id: 2, title: '出售游戏金币1000个', description: '诚心出售，100元', budget: 100,
					nickname: '大王', avatar: '', cover: '', isNew: false,
					userLevel: 4, credit: 850, category: 'game', taskType: 'short', bids: 2, isVerified: true, completedTasks: 56
				},
				{
					id: 3, title: '求XX餐厅5折券', description: '明天去吃饭，想买2张', budget: 80,
					nickname: '小红', avatar: '', cover: '', isNew: true,
					userLevel: 3, credit: 700, category: 'dining', taskType: 'short', bids: 1, isVerified: true, completedTasks: 12
				},
				{
					id: 4, title: '帮忙取快递（长期）', description: '菜鸟驿站代取，每单3-5元', budget: 5,
					nickname: '阿强', avatar: '', cover: '', isNew: false,
					userLevel: 5, credit: 900, category: 'transport', taskType: 'long', bids: 18, isVerified: true, completedTasks: 230
				},
				{
					id: 5, title: '代买奶茶一杯', description: '喜茶，多冰少糖', budget: 15,
					nickname: '小李', avatar: '', cover: '', isNew: false,
					userLevel: 1, credit: 550, category: 'shopping', taskType: 'short', bids: 0, isVerified: false, completedTasks: 2
				},
				{
					id: 6, title: '求购二手自行车', description: '学生党预算有限', budget: 200,
					nickname: '小王', avatar: '', cover: '', isNew: false,
					userLevel: 2, credit: 620, category: 'secondhand', taskType: 'short', bids: 1, isVerified: false, completedTasks: 5
				}
			]
		},

		sortTasks(list) {
			switch(this.currentSort) {
				case 'smart':
					// 综合排序：广告 > 信用分 > 时间
					return list.sort((a, b) => {
						if (a.isAd && !b.isAd) return -1
						if (!a.isAd && b.isAd) return 1
						if (b.credit !== a.credit) return b.credit - a.credit
						return b.id - a.id
					})
				case 'credit':
					return list.sort((a, b) => b.credit - a.credit)
				case 'newest':
					return list.sort((a, b) => b.id - a.id)
				case 'budget_high':
					return list.sort((a, b) => b.budget - a.budget)
				default:
					return list
			}
		},

		handleSearch() {
			if (!this.keyword.trim()) return uni.showToast({ title: '请输入内容', icon: 'none' })
			uni.showLoading({ title: '搜索中...' })
			setTimeout(() => { uni.hideLoading() }, 300)
		},
		clearSearch() { this.keyword = ''; },
		changeCategory(id) { this.currentCategory = id; this.page = 1; this.noMore = false; },
		switchTaskType(type) { this.taskType = type; },
		changeSort(id) { this.currentSort = id; },
		resetCategory() { this.currentCategory = 'all'; this.taskType = 'all'; },

		onRefresh() {
			this.isRefreshing = true
			setTimeout(() => {
				this.loadTasks()
				this.isRefreshing = false
				uni.showToast({ title: '已刷新', icon: 'success', duration: 1000 })
			}, 1000)
		},

		loadMore() {
			if (this.isLoading || this.noMore) return
			this.isLoading = true
			this.page++
			setTimeout(() => {
				this.isLoading = false
				if (this.page > 3) this.noMore = true
			}, 1000)
		},

		goToDetail(task) {
			uni.navigateTo({ url: `/pages/detail/detail?id=${task.id}` })
		},
		goPublish() {
			uni.navigateTo({ url: '/pages/publish/publish' })
		},
		goToAdCenter() {
			uni.showToast({ title: '广告中心开发中', icon: 'none' })
		},
		viewUser(task) {
			uni.showToast({ title: `查看${task.nickname}资料`, icon: 'none' })
		}
	}
}
</script>

<style>
.container { min-height: 100vh; background-color: #f5f5f5; padding-bottom: 120rpx; }

/* 顶部 */
.header {
	background: linear-gradient(135deg, #07C160, #06AD56);
	padding: 20rpx 30rpx;
	padding-top: 60rpx;
	display: flex;
	align-items: center;
	gap: 15rpx;
}
.search-box {
	flex: 1;
	background-color: #fff;
	border-radius: 40rpx;
	padding: 18rpx 30rpx;
	display: flex;
	align-items: center;
	box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}
.search-box .icon { font-size: 32rpx; margin-right: 15rpx; }
.search-box input { flex: 1; font-size: 28rpx; }
.search-box .clear { font-size: 40rpx; color: #999; margin-left: 15rpx; }
.ad-entry {
	width: 70rpx; height: 70rpx;
	background-color: rgba(255,255,255,0.25);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}
.ad-entry .ad-icon { font-size: 34rpx; }

/* 分类栏 */
.category-bar {
	background-color: #fff;
	white-space: nowrap;
	padding: 20rpx 30rpx;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	display: flex;
	align-items: center;
}
.cat-tag {
	display: inline-block;
	padding: 12rpx 35rpx;
	margin-right: 10rpx;
	border-radius: 30rpx;
	font-size: 26rpx;
	color: #666;
	background-color: #f5f5f5;
	transition: all 0.3s;
	flex-shrink: 0;
}
.cat-tag.active { background-color: #07C160; color: #fff; box-shadow: 0 4rpx 12rpx rgba(7,193,96,0.3); }

/* 类型切换 */
.type-switcher {
	display: inline-flex;
	background-color: #f5f5f5;
	border-radius: 30rpx;
	padding: 4rpx;
	margin-left: auto;
	flex-shrink: 0;
}
.type-btn {
	padding: 8rpx 22rpx;
	font-size: 24rpx;
	color: #666;
	border-radius: 26rpx;
	transition: all 0.3s;
}
.type-btn.active { background-color: #07C160; color: #fff; }

/* 排序栏 */
.sort-bar {
	display: flex;
	padding: 16rpx 30rpx;
	background-color: #fff;
	gap: 15rpx;
	border-bottom: 1rpx solid #f0f0f0;
}
.sort-tag {
	padding: 10rpx 24rpx;
	border-radius: 20rpx;
	font-size: 24rpx;
	color: #666;
	background-color: #f9f9f9;
	transition: all 0.3s;
}
.sort-tag.active { color: #07C160; background-color: #e8f5e9; font-weight: 500; }
.sort-icon { margin-right: 4rpx; }

/* 任务列表 */
.task-list { height: calc(100vh - 360rpx); padding: 20rpx; }
.task-card {
	background-color: #fff;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
	position: relative;
	transition: transform 0.2s;
}
.task-card:active { transform: scale(0.98); }

/* 广告位卡片特殊样式 */
.ad-card {
	border: 2rpx solid transparent;
	border-image: linear-gradient(135deg, #ffd700, #ff6b35) 1;
	box-shadow: 0 6rpx 24rpx rgba(255,193,7,0.2);
}
.ad-badge {
	position: absolute;
	top: 16rpx;
	left: 16rpx;
	padding: 6rpx 18rpx;
	border-radius: 8rpx;
	display: flex;
	align-items: center;
	gap: 6rpx;
	z-index: 10;
	font-size: 22rpx;
	font-weight: bold;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15);
}
.ad-level-1 { background-color: #ffeaa7; color: #d68910; border: 2rpx solid #f1c40f; }
.ad-level-2 { background-color: #fab1a0; color: #d63031; border: 2rpx solid #ff7675; }
.ad-level-3 { background-color: #74b9ff; color: #0984e3; border: 2rpx solid #0984e3; }
.ad-level-4 { background-color: #55efc4; color: #00b894; border: 2rpx solid #00b894; }

.card-badge {
	position: absolute;
	top: 20rpx; left: 20rpx;
	background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
	color: #fff; padding: 6rpx 20rpx;
	border-radius: 20rpx; font-size: 22rpx; font-weight: bold; z-index: 10;
}
.task-card .cover { width: 100%; height: 280rpx; }
.task-card .info { padding: 25rpx; }

/* 发布者信息行 */
.publisher-row { display: flex; align-items: center; margin-bottom: 14rpx; }
.publisher-row .avatar {
	width: 64rpx; height: 64rpx;
	border-radius: 50%;
	border: 2rpx solid #e5e5e5;
	margin-right: 14rpx;
	flex-shrink: 0;
}
.publisher-info { flex: 1; overflow: hidden; }
.name-line { display: flex; align-items: center; gap: 8rpx; flex-wrap: wrap; }
.nickname { font-size: 26rpx; font-weight: bold; color: #1d1d1f; }

/* 用户等级徽章 */
.level-badge {
	display: inline-flex;
	align-items: center;
	gap: 4rpx;
	padding: 2rpx 12rpx;
	border-radius: 8rpx;
	color: #fff;
	font-size: 20rpx;
	line-height: 1.4;
}
.level-badge text:first-child { font-size: 22rpx; }

/* 发布者评级 */
.rating-badge {
	display: inline-flex;
	align-items: center;
	gap: 4rpx;
	font-size: 20rpx;
	font-weight: 500;
}
.rating-badge.small { font-size: 22rpx; }

/* 任务标题等 */
.task-card .title { font-size: 30rpx; font-weight: bold; display: block; margin-bottom: 10rpx; color: #1d1d1f; }
.task-card .desc { font-size: 26rpx; color: #666; display: block; margin-bottom: 16rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bottom { display: flex; justify-content: space-between; align-items: center; }
.budget-row { display: flex; align-items: center; gap: 10rpx; }
.budget-label { font-size: 22rpx; color: #999; }
.budget { font-size: 34rpx; font-weight: bold; color: #07C160; }

.meta-tags { display: flex; gap: 10rpx; align-items: center; }
.tag-type {
	font-size: 22rpx; padding: 4rpx 14rpx;
	border-radius: 8rpx; font-weight: 500;
}
.tag-type.short { background-color: #e8f5e9; color: #07C160; }
.tag-type.long { background-color: #e3f2fd; color: #1976D2; }
.tag-bids { font-size: 22rpx; color: #999; }

/* 加载动画 */
.loading-top { display: flex; align-items: center; justify-content: center; padding: 20rpx; gap: 15rpx; font-size: 24rpx; color: #07C160; }
.loading-spinner { width: 40rpx; height: 40rpx; border: 4rpx solid #e5e5e5; border-top-color: #07C160; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.loading-bottom { display: flex; align-items: center; justify-content: center; padding: 30rpx; gap: 15rpx; font-size: 24rpx; color: #999; }
.loading-dots { display: flex; gap: 8rpx; }
.loading-dots .dot { width: 12rpx; height: 12rpx; background-color: #07C160; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
.loading-dots .dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dots .dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }

.empty { text-align: center; padding: 100rpx 0; }
.empty-illustration { margin-bottom: 30rpx; }
.empty-icon { font-size: 120rpx; }
.empty-text { font-size: 32rpx; color: #999; display: block; margin-bottom: 15rpx; }
.empty-tip { font-size: 26rpx; color: #ccc; display: block; margin-bottom: 40rpx; }
.empty-action { display: inline-block; padding: 15rpx 50rpx; background-color: #07C160; color: #fff; border-radius: 30rpx; font-size: 28rpx; box-shadow: 0 4rpx 12rpx rgba(7,193,96,0.3); }

.no-more { display: flex; align-items: center; justify-content: center; padding: 30rpx; gap: 20rpx; font-size: 24rpx; color: #ccc; }
.divider-line { flex: 1; height: 1rpx; background-color: #e5e5e5; }

/* 快捷发布栏 */
.quick-publish-bar {
	position: fixed; bottom: 0; left: 0; right: 0;
	padding: 16rpx 30rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background-color: rgba(255,255,255,0.95);
	backdrop-filter: blur(10px);
	box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.06);
	z-index: 99;
}
.btn-quick-publish {
	width: 100%; background: linear-gradient(135deg, #07C160, #06AD56);
	color: #fff; padding: 24rpx; border-radius: 40rpx;
	font-size: 32rpx; font-weight: bold;
	display: flex; align-items: center; justify-content: center; gap: 12rpx;
	box-shadow: 0 6rpx 20rpx rgba(7,193,96,0.35);
	border: none;
}
.btn-quick-publish:active { transform: scale(0.97); opacity: 0.9; }
.btn-quick-publish .plus { font-size: 44rpx; font-weight: 300; line-height: 1; }
</style>
