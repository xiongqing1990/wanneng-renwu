<template>
	<view class="container">
		<!-- 顶部导航 -->
		<view class="header">
			<text class="back" @click="goBack">‹</text>
			<text class="title">{{ task.nickname }}的任务</text>
			<view class="header-right">
				<text class="icon-btn" @click="shareTask">🔗</text>
				<text class="icon-btn" @click="showMore">⋯</text>
			</view>
		</view>
		
		<scroll-view scroll-y class="content">
			<!-- 任务状态 banner -->
			<view class="status-banner" :class="task.status">
				<text class="status-icon">{{ statusIcon }}</text>
				<view class="status-info">
					<text class="status-text">{{ statusText }}</text>
					<text class="status-desc">{{ statusDesc }}</text>
				</view>
			</view>
			
			<!-- 任务详情 -->
			<view class="task-content">
				<view class="user-info" @click="viewUserProfile">
					<image class="avatar" :src="task.avatar" mode="aspectFill"></image>
					<view class="info">
						<text class="nickname">{{ task.nickname }}</text>
						<view class="user-tags">
							<text class="tag" v-if="task.isVerified">✓ 已认证</text>
							<text class="tag">{{ task.completedTasks }}单</text>
							<text class="tag">⭐ {{ task.rating }}</text>
						</view>
					</view>
					<view class="chat-btn" @click="startChat">
						<text class="chat-icon">💬</text>
						<text class="chat-text">聊一聊</text>
					</view>
				</view>
				
				<text class="title">{{ task.title }}</text>
				<text class="desc">{{ task.description }}</text>
				
				<!-- 图片 -->
				<view class="images" v-if="task.images && task.images.length > 0">
					<image 
						v-for="(img, index) in task.images" 
						:key="index" 
						:src="img" 
						mode="aspectFill" 
						class="task-img"
						@click="previewImage(index)"
					></image>
				</view>
				
				<!-- 标签 -->
				<view class="tags">
					<text class="tag">{{ task.category }}</text>
					<text class="tag" v-if="task.deposit">押金¥{{ task.deposit }}</text>
					<text class="tag hot" v-if="task.viewCount > 100">🔥 热门</text>
				</view>
				
				<!-- 任务信息 -->
				<view class="task-meta">
					<view class="meta-item">
						<text class="meta-icon">👁️</text>
						<text class="meta-text">{{ task.viewCount }}次浏览</text>
					</view>
					<view class="meta-item">
						<text class="meta-icon">⏰</text>
						<text class="meta-text">发布于{{ task.time }}</text>
					</view>
					<view class="meta-item" v-if="task.location">
						<text class="meta-icon">📍</text>
						<text class="meta-text">{{ task.location }}</text>
					</view>
				</view>
			</view>
			
			<!-- 预算信息 -->
			<view class="budget-card">
				<view class="item">
					<text class="label">预算</text>
					<text class="value">¥{{ task.budget }}</text>
				</view>
				<view class="item" v-if="task.deposit">
					<text class="label">押金</text>
					<text class="value">¥{{ task.deposit }}</text>
				</view>
				<view class="item">
					<text class="label">接单人数</text>
					<text class="value">{{ task.bids }}人</text>
				</view>
				<view class="item" v-if="task.deadline">
					<text class="label">截止时间</text>
					<text class="value" :class="{'urgent': isUrgent}">{{ task.deadline }}</text>
				</view>
			</view>
			
			<!-- 支付凭证（如果已支付） -->
			<view class="pay-section" v-if="payProof && payProof.status">
				<view class="section-header">
					<text class="icon">💰</text>
					<text class="title">支付凭证</text>
					<text class="status-tag" :class="payProof.status">{{ payProofStatusText }}</text>
				</view>
				
				<view class="pay-info">
					<view class="pay-item">
						<text class="label">支付金额</text>
						<text class="value">¥{{ payProof.payAmount }}</text>
					</view>
					<view class="pay-item">
						<text class="label">支付方式</text>
						<text class="value">{{ payProof.payMethod === 'wechat' ? '微信支付' : '支付宝' }}</text>
					</view>
					<view class="pay-item">
						<text class="label">支付时间</text>
						<text class="value">{{ payProof.payDate }}</text>
					</view>
				</view>
				
				<view class="pay-images" v-if="payProof.payImages && payProof.payImages.length > 0">
					<text class="sub-title">支付凭证图片</text>
					<view class="image-list">
						<image 
							v-for="(img, idx) in payProof.payImages" 
							:key="idx"
							:src="img" 
							mode="aspectFill"
							@click="previewPayImage(idx)"
							class="pay-img"
						></image>
					</view>
				</view>
				
				<view class="pay-actions" v-if="payProof.status === 'pending' && isTaskOwner">
					<button class="btn-confirm" @click="confirmPayProof">确认收到付款</button>
					<button class="btn-dispute" @click="disputePayProof">有异议</button>
				</view>
			</view>
			
			<!-- 接单者列表 -->
			<view class="bidders-section" v-if="bidders.length > 0">
				<view class="section-header">
					<text class="icon">👥</text>
					<text class="title">接单者 ({{ bidders.length }})</text>
					<text class="sub-tip">点击选择接单者</text>
				</view>
				<view class="bidders-list">
					<view 
						class="bidder-item" 
						v-for="(bidder, index) in bidders" 
						:key="index" 
						@click="selectBidder(bidder)"
						:class="{'selected': selectedBidder && selectedBidder.id === bidder.id}"
					>
						<image class="avatar" :src="bidder.avatar"></image>
						<view class="info">
							<view class="name-row">
								<text class="nickname">{{ bidder.nickname }}</text>
								<text class="verified" v-if="bidder.isVerified">✓</text>
							</view>
							<view class="stats">
								<text class="stat">⭐ {{ bidder.rating }}</text>
								<text class="stat">{{ bidder.completedTasks }}单</text>
								<text class="stat">📍 {{ bidder.distance || '1km' }}</text>
							</view>
						</view>
						<view class="quote-section">
							<text class="quote">¥{{ bidder.quote || task.budget }}</text>
							<text class="quote-label">报价</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 安全提示 -->
			<view class="safety-tip">
				<text class="tip-icon">🛡️</text>
				<view class="tip-content">
					<text class="tip-title">交易安全提示</text>
					<text class="tip-text">1. 建议使用平台支付凭证功能\n2. 线下交易注意人身财产安全\n3. 遇到问题可联系客服举报</text>
				</view>
			</view>
		</scroll-view>
		
		<!-- 底部操作栏 -->
		<view class="action-bar">
			<view class="left-actions">
				<view class="action-item" @click="likeTask">
					<text class="icon">{{ isLiked ? '❤️' : '🤍' }}</text>
					<text class="num">{{ task.likes }}</text>
				</view>
				<view class="action-item" @click="collectTask">
					<text class="icon">{{ isCollected ? '⭐' : '☆' }}</text>
					<text class="num">{{ task.collects }}</text>
				</view>
				<view class="action-item" @click="shareTask">
					<text class="icon">🔗</text>
					<text class="num">{{ task.shares || 0 }}</text>
				</view>
			</view>
			<view class="right-actions">
				<button class="btn-chat" @click="startChat">💬 聊一聊</button>
				<button 
					class="btn-accept" 
					@click="acceptTask"
					:disabled="task.status !== 'open'"
				>{{ task.status === 'open' ? '接单' : statusBtnText }}</button>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			taskId: '',
			isLiked: false,
			isCollected: false,
			selectedBidder: null,
			payProof: null,
			task: {
				id: 1,
				title: '求5月15日电影票2张',
				description: '想买5月15日下午3点的电影票，3排5-6座，预算15元/张，有优惠的朋友帮买一下，押金10元',
				budget: 30,
				deposit: 10,
				category: '票券',
				status: 'open',
				nickname: '小明',
				avatar: '/static/avatar1.png',
				time: '2小时前',
				likes: 12,
				collects: 5,
				shares: 3,
				bids: 3,
				viewCount: 156,
				isVerified: true,
				completedTasks: 28,
				rating: 4.8,
				location: '万达广场',
				deadline: '5月20日',
				images: []
			},
			bidders: [
				{ 
					id: 1, 
					nickname: '大王', 
					avatar: '/static/avatar2.png', 
					rating: 4.8, 
					completedTasks: 28, 
					quote: 28,
					isVerified: true,
					distance: '0.5km'
				},
				{ 
					id: 2, 
					nickname: '小红', 
					avatar: '/static/avatar3.png', 
					rating: 5.0, 
					completedTasks: 56, 
					quote: 30,
					isVerified: true,
					distance: '1.2km'
				},
				{ 
					id: 3, 
					nickname: '阿强', 
					avatar: '/static/avatar4.png', 
					rating: 4.5, 
					completedTasks: 12, 
					quote: 25,
					isVerified: false,
					distance: '2km'
				}
			]
		}
	},
	computed: {
		statusIcon() {
			const iconMap = {
				'open': '🟢',
				'ongoing': '🟡',
				'completed': '✅',
				'cancelled': '🔴'
			};
			return iconMap[this.task.status] || '⚪';
		},
		statusText() {
			const textMap = {
				'open': '开放中',
				'ongoing': '进行中',
				'completed': '已完成',
				'cancelled': '已取消'
			};
			return textMap[this.task.status] || '未知';
		},
		statusDesc() {
			const descMap = {
				'open': '正在等待接单者',
				'ongoing': '已有接单者，正在交易',
				'completed': '任务已完成',
				'cancelled': '任务已取消'
			};
			return descMap[this.task.status] || '';
		},
		statusBtnText() {
			const textMap = {
				'open': '接单',
				'ongoing': '进行中',
				'completed': '已完成',
				'cancelled': '已取消'
			};
			return textMap[this.task.status] || '接单';
		},
		isUrgent() {
			// 简化判断：如果截止日期是今天或明天
			return this.task.deadline && this.task.deadline.includes('今天');
		},
		isTaskOwner() {
			// TODO: 判断当前用户是否是任务发布者
			return true;
		},
		payProofStatusText() {
			if (!this.payProof) return '';
			const textMap = {
				'pending': '待确认',
				'confirmed': '已确认',
				'disputed': '有争议'
			};
			return textMap[this.payProof.status] || '未知';
		}
	},
	onLoad(options) {
		if (options.id) {
			this.taskId = options.id;
			this.loadTaskDetail();
			this.loadPayProof();
		}
	},
	onPullDownRefresh() {
		this.loadTaskDetail();
		this.loadPayProof();
		setTimeout(() => {
			uni.stopPullDownRefresh();
		}, 1000);
	},
	methods: {
		loadTaskDetail() {
			// TODO: 从API加载任务详情
			// 模拟浏览量增加
			this.task.viewCount += 1;
		},
		loadPayProof() {
			// 从本地存储加载支付凭证（模拟）
			const proof = uni.getStorageSync('pay_proof_' + this.taskId);
			if (proof) {
				this.payProof = proof;
			}
		},
		viewUserProfile() {
			uni.showToast({ title: '查看用户资料', icon: 'none' });
			// TODO: 跳转到用户资料页
		},
		previewImage(index) {
			if (this.task.images.length === 0) return;
			uni.previewImage({
				urls: this.task.images,
				current: index
			});
		},
		previewPayImage(idx) {
			if (!this.payProof || !this.payProof.payImages) return;
			uni.previewImage({
				urls: this.payProof.payImages,
				current: idx
			});
		},
		likeTask() {
			this.isLiked = !this.isLiked;
			this.task.likes += this.isLiked ? 1 : -1;
			uni.showToast({ 
				title: this.isLiked ? '已点赞' : '已取消点赞', 
				icon: 'success' 
			});
		},
		collectTask() {
			this.isCollected = !this.isCollected;
			this.task.collects += this.isCollected ? 1 : -1;
			uni.showToast({ 
				title: this.isCollected ? '已收藏' : '已取消收藏', 
				icon: 'success' 
			});
		},
		shareTask() {
			uni.showShareMenu({
				title: this.task.title,
				path: `/pages/detail/detail?id=${this.task.id}`,
				success: () => {
					this.task.shares += 1;
				}
			});
		},
		startChat() {
			// 跳转到聊天页面
			uni.navigateTo({
				url: `/pages/chat/detail?name=${this.task.nickname}&taskId=${this.task.id}`
			});
		},
		acceptTask() {
			if (this.task.status !== 'open') {
				uni.showToast({ title: '该任务无法接单', icon: 'none' });
				return;
			}
			
			uni.showModal({
				title: '确认接单',
				content: `确定要接这个任务吗？\n预算：¥${this.task.budget}\n押金：${this.task.deposit ? '¥' + this.task.deposit : '无'}`,
				confirmColor: '#07C160',
				success: (res) => {
					if (res.confirm) {
						// TODO: 调用API接单
						uni.showToast({ title: '接单成功！', icon: 'success' });
						
						// 自动打开聊天
						setTimeout(() => {
							this.startChat();
						}, 1000);
					}
				}
			});
		},
		selectBidder(bidder) {
			if (this.task.status !== 'open' && this.task.status !== 'ongoing') {
				uni.showToast({ title: '当前状态无法选择', icon: 'none' });
				return;
			}
			
			this.selectedBidder = bidder;
			
			uni.showModal({
				title: '选择接单者',
				content: `确定选择${bidder.nickname}吗？\n报价：¥${bidder.quote || this.task.budget}\n信誉：${bidder.rating}星`,
				confirmColor: '#07C160',
				success: (res) => {
					if (res.confirm) {
						// TODO: 调用API选择接单者
						uni.showToast({ title: '已选择接单者', icon: 'success' });
						
						// 更新任务状态
						this.task.status = 'ongoing';
						
						// 自动打开聊天
						setTimeout(() => {
							this.startChat();
						}, 1000);
					} else {
						this.selectedBidder = null;
					}
				}
			});
		},
		confirmPayProof() {
			uni.showModal({
				title: '确认收款',
				content: '确认已收到付款？确认后任务将标记为已完成。',
				confirmColor: '#07C160',
				success: (res) => {
					if (res.confirm) {
						this.payProof.status = 'confirmed';
						uni.setStorageSync('pay_proof_' + this.taskId, this.payProof);
						uni.showToast({ title: '已确认收款', icon: 'success' });
						
						// 更新任务状态
						this.task.status = 'completed';
					}
				}
			});
		},
		disputePayProof() {
			uni.showModal({
				title: '提出异议',
				content: '确认支付凭证有问题？提交后将进入争议处理流程。',
				confirmColor: '#f00',
				success: (res) => {
					if (res.confirm) {
						this.payProof.status = 'disputed';
						uni.setStorageSync('pay_proof_' + this.taskId, this.payProof);
						uni.showToast({ title: '已提交争议', icon: 'success' });
					}
				}
			});
		},
		showMore() {
			const itemList = ['刷新', '举报', '分享到动态'];
			if (this.isTaskOwner) {
				itemList.push('编辑', '取消任务');
			}
			
			uni.showActionSheet({
				itemList: itemList,
				success: (res) => {
					switch(res.tapIndex) {
						case 0:
							this.loadTaskDetail();
							break;
						case 1:
							this.reportTask();
							break;
						case 2:
							this.shareToMoments();
							break;
						case 3:
							this.editTask();
							break;
						case 4:
							this.cancelTask();
							break;
					}
				}
			});
		},
		reportTask() {
			uni.showModal({
				title: '举报任务',
				content: '确认举报该任务吗？',
				success: (res) => {
					if (res.confirm) {
						uni.showToast({ title: '已提交举报', icon: 'success' });
					}
				}
			});
		},
		shareToMoments() {
			uni.showToast({ title: '功能开发中', icon: 'none' });
		},
		editTask() {
			uni.showToast({ title: '功能开发中', icon: 'none' });
		},
		cancelTask() {
			uni.showModal({
				title: '取消任务',
				content: '确认要取消这个任务吗？取消后不可恢复。',
				confirmColor: '#f00',
				success: (res) => {
					if (res.confirm) {
						this.task.status = 'cancelled';
						uni.showToast({ title: '已取消任务', icon: 'success' });
					}
				}
			});
		},
		goBack() {
			uni.navigateBack();
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 140rpx;
}
.header {
	background-color: #fff;
	padding: 20rpx 30rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1rpx solid #eee;
	padding-top: 60rpx;
	position: sticky;
	top: 0;
	z-index: 100;
}
.header .back {
	font-size: 50rpx;
	color: #07C160;
	font-weight: 300;
}
.header .title {
	font-size: 34rpx;
	font-weight: 500;
	flex: 1;
	text-align: center;
}
.header-right {
	display: flex;
	gap: 20rpx;
}
.icon-btn {
	font-size: 36rpx;
}
.content {
	height: calc(100vh - 200rpx);
}
.status-banner {
	display: flex;
	align-items: center;
	padding: 20rpx 30rpx;
	gap: 15rpx;
}
.status-banner.open {
	background-color: #e8f5e9;
}
.status-banner.ongoing {
	background-color: #fff8e1;
}
.status-banner.completed {
	background-color: #e3f2fd;
}
.status-banner.cancelled {
	background-color: #ffebee;
}
.status-icon {
	font-size: 40rpx;
}
.status-info {
	flex: 1;
}
.status-text {
	font-size: 28rpx;
	font-weight: bold;
	display: block;
}
.status-desc {
	font-size: 24rpx;
	color: #666;
	display: block;
	margin-top: 4rpx;
}
.task-content {
	background-color: #fff;
	padding: 30rpx;
	margin-top: 20rpx;
}
.user-info {
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
	padding-bottom: 30rpx;
	border-bottom: 1rpx solid #f5f5f5;
}
.user-info .avatar {
	width: 88rpx;
	height: 88rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
}
.user-info .info {
	flex: 1;
	display: flex;
	flex-direction: column;
}
.user-info .nickname {
	font-size: 32rpx;
	font-weight: bold;
	margin-bottom: 8rpx;
}
.user-tags {
	display: flex;
	gap: 12rpx;
}
.user-tags .tag {
	font-size: 22rpx;
	color: #07C160;
	background-color: #e8f5e9;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
}
.chat-btn {
	display: flex;
	align-items: center;
	background-color: #07C160;
	color: #fff;
	padding: 12rpx 24rpx;
	border-radius: 30rpx;
}
.chat-icon {
	font-size: 28rpx;
	margin-right: 6rpx;
}
.chat-text {
	font-size: 24rpx;
	font-weight: 500;
}
.task-content .title {
	font-size: 38rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 24rpx;
	color: #1d1d1f;
}
.task-content .desc {
	font-size: 30rpx;
	color: #333;
	line-height: 1.8;
	display: block;
	margin-bottom: 24rpx;
}
.task-content .images {
	display: flex;
	flex-wrap: wrap;
	gap: 15rpx;
	margin-bottom: 24rpx;
}
.task-content .task-img {
	width: 200rpx;
	height: 200rpx;
	border-radius: 12rpx;
}
.task-content .tags {
	display: flex;
	gap: 15rpx;
	margin-bottom: 24rpx;
}
.task-content .tag {
	padding: 10rpx 24rpx;
	background-color: #f5f5f5;
	border-radius: 20rpx;
	font-size: 24rpx;
	color: #666;
}
.task-content .tag.hot {
	background-color: #fff3e0;
	color: #ff9800;
}
.task-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
	padding-top: 24rpx;
	border-top: 1rpx solid #f5f5f5;
}
.meta-item {
	display: flex;
	align-items: center;
	gap: 8rpx;
}
.meta-icon {
	font-size: 28rpx;
}
.meta-text {
	font-size: 24rpx;
	color: #999;
}
.budget-card {
	background-color: #fff;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 20rpx;
	display: flex;
	flex-wrap: wrap;
	justify-content: space-around;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.budget-card .item {
	text-align: center;
	min-width: 120rpx;
	margin: 10rpx;
}
.budget-card .label {
	font-size: 24rpx;
	color: #999;
	display: block;
	margin-bottom: 12rpx;
}
.budget-card .value {
	font-size: 36rpx;
	font-weight: bold;
	color: #07C160;
}
.budget-card .value.urgent {
	color: #f00;
}
.pay-section {
	background-color: #fff;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;
	gap: 12rpx;
}
.section-header .icon {
	font-size: 32rpx;
}
.section-header .title {
	font-size: 30rpx;
	font-weight: bold;
	color: #1d1d1f;
}
.section-header .status-tag {
	font-size: 22rpx;
	padding: 6rpx 16rpx;
	border-radius: 8rpx;
	margin-left: auto;
}
.section-header .status-tag.pending {
	background-color: #fff8e1;
	color: #ff9800;
}
.section-header .status-tag.confirmed {
	background-color: #e8f5e9;
	color: #07C160;
}
.section-header .status-tag.disputed {
	background-color: #ffebee;
	color: #f00;
}
.pay-info {
	background-color: #f9f9f9;
	border-radius: 12rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
}
.pay-item {
	display: flex;
	justify-content: space-between;
	padding: 10rpx 0;
}
.pay-item .label {
	font-size: 26rpx;
	color: #999;
}
.pay-item .value {
	font-size: 26rpx;
	color: #333;
	font-weight: 500;
}
.sub-title {
	font-size: 26rpx;
	color: #666;
	display: block;
	margin-bottom: 15rpx;
}
.image-list {
	display: flex;
	gap: 15rpx;
}
.pay-img {
	width: 200rpx;
	height: 200rpx;
	border-radius: 12rpx;
	border: 2rpx solid #e5e5e5;
}
.pay-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 24rpx;
}
.btn-confirm {
	flex: 1;
	background-color: #07C160;
	color: #fff;
	padding: 20rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
}
.btn-dispute {
	flex: 1;
	background-color: #fff;
	color: #f00;
	padding: 20rpx;
	border-radius: 12rpx;
	font-size: 28rpx;
	border: 2rpx solid #f00;
}
.bidders-section {
	background-color: #fff;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.bidders-section .section-header {
	margin-bottom: 24rpx;
}
.sub-tip {
	font-size: 22rpx;
	color: #999;
	margin-left: auto;
}
.bidders-list {
	
}
.bidder-item {
	display: flex;
	align-items: center;
	padding: 24rpx 20rpx;
	border-bottom: 1rpx solid #f5f5f5;
	border-radius: 12rpx;
	transition: all 0.3s;
}
.bidder-item:last-child {
	border-bottom: none;
}
.bidder-item.selected {
	background-color: #e8f5e9;
	border: 2rpx solid #07C160;
}
.bidder-item .avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 12rpx;
	margin-right: 20rpx;
}
.bidder-item .info {
	flex: 1;
}
.name-row {
	display: flex;
	align-items: center;
	gap: 8rpx;
	margin-bottom: 8rpx;
}
.nickname {
	font-size: 30rpx;
	font-weight: bold;
}
.verified {
	font-size: 24rpx;
	color: #07C160;
	background-color: #e8f5e9;
	width: 36rpx;
	height: 36rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}
.stats {
	display: flex;
	gap: 15rpx;
}
.stat {
	font-size: 22rpx;
	color: #999;
}
.quote-section {
	text-align: center;
}
.quote {
	font-size: 34rpx;
	font-weight: bold;
	color: #07C160;
	display: block;
}
.quote-label {
	font-size: 20rpx;
	color: #999;
}
.safety-tip {
	background-color: #fff;
	margin: 20rpx;
	padding: 24rpx;
	border-radius: 20rpx;
	display: flex;
	align-items: flex-start;
	gap: 15rpx;
	box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.08);
}
.tip-icon {
	font-size: 40rpx;
}
.tip-content {
	flex: 1;
}
.tip-title {
	font-size: 26rpx;
	font-weight: bold;
	color: #333;
	display: block;
	margin-bottom: 8rpx;
}
.tip-text {
	font-size: 22rpx;
	color: #999;
	line-height: 1.6;
	display: block;
	white-space: pre-line;
}
.action-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	padding: 20rpx 30rpx;
	padding-bottom: 40rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-top: 1rpx solid #eee;
	box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.08);
}
.left-actions {
	display: flex;
	gap: 40rpx;
}
.action-item {
	display: flex;
	flex-direction: column;
	align-items: center;
}
.action-item .icon {
	font-size: 44rpx;
}
.action-item .num {
	font-size: 22rpx;
	color: #999;
	margin-top: 4rpx;
}
.right-actions {
	display: flex;
	gap: 20rpx;
}
.btn-chat {
	background-color: #f5f5f5;
	color: #333;
	padding: 22rpx 40rpx;
	border-radius: 35rpx;
	font-size: 28rpx;
	font-weight: 500;
}
.btn-accept {
	background-color: #07C160;
	color: #fff;
	padding: 22rpx 70rpx;
	border-radius: 35rpx;
	font-size: 30rpx;
	font-weight: bold;
}
.btn-accept[disabled] {
	background-color: #ccc;
}
</style>
