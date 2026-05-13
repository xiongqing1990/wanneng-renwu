<template>
	<view class="container">
		<!-- 顶部导航 -->
		<view class="header">
			<text class="back" @click="goBack">‹</text>
			<text class="title">发布任务</text>
			<text class="draft" @click="saveDraft">存草稿</text>
		</view>
		
		<scroll-view scroll-y class="form-scroll">
			<!-- 标题 -->
			<view class="form-item">
				<view class="label-row">
					<text class="required">*</text>
					<text class="label">标题</text>
					<text class="word-count" :class="{'over-limit': form.title.length > 45}">{{ form.title.length }}/50</text>
				</view>
				<input 
					type="text" 
					v-model="form.title" 
					placeholder="一句话说明你的需求，如：求购电影票2张" 
					maxlength="50"
					class="input"
				/>
				<text class="error-tip" v-if="errors.title">{{ errors.title }}</text>
			</view>
			
			<!-- 描述 -->
			<view class="form-item">
				<view class="label-row">
					<text class="required">*</text>
					<text class="label">详细描述</text>
					<text class="word-count" :class="{'over-limit': form.description.length > 450}">{{ form.description.length }}/500</text>
				</view>
				<textarea 
					v-model="form.description" 
					placeholder="详细说明你的需求，包括时间、地点、具体要求等"
					maxlength="500"
					class="textarea"
				></textarea>
				<text class="tip">💡 详细描述能提高接单率</text>
				<text class="error-tip" v-if="errors.description">{{ errors.description }}</text>
			</view>
			
			<!-- 分类 -->
			<view class="form-item">
				<view class="label-row">
					<text class="label">分类</text>
				</view>
				<view class="categories">
					<view 
						v-for="(cat, index) in categories" 
						:key="index"
						:class="['cat-card', form.category === cat.id ? 'active' : '']"
						@click="selectCategory(cat.id)"
					>
						<text class="icon">{{ cat.icon }}</text>
						<text class="name">{{ cat.name }}</text>
					</view>
				</view>
				<text class="error-tip" v-if="errors.category">{{ errors.category }}</text>
			</view>
			
			<!-- 预算 -->
			<view class="form-item">
				<view class="label-row">
					<text class="required">*</text>
					<text class="label">预算（元）</text>
				</view>
				<view class="budget-section">
					<input 
						type="number" 
						v-model="form.budget" 
						placeholder="输入金额" 
						class="budget-input"
					/>
					<view class="quick-budget">
						<text 
							v-for="(amt, idx) in budgetOptions" 
							:key="idx"
							:class="['budget-tag', form.budget == amt ? 'active' : '']"
							@click="form.budget = amt"
						>{{ amt }}元</text>
					</view>
				</view>
				<text class="tip">💰 合理的预算能更快找到接单者</text>
				<text class="error-tip" v-if="errors.budget">{{ errors.budget }}</text>
			</view>
			
			<!-- 押金 -->
			<view class="form-item">
				<view class="label-row">
					<text class="label">押金（选填）</text>
					<text class="optional">保障交易安全</text>
				</view>
				<input 
					type="number" 
					v-model="form.deposit" 
					placeholder="可选，任务完成将退还" 
					class="input"
				/>
			</view>
			
			<!-- 图片 -->
			<view class="form-item">
				<view class="label-row">
					<text class="label">图片（选填）</text>
					<text class="optional">最多9张</text>
				</view>
				<view class="upload-area">
					<view class="image-list">
						<view class="image-item" v-for="(img, index) in form.images" :key="index">
							<image :src="img" mode="aspectFill" class="preview-img"></image>
							<view class="remove-btn" @click="removeImage(index)">×</view>
						</view>
						<view class="upload-btn" @click="chooseImage" v-if="form.images.length < 9">
							<text class="icon">📷</text>
							<text class="text">添加图片</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 位置 -->
			<view class="form-item">
				<view class="label-row">
					<text class="label">位置（选填）</text>
				</view>
				<view class="location-input" @click="chooseLocation">
					<text class="icon">📍</text>
					<text class="text">{{ form.location || '点击选择位置' }}</text>
					<text class="arrow">›</text>
				</view>
			</view>
			
			<!-- 有效期 -->
			<view class="form-item">
				<view class="label-row">
					<text class="label">有效期</text>
				</view>
				<picker mode="date" :value="form.expireDate" @change="onDateChange">
					<view class="picker-input">
						<text>{{ form.expireDate || '选择截止日期（默认7天后）' }}</text>
						<text class="arrow">›</text>
					</view>
				</picker>
			</view>
		</scroll-view>
		
		<!-- 底部发布按钮 -->
		<view class="footer">
			<button class="btn-publish" @click="publish" :disabled="isPublishing">
				<text v-if="!isPublishing">发布任务</text>
				<text v-else>发布中...</text>
			</button>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			isPublishing: false,
			form: {
				title: '',
				description: '',
				category: 'ticket',
				budget: '',
				deposit: '',
				images: [],
				location: '',
				latitude: '',
				longitude: '',
				expireDate: ''
			},
			errors: {},
			budgetOptions: [5, 10, 20, 50, 100, 200, 500],
			categories: [
				{ id: 'ticket', name: '票券', icon: '🎫' },
				{ id: 'dining', name: '餐饮优惠', icon: '🍔' },
				{ id: 'secondhand', name: '二手', icon: '📱' },
				{ id: 'life', name: '生活', icon: '🏠' },
				{ id: 'shopping', name: '代购', icon: '🛒' },
				{ id: 'transport', name: '跑腿', icon: '🏃' },
				{ id: 'other', name: '其他', icon: '📦' },
				{ id: 'game', name: '游戏', icon: '🎮' }
			]
		}
	},
	onLoad() {
		this.loadDraft();
		this.setDefaultDate();
	},
	methods: {
		loadDraft() {
			const draft = uni.getStorageSync('task_draft');
			if (draft) {
				uni.showModal({
					title: '发现草稿',
					content: '是否恢复上次未发布的草稿？',
					success: (res) => {
						if (res.confirm) {
							this.form = draft;
							uni.showToast({ title: '已恢复草稿', icon: 'success' });
						} else {
							uni.removeStorageSync('task_draft');
						}
					}
				});
			}
		},
		setDefaultDate() {
			const now = new Date();
			now.setDate(now.getDate() + 7);
			const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
			this.form.expireDate = dateStr;
		},
		selectCategory(id) {
			this.form.category = id;
			this.$delete(this.errors, 'category');
		},
		chooseImage() {
			uni.chooseImage({
				count: 9 - this.form.images.length,
				success: (res) => {
					this.form.images = this.form.images.concat(res.tempFilePaths);
				}
			});
		},
		removeImage(index) {
			this.form.images.splice(index, 1);
		},
		chooseLocation() {
			uni.chooseLocation({
				success: (res) => {
					this.form.location = res.address;
					this.form.latitude = res.latitude;
					this.form.longitude = res.longitude;
				}
			});
		},
		onDateChange(e) {
			this.form.expireDate = e.detail.value;
		},
		saveDraft() {
			if (!this.form.title && !this.form.description) {
				uni.showToast({ title: '暂无内容可保存', icon: 'none' });
				return;
			}
			uni.setStorageSync('task_draft', this.form);
			uni.showToast({ title: '草稿已保存', icon: 'success' });
		},
		validate() {
			this.errors = {};
			let isValid = true;
			
			if (!this.form.title.trim()) {
				this.$set(this.errors, 'title', '请输入标题');
				isValid = false;
			} else if (this.form.title.length < 5) {
				this.$set(this.errors, 'title', '标题至少5个字符');
				isValid = false;
			}
			
			if (!this.form.description.trim()) {
				this.$set(this.errors, 'description', '请输入详细描述');
				isValid = false;
			} else if (this.form.description.length < 10) {
				this.$set(this.errors, 'description', '描述至少10个字符');
				isValid = false;
			}
			
			if (!this.form.budget) {
				this.$set(this.errors, 'budget', '请输入预算');
				isValid = false;
			} else if (this.form.budget < 1) {
				this.$set(this.errors, 'budget', '预算至少为1元');
				isValid = false;
			}
			
			return isValid;
		},
		publish() {
			if (!this.validate()) {
				uni.showToast({ title: '请完善信息', icon: 'none' });
				return;
			}
			
			this.isPublishing = true;
			uni.showLoading({ title: '发布中...' });
			
			// 模拟发布
			setTimeout(() => {
				uni.hideLoading();
				this.isPublishing = false;
				uni.removeStorageSync('task_draft');
				uni.showToast({ title: '发布成功！', icon: 'success' });
				
				setTimeout(() => {
					uni.switchTab({ url: '/pages/index/index' });
				}, 1500);
			}, 1000);
		},
		goBack() {
			if (this.form.title || this.form.description) {
				uni.showModal({
					title: '退出确认',
					content: '是否保存为草稿？',
					confirmText: '保存',
					cancelText: '不保存',
					success: (res) => {
						if (res.confirm) {
							this.saveDraft();
						}
						uni.navigateBack();
					}
				});
			} else {
				uni.navigateBack();
			}
		}
	}
}
</script>

<style>
.container {
	min-height: 100vh;
	background-color: #f5f5f5;
	display: flex;
	flex-direction: column;
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
.header .draft {
	font-size: 28rpx;
	color: #07C160;
}
.form-scroll {
	flex: 1;
	padding: 20rpx;
	padding-bottom: 140rpx;
}
.form-item {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
.label-row {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}
.label-row .required {
	color: #f00;
	font-size: 32rpx;
	margin-right: 8rpx;
}
.label-row .label {
	font-size: 30rpx;
	font-weight: 500;
	color: #1d1d1f;
}
.label-row .word-count {
	margin-left: auto;
	font-size: 24rpx;
	color: #999;
}
.label-row .word-count.over-limit {
	color: #f00;
}
.label-row .optional {
	margin-left: auto;
	font-size: 22rpx;
	color: #999;
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
.textarea {
	width: 100%;
	height: 240rpx;
	padding: 20rpx;
	border: 2rpx solid #e5e5e5;
	border-radius: 12rpx;
	font-size: 28rpx;
	transition: border-color 0.3s;
}
.textarea:focus {
	border-color: #07C160;
}
.tip {
	font-size: 24rpx;
	color: #999;
	display: block;
	margin-top: 12rpx;
}
.error-tip {
	font-size: 24rpx;
	color: #f00;
	display: block;
	margin-top: 12rpx;
}
.categories {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}
.cat-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 160rpx;
	height: 140rpx;
	background-color: #f9f9f9;
	border-radius: 16rpx;
	border: 2rpx solid transparent;
	transition: all 0.3s;
}
.cat-card.active {
	background-color: #e8f5e9;
	border-color: #07C160;
	box-shadow: 0 4rpx 12rpx rgba(7,193,96,0.2);
}
.cat-card .icon {
	font-size: 48rpx;
	margin-bottom: 10rpx;
}
.cat-card .name {
	font-size: 24rpx;
	color: #333;
}
.cat-card.active .name {
	color: #07C160;
	font-weight: 500;
}
.budget-section {
	
}
.budget-input {
	width: 100%;
	padding: 20rpx;
	border: 2rpx solid #e5e5e5;
	border-radius: 12rpx;
	font-size: 32rpx;
	font-weight: 500;
	margin-bottom: 20rpx;
	transition: border-color 0.3s;
}
.budget-input:focus {
	border-color: #07C160;
}
.quick-budget {
	display: flex;
	flex-wrap: wrap;
	gap: 15rpx;
}
.budget-tag {
	padding: 12rpx 30rpx;
	background-color: #f5f5f5;
	border-radius: 25rpx;
	font-size: 26rpx;
	color: #333;
	border: 2rpx solid transparent;
	transition: all 0.3s;
}
.budget-tag.active {
	background-color: #e8f5e9;
	color: #07C160;
	border-color: #07C160;
}
.budget-tag:active {
	transform: scale(0.95);
}
.upload-area {
	
}
.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: 15rpx;
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
}
.upload-btn .icon {
	font-size: 60rpx;
}
.upload-btn .text {
	font-size: 22rpx;
	color: #999;
	margin-top: 10rpx;
}
.location-input, .picker-input {
	display: flex;
	align-items: center;
	padding: 20rpx;
	background-color: #f9f9f9;
	border-radius: 12rpx;
	border: 2rpx solid #e5e5e5;
	transition: border-color 0.3s;
}
.location-input:active, .picker-input:active {
	border-color: #07C160;
}
.location-input .icon {
	font-size: 32rpx;
	margin-right: 15rpx;
}
.location-input .text, .picker-input text {
	flex: 1;
	font-size: 28rpx;
	color: #333;
}
.arrow {
	color: #ccc;
	font-size: 36rpx;
}
.footer {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background-color: #fff;
	padding: 20rpx 30rpx;
	padding-bottom: 40rpx;
	box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.08);
}
.btn-publish {
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
.btn-publish:active {
	transform: scale(0.98);
}
.btn-publish[disabled] {
	background: #ccc;
	box-shadow: none;
}
</style>
