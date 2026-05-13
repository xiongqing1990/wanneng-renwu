<template>
	<view class="container">
		<view class="header">
			<text class="title">实名认证</text>
			<text class="tips">认证后可提升信用分，获得更多信任</text>
		</view>
		
		<!-- 认证状态 -->
		<view class="status-card" v-if="isVerified">
			<text class="icon">✅</text>
			<view class="info">
				<text class="name">{{ name }}</text>
				<text class="id-card">{{ idCard }}</text>
			</view>
			<text class="badge">已认证</text>
		</view>
		
		<!-- 认证表单 -->
		<view class="form" v-else>
			<view class="form-item">
				<text class="label">真实姓名</text>
				<input type="text" v-model="form.name" placeholder="请输入真实姓名" />
			</view>
			
			<view class="form-item">
				<text class="label">身份证号</text>
				<input type="idcard" v-model="form.idCard" placeholder="请输入18位身份证号" />
			</view>
			
			<view class="form-item">
				<text class="label">身份证照片</text>
				<view class="upload-box">
					<view class="upload-item" @click="uploadImage('front')">
						<text v-if="!form.idCardFront">📷</text>
						<text v-if="!form.idCardFront">身份证正面</text>
						<image v-else :src="form.idCardFront" mode="aspectFill"></image>
					</view>
					<view class="upload-item" @click="uploadImage('back')">
						<text v-if="!form.idCardBack">📷</text>
						<text v-if="!form.idCardBack">身份证反面</text>
						<image v-else :src="form.idCardBack" mode="aspectFill"></image>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 协议 -->
		<view class="agreement">
			<checkbox-group @change="onAgreeChange">
				<label>
					<checkbox value="agree" :checked="agreed" />
					<text>我同意</text>
				</label>
			</checkbox-group>
			<text class="link">《实名认证协议》</text>
		</view>
		
		<!-- 按钮 -->
		<button class="btn-submit" @click="handleSubmit" :disabled="!agreed">
			{{ isVerified ? '重新认证' : '提交认证' }}
		</button>
		
		<!-- 安全说明 -->
		<view class="security-note">
			<text class="icon">🔒</text>
			<text class="text">您的身份信息仅用于实名认证，不会被公开或用于其他用途</text>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			isVerified: false,
			name: '',
			idCard: '',
			agreed: false,
			form: {
				name: '',
				idCard: '',
				idCardFront: '',
				idCardBack: ''
			}
		}
	},
	methods: {
		uploadImage(type) {
			uni.chooseImage({
				count: 1,
				success: (res) => {
					if (type === 'front') {
						this.form.idCardFront = res.tempFilePaths[0];
					} else {
						this.form.idCardBack = res.tempFilePaths[0];
					}
				}
			});
		},
		onAgreeChange(e) {
			this.agreed = e.detail.value.length > 0;
		},
		handleSubmit() {
			if (!this.form.name || !this.form.idCard) {
				uni.showToast({ title: '请填写完整信息', icon: 'none' });
				return;
			}
			
			uni.showLoading({ title: '认证中...' });
			
			setTimeout(() => {
				uni.hideLoading();
				uni.showToast({ title: '认证成功', icon: 'success' });
				this.isVerified = true;
				this.name = this.form.name;
				this.idCard = '**** **** **** ' + this.form.idCard.slice(-4);
			}, 1500);
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
.header {
	text-align: center;
	margin-bottom: 40rpx;
}
.header .title {
	font-size: 36rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 10rpx;
}
.header .tips {
	font-size: 26rpx;
	color: #999;
}
.status-card {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	display: flex;
	align-items: center;
	margin-bottom: 30rpx;
}
.status-card .icon {
	font-size: 60rpx;
	margin-right: 30rpx;
}
.status-card .info {
	flex: 1;
}
.status-card .name {
	font-size: 32rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 10rpx;
}
.status-card .idCard {
	font-size: 28rpx;
	color: #999;
}
.status-card .badge {
	padding: 10rpx 20rpx;
	background-color: #07C160;
	color: #fff;
	border-radius: 30rpx;
	font-size: 24rpx;
}
.form {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 40rpx;
	margin-bottom: 30rpx;
}
.form-item {
	margin-bottom: 30rpx;
}
.form-item .label {
	display: block;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 15rpx;
}
.form-item input {
	width: 100%;
	padding: 25rpx;
	border: 1rpx solid #eee;
	border-radius: 10rpx;
	font-size: 28rpx;
}
.upload-box {
	display: flex;
	gap: 30rpx;
}
.upload-item {
	width: 250rpx;
	height: 160rpx;
	border: 2rpx dashed #ddd;
	border-radius: 15rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	font-size: 26rpx;
	color: #999;
}
.upload-item image {
	width: 100%;
	height: 100%;
	border-radius: 15rpx;
}
.agreement {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx;
	font-size: 24rpx;
}
.agreement .link {
	color: #07C160;
	margin-left: 10rpx;
}
.btn-submit {
	background-color: #07C160;
	color: #fff;
	padding: 30rpx;
	border-radius: 50rpx;
	font-size: 32rpx;
	margin-top: 40rpx;
}
.btn-submit[disabled] {
	background-color: #ccc;
}
.security-note {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 30rpx;
}
.security-note .icon {
	font-size: 24rpx;
	margin-right: 10rpx;
}
.security-note .text {
	font-size: 24rpx;
	color: #999;
}
</style>