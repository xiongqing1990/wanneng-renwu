<template>
	<view class="container">
		<view class="header">
			<text class="title">帮助与反馈</text>
		</view>
		
		<!-- 常见问题 -->
		<view class="section">
			<text class="section-title">常见问题</text>
			<view class="faq-list">
				<view class="faq-item" v-for="(item, index) in faqs" :key="index" @click="toggleFaq(index)">
					<view class="question">
						<text class="icon">❓</text>
						<text class="text">{{ item.question }}</text>
					</view>
					<view class="answer" v-if="item.show">
						<text>{{ item.answer }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 反馈类型 -->
		<view class="section">
			<text class="section-title">意见反馈</text>
			<view class="feedback-types">
				<view 
					v-for="(type, index) in feedbackTypes" 
					:key="index"
					:class="['type-item', selectedType === type ? 'active' : '']"
					@click="selectedType = type"
				>
					{{ type }}
				</view>
			</view>
		</view>
		
		<!-- 反馈内容 -->
		<view class="section">
			<text class="section-title">反馈内容</text>
			<textarea 
				class="feedback-input" 
				v-model="feedbackContent" 
				placeholder="请详细描述您遇到的问题或建议..."
				maxlength="500"
			/>
			<text class="word-count">{{ feedbackContent.length }}/500</text>
		</view>
		
		<!-- 联系方式 -->
		<view class="section">
			<text class="section-title">联系方式（选填）</text>
			<input class="contact-input" v-model="contact" placeholder="手机号或邮箱" />
		</view>
		
		<!-- 提交按钮 -->
		<button class="btn-submit" @click="submitFeedback">提交反馈</button>
		
		<!-- 联系客服 -->
		<view class="customer-service">
			<text class="title">联系客服</text>
			<view class="methods">
				<view class="method" @click="callCustomerService">
					<text class="icon">📞</text>
					<text class="label">电话客服</text>
				</view>
				<view class="method" @click="openChat">
					<text class="icon">💬</text>
					<text class="label">在线客服</text>
				</view>
				<view class="method" @click="sendEmail">
					<text class="icon">📧</text>
					<text class="label">邮件</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			faqs: [
				{
					question: '如何发布任务？',
					answer: '点击底部"发布"按钮，填写任务标题、描述、预算等信息，发布即可。',
					show: false
				},
				{
					question: '押金是什么？',
					answer: '押金是为了保障交易双方权益的保证金，任务完成后会自动退还。',
					show: false
				},
				{
					question: '如何提现押金？',
					answer: '在我的-保证金页面可以申请提现，一般3-5个工作日到账。',
					show: false
				},
				{
					question: '任务完成后如何确认？',
					answer: '双方确认任务完成后，可在任务详情页点击"确认完成"按钮。',
					show: false
				},
				{
					question: '遇到骗子怎么办？',
					answer: '请立即举报，我们会第一时间处理并保护您的权益。',
					show: false
				}
			],
			feedbackTypes: ['功能建议', 'Bug反馈', '服务投诉', '其他'],
			selectedType: '',
			feedbackContent: '',
			contact: ''
		}
	},
	methods: {
		toggleFaq(index) {
			this.faqs[index].show = !this.faqs[index].show;
		},
		submitFeedback() {
			if (!this.feedbackContent) {
				uni.showToast({ title: '请输入反馈内容', icon: 'none' });
				return;
			}
			if (!this.selectedType) {
				uni.showToast({ title: '请选择反馈类型', icon: 'none' });
				return;
			}
			uni.showLoading({ title: '提交中...' });
			setTimeout(() => {
				uni.hideLoading();
				uni.showToast({ title: '提交成功', icon: 'success' });
				this.feedbackContent = '';
				this.selectedType = '';
				this.contact = '';
			}, 1000);
		},
		callCustomerService() {
			uni.makePhoneCall({ phoneNumber: '400-888-8888' });
		},
		openChat() {
			uni.navigateTo({ url: '/pages/chat/detail?name=客服' });
		},
		sendEmail() {
			uni.showToast({ title: '请发送邮件至 support@wanneng.com', icon: 'none', duration: 3000 });
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
	background-color: #07C160;
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
	font-size: 30rpx;
	font-weight: bold;
	margin-bottom: 25rpx;
	display: block;
}
.faq-list {
	
}
.faq-item {
	border-bottom: 1rpx solid #f5f5f5;
}
.faq-item:last-child {
	border-bottom: none;
}
.faq-item .question {
	display: flex;
	align-items: center;
	padding: 25rpx 0;
}
.faq-item .question .icon {
	margin-right: 15rpx;
}
.faq-item .question .text {
	flex: 1;
	font-size: 28rpx;
}
.faq-item .answer {
	padding: 0 0 25rpx 50rpx;
	font-size: 26rpx;
	color: #666;
	line-height: 1.6;
}
.feedback-types {
	display: flex;
	flex-wrap: wrap;
	gap: 20rpx;
}
.feedback-types .type-item {
	padding: 15rpx 30rpx;
	background-color: #f5f5f5;
	border-radius: 30rpx;
	font-size: 26rpx;
	color: #666;
}
.feedback-types .type-item.active {
	background-color: #07C160;
	color: #fff;
}
.feedback-input {
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
.contact-input {
	width: 100%;
	padding: 20rpx;
	border: 1rpx solid #eee;
	border-radius: 10rpx;
	font-size: 28rpx;
}
.btn-submit {
	background-color: #07C160;
	color: #fff;
	padding: 25rpx;
	border-radius: 50rpx;
	font-size: 32rpx;
	margin: 30rpx 20rpx;
}
.customer-service {
	background-color: #fff;
	margin: 20rpx;
	padding: 30rpx;
	border-radius: 16rpx;
}
.customer-service .title {
	font-size: 30rpx;
	font-weight: bold;
	display: block;
	margin-bottom: 25rpx;
}
.customer-service .methods {
	display: flex;
	justify-content: space-around;
}
.customer-service .method {
	display: flex;
	flex-direction: column;
	align-items: center;
}
.customer-service .method .icon {
	font-size: 50rpx;
	margin-bottom: 15rpx;
}
.customer-service .method .label {
	font-size: 24rpx;
	color: #666;
}
</style>