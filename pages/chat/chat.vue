<template>
	<view class="container">
		<!-- 顶部 -->
		<view class="header">
			<text class="title">消息</text>
			<view class="header-right">
				<text class="icon-btn" @click="createNewChat">+</text>
			</view>
		</view>
		
		<!-- 搜索栏 -->
		<view class="search-bar">
			<view class="search-input">
				<text class="icon">🔍</text>
				<input type="text" v-model="searchKey" placeholder="搜索聊天记录" @input="onSearchInput" />
				<text class="clear" v-if="searchKey" @click="clearSearch">×</text>
			</view>
		</view>
		
		<!-- 快捷操作 -->
		<view class="quick-actions" v-if="!searchKey">
			<view class="quick-item" @click="goToTaskChat">
				<text class="quick-icon">💬</text>
				<text class="quick-text">任务消息</text>
			</view>
			<view class="quick-item" @click="goToSystemMsg">
				<text class="quick-icon">🔔</text>
				<text class="quick-text">系统通知</text>
			</view>
		</view>
		
		<!-- 聊天列表 -->
		<scroll-view scroll-y class="chat-list" refresher-enabled @refresherrefresh="onRefresh">
			<view 
				class="chat-item" 
				v-for="(item, index) in filteredChats" 
				:key="item.id" 
				@click="goToChat(item)"
				@touchstart="onTouchStart($event, index)"
				@touchend="onTouchEnd($event, item, index)"
				:style="item.slideStyle"
			>
				<view class="avatar-box">
					<image class="avatar" :src="item.avatar" mode="aspectFill"></image>
					<view class="unread-dot" v-if="item.unread > 0"></view>
				</view>
				<view class="info">
					<view class="top-row">
						<text class="name">{{ item.name }}</text>
						<text class="time">{{ item.time }}</text>
					</view>
					<view class="bottom-row">
						<text class="last-msg">{{ item.lastMsg }}</text>
						<view class="unread-count" v-if="item.unread > 0">{{ item.unread > 99 ? '99+' : item.unread }}</view>
					</view>
				</view>
				
				<!-- 左滑删除按钮 -->
				<view class="slide-btns" v-if="item.showSlide">
					<view class="slide-btn delete-btn" @click.stop="deleteChat(item, index)">删除</view>
					<view class="slide-btn top-btn" @click.stop="pinChat(item)">{{ item.pinned ? '取消置顶' : '置顶' }}</view>
				</view>
			</view>
			
			<!-- 空状态 -->
			<view class="empty" v-if="filteredChats.length === 0">
				<view class="empty-icon-box">
					<text class="empty-icon">💬</text>
				</view>
				<text class="empty-text">{{ searchKey ? '未找到相关聊天' : '暂无聊天记录' }}</text>
				<text class="empty-tip">{{ searchKey ? '换个关键词试试' : '去任务详情页联系发布者吧' }}</text>
				<view class="empty-action" v-if="!searchKey" @click="goToIndex">去看看任务</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			searchKey: '',
			searchTimer: null,
			chats: [
				{
					id: 1,
					avatar: '/static/avatar1.png',
					name: '小明',
					time: '10:30',
					lastMsg: '好的，我帮你买',
					unread: 2,
					pinned: false,
					showSlide: false,
					slideStyle: ''
				},
				{
					id: 2,
					avatar: '/static/avatar2.png',
					name: '大王',
					time: '昨天',
					lastMsg: '金币还在吗',
					unread: 0,
					pinned: true,
					showSlide: false,
					slideStyle: ''
				},
				{
					id: 3,
					avatar: '/static/avatar3.png',
					name: '小红',
					time: '昨天',
					lastMsg: '5折券有的',
					unread: 0,
					pinned: false,
					showSlide: false,
					slideStyle: ''
				}
			]
		}
	},
	computed: {
		filteredChats() {
			let list = this.chats;
			
			// 置顶排序
			list = list.sort((a, b) => {
				if (a.pinned && !b.pinned) return -1;
				if (!a.pinned && b.pinned) return 1;
				return 0;
			});
			
			// 搜索过滤
			if (!this.searchKey) return list;
			return list.filter(c => 
				c.name.includes(this.searchKey) || 
				c.lastMsg.includes(this.searchKey)
			);
		}
	},
	methods: {
		onSearchInput() {
			clearTimeout(this.searchTimer);
			this.searchTimer = setTimeout(() => {
				// 模拟搜索
			}, 300);
		},
		clearSearch() {
			this.searchKey = '';
		},
		goToChat(item) {
			// 标记已读
			item.unread = 0;
			uni.navigateTo({
				url: '/pages/chat/detail?name=' + item.name
			});
		},
		goToTaskChat() {
			uni.showToast({ title: '请从任务详情进入', icon: 'none' });
		},
		goToSystemMsg() {
			uni.showToast({ title: '系统通知功能开发中', icon: 'none' });
		},
		goToIndex() {
			uni.switchTab({
				url: '/pages/index/index'
			});
		},
		createNewChat() {
			uni.showActionSheet({
				itemList: ['扫一扫', '添加好友', '新建群聊'],
				success: (res) => {
					uni.showToast({ title: '功能开发中', icon: 'none' });
				}
			});
		},
		// 触摸开始
		onTouchStart(e, index) {
			this.startX = e.touches[0].clientX;
			this.startY = e.touches[0].clientY;
			this.slideItemIndex = index;
		},
		// 触摸结束
		onTouchEnd(e, item, index) {
			const endX = e.changedTouches[0].clientX;
			const endY = e.changedTouches[0].clientY;
			const deltaX = endX - this.startX;
			const deltaY = endY - this.startY;
			
			// 水平滑动
			if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
				if (deltaX < 0) {
					// 左滑显示按钮
					this.chats.forEach((c, i) => {
						c.showSlide = (i === index);
					});
				} else {
					// 右滑隐藏按钮
					item.showSlide = false;
				}
			}
		},
		deleteChat(item, index) {
			uni.showModal({
				title: '删除聊天',
				content: `确定删除与${item.name}的聊天记录吗？`,
				confirmColor: '#f00',
				success: (res) => {
					if (res.confirm) {
						this.chats.splice(index, 1);
						uni.showToast({ title: '已删除', icon: 'success' });
					}
				}
			});
		},
		pinChat(item) {
			item.pinned = !item.pinned;
			item.showSlide = false;
			uni.showToast({ 
				title: item.pinned ? '已置顶' : '已取消置顶', 
				icon: 'success' 
			});
		},
		onRefresh() {
			setTimeout(() => {
				uni.stopPullDownRefresh();
				uni.showToast({ title: '已刷新', icon: 'success' });
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
.header {
	background-color: #fff;
	padding: 20rpx 30rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1rpx solid #e5e5e5;
	padding-top: 60rpx;
	position: sticky;
	top: 0;
	z-index: 100;
}
.header .title {
	font-size: 36rpx;
	font-weight: bold;
}
.header-right {
	display: flex;
	gap: 20rpx;
}
.icon-btn {
	font-size: 44rpx;
	color: #07C160;
}
.search-bar {
	background-color: #fff;
	padding: 15rpx 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
}
.search-input {
	background-color: #f5f5f5;
	border-radius: 20rpx;
	padding: 15rpx 25rpx;
	display: flex;
	align-items: center;
}
.search-input .icon {
	font-size: 28rpx;
	margin-right: 15rpx;
	color: #999;
}
.search-input input {
	flex: 1;
	font-size: 26rpx;
}
.search-input .clear {
	font-size: 36rpx;
	color: #999;
	padding: 0 10rpx;
}
.quick-actions {
	display: flex;
	padding: 20rpx 30rpx;
	gap: 20rpx;
	background-color: #fff;
	border-bottom: 1rpx solid #f5f5f5;
}
.quick-item {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 15rpx 25rpx;
	background-color: #f5f5f5;
	border-radius: 15rpx;
}
.quick-icon {
	font-size: 32rpx;
}
.quick-text {
	font-size: 24rpx;
	color: #666;
}
.chat-list {
	height: calc(100vh - 300rpx);
}
.chat-item {
	background-color: #fff;
	padding: 25rpx 30rpx;
	display: flex;
	align-items: center;
	border-bottom: 1rpx solid #f5f5f5;
	position: relative;
	overflow: hidden;
}
.chat-item:active {
	background-color: #f5f5f5;
}
.avatar-box {
	position: relative;
	margin-right: 25rpx;
	flex-shrink: 0;
}
.avatar {
	width: 100rpx;
	height: 100rpx;
	border-radius: 12rpx;
}
.unread-dot {
	position: absolute;
	top: -6rpx;
	right: -6rpx;
	width: 20rpx;
	height: 20rpx;
	background-color: #f00;
	border-radius: 50%;
	border: 4rpx solid #fff;
}
.info {
	flex: 1;
	overflow: hidden;
}
.top-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
}
.name {
	font-size: 32rpx;
	font-weight: 500;
	color: #1d1d1f;
}
.time {
	font-size: 24rpx;
	color: #999;
}
.bottom-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.last-msg {
	font-size: 26rpx;
	color: #999;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
	margin-right: 20rpx;
}
.unread-count {
	min-width: 40rpx;
	height: 40rpx;
	background-color: #f00;
	color: #fff;
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 22rpx;
	padding: 0 12rpx;
	flex-shrink: 0;
}
.slide-btns {
	display: flex;
	position: absolute;
	right: 0;
	top: 0;
	bottom: 0;
}
.slide-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 40rpx;
	color: #fff;
	font-size: 28rpx;
}
.delete-btn {
	background-color: #f00;
}
.top-btn {
	background-color: #07C160;
}
.empty {
	text-align: center;
	padding: 150rpx 0;
}
.empty-icon-box {
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
</style>
