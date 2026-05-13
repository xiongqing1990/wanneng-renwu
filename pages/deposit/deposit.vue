<template>
	<view class="container">
		<!-- 押金状态 -->
		<view class="deposit-card">
			<view class="deposit-icon">🔒</view>
			<view class="deposit-info">
				<text class="label">我的押金</text>
				<text class="amount">¥{{ deposit }}</text>
			</view>
			<view class="status" :class="statusClass">{{ statusText }}</view>
		</view>
		
		<!-- 说明 -->
		<view class="description">
			<text class="title">押金说明</text>
			<view class="item">• 押金用于保障交易双方的权益</view>
			<view class="item">• 完成任务后，押金原路退还</view>
			<view class="item">• 违规行为将被扣除押金</view>
		</view>
		
		<!-- 操作 -->
		<view class="actions">
			<button class="btn-deposit" @click="handleDeposit">
				{{ hasDeposit ? '追加押金' : '缴纳押金' }}
			</button>
			<button class="btn-withdraw" @click="handleWithdraw" v-if="hasDeposit">
				退还押金
			</button>
		</view>
		
		<!-- 押金记录 -->
		<view class="records">
			<text class="title">押金记录</text>
			<view class="record-list">
				<view class="record-item" v-for="(record, index) in records" :key="index">
					<view class="info">
						<text class="type">{{ record.type }}</text>
						<text class="time">{{ record.time }}</text>
					</view>
					<text class="amount" :class="record.amount > 0 ? 'plus' : 'minus'">
						{{ record.amount > 0 ? '+' : '' }}{{ record.amount }}
					</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			deposit: 100,
			hasDeposit: true,
			status: 'normal', // normal, frozen
			records: [
				{ type: '完成任务退回', time: '2024-05-01 10:30', amount: 50 },
				{ type: '缴纳押金', time: '2024-04-28 15:20', amount: -50 },
				{ type: '完成任务退回', time: '2024-04-20 09:15', amount: 100 },
				{ type: '缴纳押金', time: '2024-04-15 20:00', amount: -100 }
			]
		}
	},
	computed: {
		statusText() {
			return this.status === 'normal' ? '正常' : '冻结中';
		},
		statusClass() {
			return this.status === 'normal' ? 'normal' : 'frozen';
		}
	},
	methods: {
		handleDeposit() {
			uni.navigateTo({ url: '/pages/payment/payment' });
		},
		handleWithdraw() {
			uni.showModal({
				title: '退还押金',
				content: '确认退还押金？退还后可能影响你的信用等级。',
				success: (res) => {
					if (res.confirm) {
						uni.showToast({ title: '申请已提交', icon: 'success' });
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
	padding: 30rpx;
}
.deposit-card {
	background: linear-gradient(135deg, #07C160 0%, #06ad56 100%);
	border-radius: 20rpx;
	padding: 50rpx 40rpx;
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}
.deposit-icon {
	font-size: 80rpx;
	margin-right: 30rpx;
}
.deposit-info {
	flex: 1;
}
.deposit-info .label {
	display: block;
	font-size: 28rpx;
	color: rgba(255,255,255,0.8);
	margin-bottom: 10rpx;
}
.deposit-info .amount {
	font-size: 60rpx;
	font-weight: bold;
	color: #fff;
}
.deposit-card .status {
	padding: 10rpx 20rpx;
	background-color: rgba(255,255,255,0.2);
	border-radius: 30rpx;
	color: #fff;
	font-size: 24rpx;
}
.deposit-card .status.frozen {
	background-color: #ff9800;
}
.description {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 30rpx;
}
.description .title {
	font-size: 30rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 20rpx;
}
.description .item {
	font-size: 26rpx;
	color: #666;
	line-height: 2;
}
.actions {
	display: flex;
	gap: 20rpx;
	margin-bottom: 30rpx;
}
.actions button {
	flex: 1;
	padding: 25rpx;
	border-radius: 50rpx;
	font-size: 30rpx;
}
.btn-deposit {
	background-color: #07C160;
	color: #fff;
}
.btn-withdraw {
	background-color: #fff;
	color: #666;
	border: 2rpx solid #ddd;
}
.records {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
}
.records .title {
	font-size: 30rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 20rpx;
}
.record-list {
	
}
.record-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 25rpx 0;
	border-bottom: 1rpx solid #f5f5f5;
}
.record-item:last-child {
	border-bottom: none;
}
.record-item .info {
	display: flex;
	flex-direction: column;
}
.record-item .type {
	font-size: 28rpx;
	margin-bottom: 8rpx;
}
.record-item .time {
	font-size: 24rpx;
	color: #999;
}
.record-item .amount {
	font-size: 32rpx;
	font-weight: bold;
}
.record-item .amount.plus {
	color: #07C160;
}
.record-item .amount.minus {
	color: #ff5722;
}
</style>