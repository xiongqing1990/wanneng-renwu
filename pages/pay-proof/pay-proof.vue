<template>
	<view class="container">
		<!-- 顶部导航 -->
		<view class="header">
			<text class="back" @click="goBack">‹</text>
			<text class="title">支付凭证</text>
			<text class="more" @click="showHelp">❓</text>
		</view>
		
		<scroll-view scroll-y class="content">
			<!-- 任务信息 -->
			<view class="task-info">
				<text class="task-title">{{ taskTitle }}</text>
				<view class="task-budget">
					<text class="label">任务预算</text>
					<text class="amount">¥{{ budget }}</text>
				</view>
			</view>
			
			<!-- 支付凭证上传 -->
			<view class="section">
				<view class="section-header">
					<text class="icon">📎</text>
					<text class="title">上传支付凭证</text>
					<text class="required">*</text>
				</view>
				<text class="tip">请上传微信或支付宝的支付成功截图</text>
				
				<view class="upload-area">
					<view class="image-list">
						<view class="image-item" v-for="(img, index) in payImages" :key="index">
							<image :src="img" mode="aspectFill" class="preview-img" @click="previewImage(img)"></image>
							<view class="remove-btn" @click="removeImage(index)">×</view>
							<view class="image-tag">凭证{{ index + 1 }}</view>
						</view>
						<view class="upload-btn" @click="chooseImage" v-if="payImages.length < 3">
							<text class="icon">📷</text>
							<text class="text">添加凭证</text>
							<text class="sub-text">最多3张</text>
						</view>
					</view>
				</view>
				<text class="error-tip" v-if="errors.payImages">{{ errors.payImages }}</text>
			</view>
			
			<!-- 支付信息 -->
			<view class="section">
				<view class="section-header">
					<text class="icon">💰</text>
					<text class="title">支付信息</text>
				</view>
				
				<view class="form-item">
					<text class="label">支付方式</text>
					<view class="pay-methods">
						<view 
							:class="['method-item', payMethod === 'wechat' ? 'active' : '']"
							@click="payMethod = 'wechat'"
						>
							<text class="method-icon">💚</text>
							<text class="method-name">微信支付</text>
						</view>
						<view 
							:class="['method-item', payMethod === 'alipay' ? 'active' : '']"
							@click="payMethod = 'alipay'"
						>
							<text class="method-icon">💙</text>
							<text class="method-name">支付宝</text>
						</view>
					</view>
				</view>
				
				<view class="form-item">
					<text class="label">支付金额（元）*</text>
					<input 
						type="number" 
						v-model="payAmount" 
						placeholder="请输入实际支付金额"
						class="input"
					/>
					<text class="error-tip" v-if="errors.payAmount">{{ errors.payAmount }}</text>
				</view>
				
				<view class="form-item">
					<text class="label">交易单号</text>
					<input 
						type="text" 
						v-model="transactionId" 
						placeholder="选填，微信/支付宝的交易单号"
						class="input"
					/>
					<text class="tip">填写交易单号可加快审核</text>
				</view>
				
				<view class="form-item">
					<text class="label">支付时间</text>
					<picker mode="date" :value="payDate" @change="onDateChange">
						<view class="picker-input">
							<text>{{ payDate || '选择支付日期' }}</text>
							<text class="arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
			
			<!-- 备注说明 -->
			<view class="section">
				<view class="section-header">
					<text class="icon">📝</text>
					<text class="title">备注说明</text>
				</view>
				<textarea 
					v-model="remark" 
					placeholder="选填，可补充说明支付情况"
					class="textarea"
					maxlength="200"
				></textarea>
				<text class="word-count">{{ remark.length }}/200</text>
			</view>
			
			<!-- 提交按钮 -->
			<view class="submit-section">
				<button class="btn-submit" @click="submitPayProof" :disabled="isSubmitting">
					<text v-if="!isSubmitting">提交支付凭证</text>
					<text v-else>提交中...</text>
				</button>
				<text class="submit-tip">提交后双方可查看，作为交易凭证</text>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			taskId: '',
			taskTitle: '求5月15日电影票2张',
			budget: 30,
			payImages: [],
			payMethod: 'wechat',
			payAmount: '',
			transactionId: '',
			payDate: '',
			remark: '',
			isSubmitting: false,
			errors: {}
		}
	},
	onLoad(options) {
		if (options.taskId) {
			this.taskId = options.taskId;
			this.loadTaskInfo();
		}
		this.setDefaultDate();
	},
	methods: {
		loadTaskInfo() {
			// TODO: 从API加载任务信息
		},
		setDefaultDate() {
			const now = new Date();
			const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
			this.payDate = dateStr;
		},
		chooseImage() {
			uni.chooseImage({
				count: 3 - this.payImages.length,
				success: (res) => {
					// 压缩图片
					this.compressImages(res.tempFilePaths);
				}
			});
		},
		compressImages(paths) {
			paths.forEach(path => {
				uni.compressImage({
					src: path,
					quality: 80,
					success: (res) => {
						this.payImages.push(res.tempFilePath);
					}
				});
			});
		},
		removeImage(index) {
			uni.showModal({
				title: '删除凭证',
				content: '确定要删除这张支付凭证吗？',
				success: (res) => {
					if (res.confirm) {
						this.payImages.splice(index, 1);
					}
				}
			});
		},
		previewImage(url) {
			uni.previewImage({
				urls: this.payImages,
				current: url
			});
		},
		onDateChange(e) {
			this.payDate = e.detail.value;
		},
		showHelp() {
			uni.showModal({
				title: '支付凭证说明',
				content: '1. 请上传清晰的支付成功截图\n2. 支持微信和支付宝支付凭证\n3. 提交后双方都可查看\n4. 作为交易纠纷的处理依据\n5. 请如实填写支付信息',
				showCancel: false
			});
		},
		validate() {
			this.errors = {};
			let isValid = true;
			
			if (this.payImages.length === 0) {
				this.$set(this.errors, 'payImages', '请上传支付凭证');
				isValid = false;
			}
			
			if (!this.payAmount) {
				this.$set(this.errors, 'payAmount', '请输入支付金额');
				isValid = false;
			} else if (this.payAmount <= 0) {
				this.$set(this.errors, 'payAmount', '支付金额必须大于0');
				isValid = false;
			} else if (this.payAmount > this.budget * 2) {
				this.$set(this.errors, 'payAmount', '支付金额异常，请核对');
				isValid = false;
			}
			
			return isValid;
		},
		submitPayProof() {
			if (!this.validate()) {
				uni.showToast({ title: '请完善信息', icon: 'none' });
				return;
			}
			
			this.isSubmitting = true;
			uni.showLoading({ title: '提交中...' });
			
			// 模拟提交
			setTimeout(() => {
				uni.hideLoading();
				this.isSubmitting = false;
				
				// 保存到本地（模拟）
				const proofData = {
					taskId: this.taskId,
					payImages: this.payImages,
					payMethod: this.payMethod,
					payAmount: this.payAmount,
					transactionId: this.transactionId,
					payDate: this.payDate,
					remark: this.remark,
					submitTime: new Date().toISOString(),
					status: 'pending' // pending-待确认, confirmed-已确认, disputed-有争议
				};
				
				uni.setStorageSync('pay_proof_' + this.taskId, proofData);
				
				uni.showToast({ title: '提交成功！', icon: 'success' });
				
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			}, 1000);
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
}
.header .more {
	font-size: 36rpx;
	color: #999;
}
.content {
	height: calc(100vh - 100rpx);
	padding: 20rpx;
}
.task-info {
	background: linear-gradient(135deg, #07C160, #06AD56);
	padding: 30rpx;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 16rpx rgba(7,193,96,0.3);
}
.task-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #fff;
	display: block;
	margin-bottom: 20rpx;
}
.task-budget {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.task-budget .label {
	font-size: 26rpx;
	color: rgba(255,255,255,0.8);
}
.task-budget .amount {
	font-size: 40rpx;
	font-weight: bold;
	color: #fff;
}
.section {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
.section-header {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}
.section-header .icon {
	font-size: 36rpx;
	margin-right: 12rpx;
}
.section-header .title {
	font-size: 30rpx;
	font-weight: 500;
	color: #1d1d1f;
}
.section-header .required {
	color: #f00;
	font-size: 32rpx;
	margin-left: 8rpx;
}
.tip {
	font-size: 24rpx;
	color: #999;
	display: block;
	margin-bottom: 20rpx;
}
.upload-area {
	
}
.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}
.image-item {
	position: relative;
	width: 200rpx;
	height: 200rpx;
}
.preview-img {
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
	border: 2rpx solid #e5e5e5;
}
.remove-btn {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	width: 44rpx;
	height: 44rpx;
	background-color: #f00;
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2);
}
.image-tag {
	position: absolute;
	bottom: 8rpx;
	left: 8rpx;
	background-color: rgba(0,0,0,0.6);
	color: #fff;
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	font-size: 20rpx;
}
.upload-btn {
	width: 200rpx;
	height: 200rpx;
	border: 2rpx dashed #ddd;
	border-radius: 12rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}
.upload-btn:active {
	background-color: #f5f5f5;
	border-color: #07C160;
}
.upload-btn .icon {
	font-size: 60rpx;
}
.upload-btn .text {
	font-size: 24rpx;
	color: #999;
	margin-top: 10rpx;
}
.upload-btn .sub-text {
	font-size: 20rpx;
	color: #ccc;
	margin-top: 4rpx;
}
.error-tip {
	font-size: 24rpx;
	color: #f00;
	display: block;
	margin-top: 12rpx;
}
.form-item {
	margin-bottom: 30rpx;
}
.form-item:last-child {
	margin-bottom: 0;
}
.form-item .label {
	font-size: 28rpx;
	font-weight: 500;
	color: #333;
	display: block;
	margin-bottom: 15rpx;
}
.pay-methods {
	display: flex;
	gap: 20rpx;
}
.method-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	padding: 20rpx;
	background-color: #f9f9f9;
	border-radius: 12rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s;
}
.method-item.active {
	background-color: #e8f5e9;
	border-color: #07C160;
}
.method-icon {
	font-size: 40rpx;
}
.method-name {
	font-size: 26rpx;
	color: #333;
}
.method-item.active .method-name {
	color: #07C160;
	font-weight: 500;
}
.input {
	width: 100%;
	padding: 20rpx;
	border: 2rpx solid #e5e5e5;
	border-radius: 12rpx;
	font-size: 28rpx;
	transition: border-color 0.3s;
}
.input:focus {
	border-color: #07C160;
}
.picker-input {
	padding: 20rpx;
	border: 2rpx solid #e5e5e5;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	transition: border-color 0.3s;
}
.picker-input:active {
	border-color: #07C160;
}
.picker-input text {
	font-size: 28rpx;
	color: #333;
}
.arrow {
	color: #ccc;
	font-size: 36rpx;
}
.textarea {
	width: 100%;
	height: 200rpx;
	padding: 20rpx;
	border: 2rpx solid #e5e5e5;
	border-radius: 12rpx;
	font-size: 28rpx;
	transition: border-color 0.3s;
}
.textarea:focus {
	border-color: #07C160;
}
.word-count {
	font-size: 22rpx;
	color: #999;
	display: block;
	text-align: right;
	margin-top: 10rpx;
}
.submit-section {
	padding: 30rpx 0;
}
.btn-submit {
	width: 100%;
	background: linear-gradient(135deg, #07C160, #06AD56);
	color: #fff;
	padding: 28rpx;
	border-radius: 40rpx;
	font-size: 32rpx;
	font-weight: bold;
	border: none;
	box-shadow: 0 4rpx 16rpx rgba(7,193,96,0.3);
}
.btn-submit:active {
	transform: scale(0.98);
}
.btn-submit[disabled] {
	background: #ccc;
	box-shadow: none;
}
.submit-tip {
	font-size: 24rpx;
	color: #999;
	display: block;
	text-align: center;
	margin-top: 20rpx;
}
</style>
