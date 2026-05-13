<template>
	<view class="container">
		<view class="header">
			<text class="title">举报</text>
		</view>
		
		<!-- 举报类型 -->
		<view class="section">
			<text class="section-title">举报原因</text>
			<view class="report-types">
				<view 
					v-for="(type, index) in reportTypes" 
					:key="index"
					:class="['type-item', selectedTypes.includes(type) ? 'active' : '']"
					@click="toggleType(type)"
				>
					{{ type }}
				</view>
			</view>
		</view>
		
		<!-- 详细描述 -->
		<view class="section">
			<text class="section-title">详细说明</text>
			<textarea 
				class="report-input" 
				v-model="reportContent" 
				placeholder="请详细描述举报原因和证据..."
				maxlength="500"
			/>
			<text class="word-count">{{ reportContent.length }}/500</text>
		</view>
		
		<!-- 上传证据 -->
		<view class="section">
			<text class="section-title">上传证据（选填）</text>
			<view class="upload-list">
				<view class="upload-item" v-for="(img, index) in evidenceImages" :key="index">
					<image :src="img" mode="aspectFill" class="evidence-img"></image>
					<text class="remove-btn" @click="removeImage(index)">×</text>
				</view>
				<view class="upload-btn" @click="uploadEvidence" v-if="evidenceImages.length < 5">
					<text>+</text>
				</view>
			</view>
		</view>
		
		<!-- 联系方式 -->
		<view class="section">
			<text class="section-title">联系方式（选填）</text>
			<input class="contact-input" v-model="contact" placeholder="手机号或邮箱" />
		</view>
		
		<!-- 提交按钮 -->
		<button class="btn-submit" @click="submitReport">提交举报</button>
		
		<!-- 提示 -->
		<view class="tips">
			<text class="title">举报须知：</text>
			<text class="content">• 请提供真实有效的举报信息</text>
			<text class="content">• 我们会在3个工作日内处理</text>
			<text class="content">• 恶意举报将会被追究法律责任</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			reportTypes: ['垃圾广告', '虚假信息', '欺诈行为', '色情内容', '人身攻击', '违规内容', '其他'],
			selectedTypes: [],
			reportContent: '',
			evidenceImages: [],
			contact: ''
		}
	},
	onLoad(options) {
		if (options.targetId) {
			this.targetId = options.targetId;
		}
	},
	methods: {
		toggleType(type) {
			const index = this.selectedTypes.indexOf(type);
			if (index > -1) {
				this.selectedTypes.splice(index, 1);
			} else {
				this.selectedTypes.push(type);
			}
		},
		uploadEvidence() {
			uni.chooseImage({
				count: 5 - this.evidenceImages.length,
				success: (res) => {
					this.evidenceImages = this.evidenceImages.concat(res.tempFilePaths);
				}
			});
		},
		removeImage(index) {
			this.evidenceImages.splice(index, 1);
		},
		submitReport() {
			if (this.selectedTypes.length === 0) {
				uni.showToast({ title: '请选择举报原因', icon: 'none' });
				return;
			}
			if (!this.reportContent) {
				uni.showToast({ title: '请输入详细说明', icon: 'none' });
				return;
			}
			uni.showLoading({ title: '提交中...' });
			setTimeout(() => {
				uni.hideLoading();
				uni.showToast({ title: '举报成功', icon: 'success' });
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
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
	background-color: #f43530;
	text-align: center;
	padding: 30rpx;
}
.header .title {
	color: #fff;
	font-size: 34rpx;
	font-weight: bold;
}
.section {
	background-color: #fff;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
}
.section .section-title {
	font-size: 28rpx;
	font-weight: bold;
	margin-bottom: 20rpx;
	display: block;
}
.report-types {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}
.report-types .type-item {
	padding: 15rpx 25rpx;
	background-color: #f5f5f5;
	border-radius: 30rpx;
	font-size: 26rpx;
	color: #666;
}
.report-types .type-item.active {
	background-color: #f43530;
	color: #fff;
}
.report-input {
	width: 100%;
	height: 200rpx;
	padding: 20rpx;
	border: 1rpx solid #eee;
	border-radius: 10rpx;
	font-size: 28rpx;
}
.word-count {
	text-align: right;
	display: block;
	margin-top: 15rpx;
	font-size: 24rpx;
	color: #999;
}
.upload-list {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}
.upload-item {
	position: relative;
	width: 150rpx;
	height: 150rpx;
}
.upload-item .evidence-img {
	width: 100%;
	height: 100%;
	border-radius: 10rpx;
}
.upload-item .remove-btn {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	width: 40rpx;
	height: 40rpx;
	background-color: #f43530;
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
}
.upload-btn {
	width: 150rpx;
	height: 150rpx;
	border: 2rpx dashed #ddd;
	border-radius: 10rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 60rpx;
	color: #ddd;
}
.contact-input {
	width: 100%;
	padding: 20rpx;
	border: 1rpx solid #eee;
	border-radius: 10rpx;
	font-size: 28rpx;
}
.btn-submit {
	background-color: #f43530;
	color: #fff;
	padding: 25rpx;
	border-radius: 50rpx;
	font-size: 32rpx;
	margin: 30rpx 20rpx;
}
.tips {
	background-color: #fff;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
}
.tips .title {
	font-size: 26rpx;
	font-weight: bold;
	color: #f43530;
	display: block;
	margin-bottom: 15rpx;
}
.tips .content {
	font-size: 24rpx;
	color: #999;
	display: block;
	margin-bottom: 10rpx;
}
</style>