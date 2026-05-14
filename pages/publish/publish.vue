<template>
	<view class="container">
		<!-- 顶部导航 -->
		<view class="header">
			<text class="back" @click="goBack">‹</text>
			<text class="title">发布任务</text>
			<text class="draft" @click="saveDraft" v-if="!quickMode">存草稿</text>
		</view>

		<!-- 模式切换：快捷发布 / 完整发布 -->
		<view class="mode-switch">
			<view :class="['mode-btn', !quickMode ? 'active' : '']" @click="quickMode = false">
				<text class="mode-icon">📝</text><text>完整发布</text>
			</view>
			<view :class="['mode-btn', quickMode ? 'active' : '']" @click="quickMode = true">
				<text class="mode-icon">⚡</text><text>快捷发布</text>
			</view>
		</view>

		<scroll-view scroll-y class="form-scroll">

			<!-- ====== 快捷发布模式 ====== -->
			<view v-if="quickMode" class="quick-form">
				<!-- 任务类型选择（核心） -->
				<view class="form-item highlight">
					<text class="section-label">🎯 选择任务类型</text>
					<view class="type-cards">
						<view :class="['type-card', form.taskType === 'short' ? 'active' : '']" @click="form.taskType = 'short'">
							<text class="type-icon">⚡</text>
							<text class="type-name">短期任务</text>
							<text class="type-desc">一人接取即下架</text>
						</view>
						<view :class="['type-card', form.taskType === 'long' ? 'active' : '']" @click="form.taskType = 'long'">
							<text class="type-icon">📅</text>
							<text class="type-name">长期任务</text>
							<text class="type-desc">多人可接取，长期有效</text>
						</view>
					</view>
				</view>

				<!-- 标题 + 预算一行搞定 -->
				<view class="form-item">
					<input type="text" v-model="form.title"
						placeholder="一句话说明需求（如：求购电影票2张）"
						maxlength="50" class="input quick-input"
					/>
					<text class="word-count-sm">{{ form.title.length }}/50</text>
				</view>

				<!-- 预算快速输入 -->
				<view class="form-item">
					<text class="inline-label">💰 预算</text>
					<view class="budget-inline">
						<input type="number" v-model="form.budget" placeholder="金额" class="budget-num" />
						<text class="yuan">元</text>
					</view>
					<view class="quick-budget-tags">
						<text v-for="(amt, idx) in [5, 10, 20, 50, 100]" :key="idx"
							:class="['qb-tag', form.budget == amt ? 'active' : '']"
							@click="form.budget = amt">{{amt}}</text>
					</view>
				</view>

				<!-- 分类快捷选 -->
				<view class="form-item">
					<text class="inline-label">📂 分类</text>
					<scroll-view scroll-x class="cat-scroll">
						<text v-for="(cat, idx) in categories" :key="idx"
							:class="['cat-pill', form.category === cat.id ? 'active' : '']"
							@click="form.category = cat.id">{{ cat.icon }} {{ cat.name }}</text>
					</scroll-view>
				</view>

				<!-- 广告位购买（折叠） -->
				<view class="form-item ad-section" @click="showAdOptions = !showAdOptions">
					<view class="ad-header">
						<text class="ad-title">📢 购买广告位 <text class="optional">(选填)</text></text>
						<text class="expand-icon">{{ showAdOptions ? '▲' : '▼' }}</text>
					</view>
					
					<view class="ad-options" v-if="showAdOptions">
						<view class="ad-option" v-for="(pos, idx) in adPositions" :key="idx"
							@click.stop="selectAdPosition(pos)">
							<view :class="['ad-radio', selectedAdPos === pos.id ? 'checked' : '']"></view>
							<view class="ad-info">
								<text class="ad-name">{{ pos.icon }} {{ pos.name }}</text>
								<text class="ad-price">¥{{ pos.price }}/{{ pos.unit }}</text>
							</view>
						</view>
						
						<view class="free-ad-tip" v-if="userFreeAdCount > 0">
							<text class="tip-icon">🎁</text>
							<text class="tip-text">您当前有 <text class="highlight-green">{{ userFreeAdCount }}</text> 次免费广告位可用！</text>
						</view>
						
						<view class="ad-duration" v-if="selectedAdPos">
							<text class="duration-label">时长：</text>
							<text v-for="(d, idx) in getAdDurations()" :key="idx"
								:class="['duration-tag', adDuration == d ? 'active' : '']"
								@click.stop="adDuration = d">{{ d }}{{ adUnit }}</text>
						</view>
					</view>
				</view>

				<!-- 更多选项（展开） -->
				<view class="more-options" v-if="showMore" style="margin-top: 10rpx;">
					<view class="form-item">
						<text class="inline-label">📝 详细描述</text>
						<textarea v-model="form.description" placeholder="补充说明时间、地点、要求等..." maxlength="500" class="textarea"></textarea>
					</view>
					<view class="form-item">
						<text class="inline-label">📍 位置（选填）</text>
						<view class="location-input" @click="chooseLocation">
							<text>{{ form.location || '点击选择位置' }}</text><text class="arrow">›</text>
						</view>
					</view>
					<view class="form-item">
						<text class="inline-label">🖼️ 图片（选填）</text>
						<view class="image-list">
							<view class="image-item" v-for="(img, index) in form.images" :key="index">
								<image :src="img" mode="aspectFill" class="preview-img"></image>
								<view class="remove-btn" @click="removeImage(index)">×</view>
							</view>
							<view class="upload-btn" @click="chooseImage" v-if="form.images.length < 9">
								<text class="upload-icon">+</text>
							</view>
						</view>
					</view>
				</view>
				
				<view class="toggle-more" @click="showMore = !showMore">
					<text>{{ showMore ? '收起更多选项 ▲' : '展开更多选项 ▼' }}</text>
				</view>
			</view>

			<!-- ====== 完整发布模式（保留原有功能）===== -->
			<view v-else class="full-form">
				<!-- 标题 -->
				<view class="form-item">
					<view class="label-row">
						<text class="required">*</text><text class="label">标题</text>
						<text class="word-count" :class="{'over-limit': form.title.length > 45}">{{ form.title.length }}/50</text>
					</view>
					<input type="text" v-model="form.title" placeholder="一句话说明你的需求，如：求购电影票2张" maxlength="50" class="input"/>
					<text class="error-tip" v-if="errors.title">{{ errors.title }}</text>
				</view>

				<!-- 任务类型（完整版也加） -->
				<view class="form-item highlight">
					<text class="label required">*</text>
					<text class="label">任务类型</text>
					<view class="type-cards-full">
						<view :class="['tc', form.taskType === 'short' ? 'active' : '']" @click="form.taskType = 'short'">
							<text>⚡ 短期任务 — 一人接取即下架</text>
						</view>
						<view :class="['tc', form.taskType === 'long' ? 'active' : '']" @click="form.taskType = 'long'">
							<text>📅 长期任务 — 多人接取长期有效</text>
						</view>
					</view>
				</view>

				<!-- 描述 -->
				<view class="form-item">
					<view class="label-row"><text class="required">*</text><text class="label">详细描述</text><text class="word-count" :class="{'over-limit': form.description.length > 450}">{{ form.description.length }}/500</text></view>
					<textarea v-model="form.description" placeholder="详细说明你的需求，包括时间、地点、具体要求等" maxlength="500" class="textarea"></textarea>
					<text class="tip">💡 详细描述能提高接单率</text>
					<text class="error-tip" v-if="errors.description">{{ errors.description }}</text>
				</view>

				<!-- 分类 -->
				<view class="form-item">
					<view class="label-row"><text class="label">分类</text></view>
					<view class="categories">
						<view v-for="(cat, index) in categories" :key="index" :class="['cat-card', form.category === cat.id ? 'active' : '']" @click="selectCategory(cat.id)">
							<text class="icon">{{ cat.icon }}</text><text class="name">{{ cat.name }}</text>
						</view>
					</view>
					<text class="error-tip" v-if="errors.category">{{ errors.category }}</text>
				</view>

				<!-- 预算 -->
				<view class="form-item">
					<view class="label-row"><text class="required">*</text><text class="label">预算（元）</text></view>
					<view class="budget-section">
						<input type="number" v-model="form.budget" placeholder="输入金额" class="budget-input"/>
						<view class="quick-budget">
							<text v-for="(amt, idx) in budgetOptions" :key="idx" :class="['budget-tag', form.budget == amt ? 'active' : '']" @click="form.budget = amt">{{ amt }}元</text>
						</view>
					</view>
					<text class="error-tip" v-if="errors.budget">{{ errors.budget }}</text>
				</view>

				<!-- 押金/位置/有效期 -->
				<view class="form-item">
					<view class="label-row"><text class="label">押金（选填）</text><text class="optional">保障交易安全</text></view>
					<input type="number" v-model="form.deposit" placeholder="可选，任务完成将退还" class="input"/>
				</view>

				<view class="form-item">
					<view class="label-row"><text class="label">图片（选填）</text><text class="optional">最多9张</text></view>
					<view class="upload-area">
						<view class="image-list">
							<view class="image-item" v-for="(img, index) in form.images" :key="index">
								<image :src="img" mode="aspectFill" class="preview-img"></image>
								<view class="remove-btn" @click="removeImage(index)">×</view>
							</view>
							<view class="upload-btn" @click="chooseImage" v-if="form.images.length < 9">
								<text class="icon">📷</text><text class="text">添加图片</text>
							</view>
						</view>
					</view>
				</view>

				<view class="form-item">
					<view class="label-row"><text class="label">位置（选填）</text></view>
					<view class="location-input" @click="chooseLocation">
						<text class="icon">📍</text><text class="text">{{ form.location || '点击选择位置' }}</text><text class="arrow">›</text>
					</view>
				</view>

				<view class="form-item">
					<view class="label-row"><text class="label">有效期</text></view>
					<picker mode="date" :value="form.expireDate" @change="onDateChange">
						<view class="picker-input"><text>{{ form.expireDate || '选择截止日期' }}</text><text class="arrow">›</text></view>
					</picker>
				</view>

				<!-- 广告位（完整版） -->
				<view class="form-item ad-section" @click="showAdOptions = !showAdOptions">
					<view class="ad-header">
						<text class="ad-title">📢 推广加持 <text class="optional">(选填)</text></text>
						<text class="expand-icon">{{ showAdOptions ? '▲' : '▼' }}</text>
					</view>
					<view class="ad-options" v-if="showAdOptions">
						<view class="ad-option" v-for="(pos, idx) in adPositions" :key="idx" @click.stop="selectAdPosition(pos)">
							<view :class="['ad-radio', selectedAdPos === pos.id ? 'checked' : '']"></view>
							<view class="ad-info">
								<text class="ad-name">{{ pos.icon }} {{ pos.name }}</text>
								<text class="ad-price">¥{{ pos.price }}/{{ pos.unit }}</text>
							</view>
						</view>
						<view class="free-ad-tip" v-if="userFreeAdCount > 0">
							<text class="tip-icon">🎁</text>
							<text class="tip-text">当前有 <text class="highlight-green">{{ userFreeAdCount }}</text> 次免费广告位！</text>
						</view>
					</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部发布按钮 -->
		<view class="footer">
			<button class="btn-publish" @click="publish" :disabled="isPublishing">
				<text v-if="!isPublishing">{{ quickMode ? '⚡ 快捷发布' : '发布任务' }}</text>
				<text v-else>发布中...</text>
			</button>
			<!-- 广告预览 -->
			<view class="ad-preview-footer" v-if="selectedAdPos && adDuration">
				<text class="ad-preview-text">+{{ selectedAdPos === 'top_pinned' ? '置顶' : selectedAdPos === 'recommend' ? '推荐' : 'Banner'}}广告 {{ adDuration }}{{ adUnit }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { AD_POSITIONS } from '@/utils/level-system.js'

export default {
	data() {
		return {
			isPublishing: false,
			quickMode: true, // 默认快捷模式
			showMore: false,
			showAdOptions: false,
			selectedAdPos: '',
			adDuration: null,
			userFreeAdCount: 1, // 模拟：用户免费广告次数
			form: {
				title: '', description: '', category: 'ticket',
				budget: '', deposit: '', images: [], location: '',
				latitude: '', longitude: '', expireDate: '',
				taskType: 'short' // short | long
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
			],
			adPositions: [
				{ id: 'top_pinned', name: '置顶推广', price: 5, unit: '小时', duration: [1,2,4,8,24], icon: '📌' },
				{ id: 'recommend', name: '热门推荐', price: 3, unit: '小时', duration: [1,2,4,8,24], icon: '🔥' },
				{ id: 'home_banner', name: '首页Banner', price: 10, unit: '天', duration: [1,3,7], icon: '🎯' }
			]
		}
	},
	computed: {
		adUnit() {
			const p = this.adPositions.find(a => a.id === this.selectedAdPos)
			return p ? (p.unit.includes('天') ? '天' : '时') : ''
		},
		totalAdCost() {
			if (!this.selectedAdPos || !this.adDuration) return 0
			const p = this.adPositions.find(a => a.id === this.selectedAdPos)
			return p ? p.price * this.adDuration : 0
		}
	},
	onLoad() {
		this.loadDraft()
		this.setDefaultDate()
		this.loadUserInfo()
	},
	methods: {
		loadUserInfo() {
			// TODO: 从API加载用户信息获取免费广告次数和等级
			const userPoints = uni.getStorageSync('user_points') || 150
			if (userPoints >= 100) this.userFreeAdCount = 1
			if (userPoints >= 300) this.userFreeAdCount = 2
			if (userPoints >= 600) this.userFreeAdCount = 3
		},
		loadDraft() {
			const draft = uni.getStorageSync('task_draft')
			if (draft) {
				uni.showModal({
					title: '发现草稿', content: '是否恢复上次未发布的草稿？',
					success: (res) => { if (res.confirm) { this.form = draft; uni.showToast({ title: '已恢复草稿', icon: 'success' }); } else { uni.removeStorageSync('task_draft'); } }
				})
			}
		},
		setDefaultDate() {
			const now = new Date(); now.setDate(now.getDate() + 7)
			this.form.expireDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
		},
		selectCategory(id) { this.form.category = id; this.$delete(this.errors, 'category'); },
		selectAdPosition(pos) { this.selectedAdPos = this.selectedAdPos === pos.id ? '' : pos.id; },
		getAdDurations() {
			const p = this.adPositions.find(a => a.id === this.selectedAdPos)
			return p ? p.duration : []
		},
		chooseImage() {
			uni.chooseImage({ count: 9 - this.form.images.length, success: (res) => { this.form.images = this.form.images.concat(res.tempFilePaths); } })
		},
		removeImage(index) { this.form.images.splice(index, 1); },
		chooseLocation() {
			uni.chooseLocation({ success: (res) => { this.form.location = res.address; this.form.latitude = res.latitude; this.form.longitude = res.longitude; } })
		},
		onDateChange(e) { this.form.expireDate = e.detail.value; },
		saveDraft() {
			if (!this.form.title && !this.form.description) return uni.showToast({ title: '暂无内容', icon: 'none' })
			uni.setStorageSync('task_draft', this.form)
			uni.showToast({ title: '草稿已保存', icon: 'success' })
		},
		validate() {
			this.errors = {}; let ok = true
			if (!this.form.title.trim()) { this.$set(this.errors,'title','请输入标题'); ok=false; }
			else if (this.form.title.length < 5) { this.$set(this.errors,'title','标题至少5字'); ok=false; }
			
			if (!this.quickMode) {
				if (!this.form.description.trim()) { this.$set(this.errors,'description','请描述详情'); ok=false; }
				else if (this.form.description.length < 10) { this.$set(this.errors,'description','至少10字'); ok=false; }
			}
			
			if (!this.form.budget) { this.$set(this.errors,'budget','请输入预算'); ok=false; }
			else if (Number(this.form.budget) < 1) { this.$set(this.errors,'budget','至少1元'); ok=false; }
			
			return ok
		},
		publish() {
			if (!this.validate()) return uni.showToast({ title: '请完善信息', icon: 'none' })
			
			this.isPublishing = true; uni.showLoading({ title: '发布中...' })

			setTimeout(() => {
				uni.hideLoading(); this.isPublishing = false;
				uni.removeStorageSync('task_draft')
				
				let msg = '✅ 发布成功！'
				if (this.form.taskType === 'short') msg += '\n⚡ 短期任务 - 一人接取后自动下架'
				else msg += '\n📅 长期任务 - 多人可持续接取'
				if (this.selectedAdPos) msg += `\n📢 已购买广告位`
				
				uni.showToast({ title: this.quickMode ? '发布成功！' : '发布成功！', icon: 'success' })
				
				setTimeout(() => { uni.switchTab({ url: '/pages/index/index' }) }, 1500)
			}, 1000)
		},
		goBack() {
			if (this.form.title || this.form.description) {
				uni.showModal({ title: '退出确认', content: '保存为草稿？', confirmText: '保存', cancelText: '不保存',
					success: (res) => { if (res.confirm) this.saveDraft(); uni.navigateBack(); }
				})
			} else uni.navigateBack()
		}
	}
}
</script>

<style>
.container { min-height: 100vh; background-color: #f5f5f5; display: flex; flex-direction: column; }

.header {
	background-color: #fff; padding: 20rpx 30rpx; display: flex; align-items: center; justify-content: space-between;
	border-bottom: 1rpx solid #eee; padding-top: 60rpx; position: sticky; top: 0; z-index: 100;
}
.header .back { font-size: 50rpx; color: #07C160; font-weight: 300; }
.header .title { font-size: 34rpx; font-weight: 500; }
.header .draft { font-size: 28rpx; color: #07C160; }

/* 模式切换 */
.mode-switch {
	display: flex; background-color: #fff; margin: 20rpx; border-radius: 16rpx;
	padding: 6rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
.mode-btn {
	flex: 1; display: flex; align-items: center; justify-content: center; gap: 8rpx;
	padding: 18rpx 0; border-radius: 12rpx; font-size: 28rpx; color: #666;
	transition: all 0.3s;
}
.mode-btn.active { background-color: #07C160; color: #fff; font-weight: 500; box-shadow: 0 4rpx 12rpx rgba(7,193,96,0.25); }
.mode-icon { font-size: 32rpx; }

.form-scroll { flex: 1; padding: 20rpx; padding-bottom: 180rpx; }

/* 表单项 */
.form-item {
	background-color: #fff; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}
.form-item.highlight { border-left: 8rpx solid #07C160; }

.label-row { display: flex; align-items: center; margin-bottom: 20rpx; }
.label-row .required { color: #f00; font-size: 32rpx; margin-right: 8rpx; }
.label-row .label { font-size: 30rpx; font-weight: 500; color: #1d1d1f; }
.word-count { margin-left: auto; font-size: 24rpx; color: #999; }
.word-count.over-limit { color: #f00; }
.optional { margin-left: auto; font-size: 22rpx; color: #999; }
.section-label { font-size: 30rpx; font-weight: 600; color: #1d1d1f; display: block; margin-bottom: 20rpx; }
.inline-label { font-size: 28rpx; font-weight: 500; color: #1d1d1f; display: block; margin-bottom: 15rpx; }

.input { width: 100%; padding: 20rpx; border: 2rpx solid #e5e5e5; border-radius: 12rpx; font-size: 28rpx; transition: border-color 0.3s; }
.input:focus { border-color: #07C160; }
.textarea { width: 100%; height: 240rpx; padding: 20rpx; border: 2rpx solid #e5e5e5; border-radius: 12rpx; font-size: 28rpx; transition: border-color 0.3s; }
.tip { font-size: 24rpx; color: #999; display: block; margin-top: 12rpx; }
.error-tip { font-size: 24rpx; color: #f00; display: block; margin-top: 12rpx; }

/* 任务类型卡片 */
.type-cards { display: flex; gap: 20rpx; }
.type-card {
	flex: 1; padding: 24rpx; border-radius: 16rpx; border: 3rpx solid #eee;
	text-align: center; transition: all 0.3s;
}
.type-card.active { border-color: #07C160; background-color: #e8f5e9; }
.type-card .type-icon { font-size: 48rpx; display: block; margin-bottom: 10rpx; }
.type-card .type-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 6rpx; }
.type-card .type-desc { font-size: 22rpx; color: #999; }
.type-card.active .type-name { color: #07C160; }

.type-cards-full { display: flex; gap: 15rpx; }
.tc {
	flex: 1; padding: 20rpx; border-radius: 14rpx; border: 2rpx solid #eee; text-align: center;
	font-size: 26rpx; transition: all 0.3s;
}
.tc.active { border-color: #07C160; background-color: #e8f5e9; color: #07C160; }

/* 快捷输入 */
.quick-input { font-size: 30rpx; font-weight: 500; text-align: center;}
.word-count-sm { display: block; text-align: right; font-size: 22rpx; color: #ccc; margin-top: 6rpx; }

.budget-inline { display: flex; align-items: center; margin-bottom: 15rpx; }
.budget-num { width: 200rpx; padding: 18rpx 20rpx; border: 2rpx solid #e5e5e5; border-radius: 12rpx; font-size: 36rpx; font-weight: bold; text-align: center; }
.yuan { font-size: 30rpx; color: #666; margin-left: 10rpx; }
.quick-budget-tags { display: flex; gap: 12rpx; flex-wrap: wrap; }
.qb-tag {
	padding: 10rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; color: #333;
	background-color: #f5f5f5; border: 2rpx solid transparent; transition: all 0.3s;
}
.qb-tag.active { background-color: #e8f5e9; color: #07C160; border-color: #07C160; }

/* 分类横向滚动 */
.cat-scroll { white-space: nowrap; margin-top: 10rpx; }
.cat-pill {
	display: inline-block; padding: 12rpx 28rpx; border-radius: 25rpx; font-size: 26rpx; color: #666;
	background-color: #f5f5f5; margin-right: 12rpx; transition: all 0.3s;
}
.cat-pill.active { background-color: #07C160; color: #fff; }

/* 广告区域 */
.ad-section { border-left: 6rpx solid #ffd700; cursor: pointer; }
.ad-header { display: flex; justify-content: space-between; align-items: center; }
.ad-title { font-size: 28rpx; font-weight: 500; color: #1d1d1f; }
.expand-icon { font-size: 24rpx; color: #999; }
.ad-options { margin-top: 20rpx; }
.ad-option { display: flex; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.ad-radio { width: 36rpx; height: 36rpx; border-radius: 50%; border: 3rpx solid #ddd; margin-right: 16rpx; flex-shrink: 0; transition: all 0.3s; }
.ad-radio.checked { background-color: #ffd700; border-color: #ffd700; }
.ad-info { flex: 1; display: flex; justify-content: space-between; align-items: center; }
.ad-name { font-size: 28rpx; font-weight: 500; }
.ad-price { font-size: 26rpx; color: #ff9800; font-weight: bold; }
.free-ad-tip { display: flex; align-items: center; gap: 10rpx; padding: 16rpx; background-color: #fff8e1; border-radius: 12rpx; margin-top: 15rpx; }
.tip-icon { font-size: 32rpx; }
.tip-text { font-size: 24rpx; color: #666; }
.highlight-green { color: #07C160; font-weight: bold; }

.ad-duration { margin-top: 15rpx; }
.duration-label { font-size: 26rpx; color: #666; }
.duration-tag {
	display: inline-block; padding: 8rpx 22rpx; margin: 8rpx 8rpx 0 0; border-radius: 15rpx;
	font-size: 24rpx; color: #666; background-color: #f5f5f5; border: 2rpx solid transparent; transition: all 0.3s;
}
.duration-tag.active { background-color: #fff8e1; color: #ff9800; border-color: #ffc107; }

.toggle-more { text-align: center; padding: 20rpx; color: #07C160; font-size: 26rpx; }

/* 分类网格 */
.categories { display: flex; flex-wrap: wrap; gap: 20rpx; }
.cat-card {
	display: flex; flex-direction: column; align-items: center; justify-content: center;
	width: 160rpx; height: 140rpx; background-color: #f9f9f9; border-radius: 16rpx; border: 2rpx solid transparent; transition: all 0.3s;
}
.cat-card.active { background-color: #e8f5e9; border-color: #07C160; box-shadow: 0 4rpx 12rpx rgba(7,193,96,0.2); }
.cat-card .icon { font-size: 48rpx; margin-bottom: 10rpx; }
.cat-card .name { font-size: 24rpx; color: #333; }
.cat-card.active .name { color: #07C160; font-weight: 500; }
.budget-input { width: 100%; padding: 20rpx; border: 2rpx solid #e5e5e5; border-radius: 12rpx; font-size: 32rpx; font-weight: 500; margin-bottom: 20rpx; }
.budget-input:focus { border-color: #07C160; }
.quick-budget { display: flex; flex-wrap: wrap; gap: 15rpx; }
.budget-tag { padding: 12rpx 30rpx; background-color: #f5f5f5; border-radius: 25rpx; font-size: 26rpx; color: #333; border: 2rpx solid transparent; transition: all 0.3s; }
.budget-tag.active { background-color: #e8f5e9; color: #07C160; border-color: #07C160; }
.upload-area {}
.image-list { display: flex; flex-wrap: wrap; gap: 15rpx; }
.image-item { position: relative; width: 200rpx; height: 200rpx; }
.preview-img { width: 100%; height: 100%; border-radius: 12rpx; }
.remove-btn {
	position: absolute; top: -10rpx; right: -10rpx; width: 44rpx; height: 44rpx;
	background-color: #f00; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center;
	font-size: 32rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2);
}
.upload-btn { width: 200rpx; height: 200rpx; border: 2rpx dashed #ddd; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
.upload-btn:active { background-color: #f5f5f5; }
.upload-btn .icon { font-size: 60rpx; }
.upload-btn .text { font-size: 22rpx; color: #999; margin-top: 10rpx; }
.location-input, .picker-input { display: flex; align-items: center; padding: 20rpx; background-color: #f9f9f9; border-radius: 12r; border: 2rpx solid #e5e5e5; transition: border-color 0.3s; }
.location-input:active, .picker-input:active { border-color: #07C160; }
.location-input .icon { font-size: 32rpx; margin-right: 15rpx; }
.location-input .text, .picker-input text { flex: 1; font-size: 28rpx; color: #333; }
.arrow { color: #ccc; font-size: 36rpx; }
.footer { position: fixed; bottom: 0; left: 0; right: 0; background-color: #fff; padding: 20rpx 30rpx; padding-bottom: 40rpx; box-shadow: 0 -4rpx 16rpx rgba(0,0,0,0.08); }
.btn-publish {
	width: 100%; background: linear-gradient(135deg, #07C160, #06AD56);
	color: #fff; padding: 28rpx; border-radius: 40rpx; font-size: 32rpx; font-weight: bold;
	border: none; box-shadow: 0 4rpx 16rpx rgba(7,193,96,0.3);
}
.btn-publish:active { transform: scale(0.98); }
.btn-publish[disabled] { background: #ccc; box-shadow: none; }
.ad-preview-footer { text-align: center; margin-top: 10rpx; }
.ad-preview-text { font-size: 24rpx; color: #ff9800; font-weight: 500; }
</style>
