<template>
	<view class="container">
		<!-- 顶部导航 -->
		<view class="header">
			<text class="back" @click="goBack">‹</text>
			<view class="chat-user-info" @click="viewUserProfile">
				<image class="user-avatar" :src="chatAvatar || '/static/default-avatar.png'" mode="aspectFill"></image>
				<view class="user-detail">
					<text class="user-name">{{ chatName }}</text>
					<view class="online-status" :class="{ online: isOnline }">
						<view class="status-dot"></view>
						<text>{{ isOnline ? '在线' : '离线' }}</text>
					</view>
				</view>
			</view>
			<view class="header-right">
				<text class="icon-btn" @click="showChatInfo">ℹ</text>
			</view>
		</view>

		<!-- 聊天消息区域 -->
		<scroll-view
			scroll-y class="chat-area"
			:scroll-into-view="scrollToView"
			refresher-enabled @refresherrefresh="loadMoreHistory"
			:refresher-triggered="isLoadingHistory"
			refresher-background="#f5f5f5"
		>
			<!-- 历史消息加载提示 -->
			<view class="history-tip" v-if="isLoadingHistory">
				<view class="loading-spinner"></view><text>加载更早消息...</text>
			</view>

			<!-- 消息列表 -->
			<view v-for="(msg, index) in messages" :key="index"
				:id="'msg-' + index"
				:class="['msg-item', msg.type, msg.isMine ? 'sent' : 'received']"
				@longpress="showMsgAction(msg, index)"
			>
				<!-- 时间分隔 -->
				<view class="time-divider" v-if="msg.showTime">
					<text>{{ msg.time }}</text>
				</view>

				<!-- 系统消息 -->
				<view class="system-msg" v-if="msg.msgType === 'system'">
					<text>{{ msg.content }}</text>
				</view>

				<!-- 任务卡片消息（新增） -->
				<view class="task-card-msg" v-if="msg.msgType === 'task'" @click="goToTask(msg.taskId)">
					<view class="task-card-inner">
						<text class="tc-title">{{ msg.taskTitle }}</text>
						<view class="tc-meta">
							<text>¥{{ msg.taskBudget }}</text>
							<text>{{ msg.taskCategory }}</text>
						</view>
						<text class="tc-action">查看详情 ›</text>
					</view>
				</view>

				<!-- 普通消息 -->
				<view class="bubble-box" v-if="msg.msgType === 'normal' || msg.msgType === ''">
					<image class="avatar" :src="msg.avatar" v-if="!msg.isMine" @click="viewUserProfile(msg)"></image>
					<view class="bubble-wrap">
						<!-- 发送者昵称（群聊/非好友场景） -->
						<text class="sender-name" v-if="!msg.isMine && showSenderName">{{ chatName }}</text>
						<view class="bubble" :class="{'text': msg.contentType === 'text', 'image': msg.contentType === 'image'}">
							<text class="text-content" v-if="msg.contentType === 'text'">{{ msg.content }}</text>
							<image class="msg-image" :src="msg.content" v-if="msg.contentType === 'image'" mode="widthFix" @click="previewImage(msg.content)"></image>
						</view>
						<!-- 消息状态（发送方） -->
						<view class="msg-status" v-if="msg.isMine">
							<text :class="['status-icon', msg.status]">
								{{ msg.status === 'sending' ? '●' : msg.status === 'sent' : '✓✓' }}
							</text>
						</view>
					</view>
					<image class="avatar" :src="myAvatar" v-if="msg.isMine"></image>
				</view>
			</view>

			<!-- 对方正在输入 -->
			<view class="typing-indicator" v-if="isTyping">
				<view class="typing-dots"><view class="dot"></view><view class="dot"></view><view class="dot"></view></view>
				<text>对方正在输入...</text>
			</view>

			<view id="msg-bottom"></view>
		</scroll-view>

		<!-- 底部输入栏 -->
		<view class="input-bar">
			<text class="icon-btn" @click="toggleEmoji">😊</text>
			<view class="input-box">
				<input type="text" v-model="inputMsg" placeholder="输入消息..." @confirm="sendMessage"
					confirm-type="send" adjust-position @focus="onInputFocus" @blur="onInputBlur"/>
			</view>
			<text class="icon-btn" @click="chooseImage">📎</text>
		<view class="send-btn" v-if="inputMsg.trim()" @click="sendMessage">发送</view>
			<text class="icon-btn voice-btn" v-else @touchstart="startRecord" @touchend="stopRecord">🎤</text>
		</view>

		<!-- 表情面板 -->
		<view class="emoji-panel" v-if="showEmojiPanel">
			<view class="emoji-grid">
				<text v-for="(emoji, idx) in emojis" :key="idx" class="emoji-item" @click="insertEmoji(emoji)">{{ emoji }}</text>
			</view>
		</view>

		<!-- 语音录制提示 -->
		<view class="voice-overlay" v-if="isRecording">
			<view class="voice-hint"><text class="voice-icon">🎙️</text><text>松开发送，上滑取消</text></view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			chatName: '聊天',
			chatAvatar: '',
			isOnline: true,
			showSenderName: false,
			myAvatar: '/static/default-avatar.png',
			inputMsg: '',
			scrollToView: '',
			isLoadingHistory: false,
			showEmojiPanel: false,
			isTyping: false,
			isRecording: false,
			recordTimer: null,
			messages: [],
			emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','🥴','😠','😡','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🤠','🤡','🤥','🤫','🤭','🧐','🤓']
		}
	},
	onLoad(options) {
		if (options.name) { this.chatName = options.name; uni.setNavigationBarTitle({ title: options.name }) }
		if (options.avatar) this.chatAvatar = decodeURIComponent(options.avatar)
		this.loadMessages()
	},
	onReady() { setTimeout(() => { this.scrollToBottom() }, 300) },
	methods: {
		loadMessages() {
			this.messages = [
				{ isMine: false, msgType: 'normal', contentType: 'text', content: '你好，我想咨询一下这个任务', avatar: this.chatAvatar || '/static/avatar1.png', time: '10:30', showTime: true, status: 'read' },
				{ isMine: true, msgType: 'normal', contentType: 'text', content: '好的，请问有什么问题？', avatar: this.myAvatar, time: '10:31', showTime: false, status: 'read' },
				{ isMine: false, msgType: 'normal', contentType: 'text', content: '预算可以商量吗？', avatar: this.chatAvatar || '/static/avatar1.png', time: '10:32', showTime: false, status: 'delivered' },
				{ isMine: true, msgType: 'normal', contentType: 'text', content: '可以的，具体你想出多少？', avatar: this.myAvatar, time: '10:33', showTime: false, status: 'read' },
				{ isMine: false, msgType: 'task', contentType: '', content: '', taskTitle: '求5月15日电影票2张', taskBudget: 30, taskCategory: '票券', taskId: 1, avatar: '', time: '10:34', showTime: true },
				{ isMine: false, msgType: 'normal', contentType: 'text', content: '50元可以吗？', avatar: this.chatAvatar || '/static/avatar1.png', time: '10:35', showTime: false, status: 'delivered' }
			]
		},

		sendMessage() {
			if (!this.inputMsg.trim()) return

			const now = new Date()
			const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0')

			this.messages.push({
				isMine: true, msgType: 'normal', contentType: 'text',
				content: this.inputMsg, avatar: this.myAvatar,
				time: timeStr, showTime: true, status: 'sending'
			})

			const sentContent = this.inputMsg
			this.inputMsg = ''
			this.showEmojiPanel = false
			this.scrollToBottom()

			// 模拟发送状态变化：sending -> sent -> delivered
			const lastIdx = this.messages.length - 1
			setTimeout(() => {
				this.messages[lastIdx].status = 'sent'
				setTimeout(() => { this.messages[lastIdx].status = 'delivered' }, 800)
			}, 500)

			// 模拟对方正在输入
			this.isTyping = true
			setTimeout(() => { this.isTyping = false; }, 2000)

			// 模拟对方回复
			setTimeout(() => {
				this.messages.push({
					isMine: false, msgType: 'normal', contentType: 'text',
					content: '好的，收到！' + (sentContent.includes('价') ? '价格我们可以再聊。' : ''),
					avatar: this.chatAvatar || '/static/avatar1.png',
					time: timeStr, showTime: false, status: 'delivered'
				})
				this.scrollToBottom()
				this.saveChatToLocal()
			}, 2500)
		},

		sendTaskCard(taskId, title, budget, category) {
			const now = new Date()
			const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0')
			this.messages.push({
				isMine: true, msgType: 'task', contentType: '',
				taskId, taskTitle: title, taskBudget: budget, taskCategory: category,
				avatar: this.myAvatar, time: timeStr, showTime: true, status: 'delivered'
			})
			this.scrollToBottom()
		},

		saveChatToLocal() {
			try {
				const chatKey = 'chat_' + (this.chatName || 'default')
				uni.setStorageSync(chatKey, {
					name: this.chatName,
					messages: this.messages.slice(-50), // 只存最近50条
					lastActive: new Date().getTime()
				})
			} catch(e) {}
		},

		insertEmoji(e) { this.inputMsg += e },
		toggleEmoji() { this.showEmojiPanel = !this.showEmojiPanel },
		chooseImage() {
			uni.chooseImage({ count: 9, success: (res) => {
				res.tempFilePaths.forEach(path => {
					const now = new Date()
					const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0')
					this.messages.push({
						isMine: true, msgType: 'normal', contentType: 'image',
						content: path, avatar: this.myAvatar, time: timeStr, showTime: true, status: 'sent'
					})
				})
				this.scrollToBottom()
			}})
		},
		previewImage(url) { uni.previewImage({ urls: [url] }) },

		startRecord() {
			this.isRecording = true
			this.recordStartTime = Date.now()
			// TODO: 实际录音逻辑
		},
		stopRecord() {
			if (!this.isRecording) return
			const duration = Math.round((Date.now() - this.recordStartTime) / 1000)
			this.isRecording = false
			
			if (duration < 1) {
				uni.showToast({ title: '说话时间太短', icon: 'none' })
				return
			}

			// 模拟语音消息
			const now = new Date()
			const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0')
			this.messages.push({
				isMine: true, msgType: 'normal', contentType: 'voice',
				content: `${duration}"`, avatar: this.myAvatar, time: timeStr, showTime: true, status: 'sent'
			})
			this.scrollToBottom()
			uni.showToast({ title: `已发送 ${duration}秒 语音`, icon: 'success' })
		},

		showMsgAction(msg, index) {
			let items = ['复制', '删除']
			if (msg.contentType === 'text') items.splice(0, 0, '转发')
			
			uni.showActionSheet({
				itemList: items,
				success: (res) => {
					if (items[res.tapIndex] === '复制') {
						uni.setClipboardData({ data: msg.content })
					} else if (items[res.tapIndex] === '删除') {
						this.messages.splice(index, 1)
						uni.showToast({ title: '已删除', icon: 'success' })
					}
				}
			})
		},

		viewUserProfile(msg) { uni.showToast({ title: '查看用户资料', icon: 'none' }) },
		goToTask(taskId) {
			uni.navigateTo({ url: `/pages/detail/detail?id=${taskId}` })
		},
		showChatInfo() {
			uni.showActionSheet({
				itemList: ['查看TA的资料', '清空聊天记录', '举报'],
				success: (res) => {
					if (res.tapIndex === 0) this.viewUserProfile()
					else if (res.tapIndex === 1) {
						uni.showModal({ title: '确认', content: '确定清空所有聊天记录吗？', confirmColor: '#f00', success: (res) => {
							if (res.confirm) { this.messages = []; uni.showToast({ title: '已清空', icon: 'success' }); }
						}})
					}
				}
			})
		},
		onInputFocus() { this.showEmojiPanel = false; setTimeout(() => { this.scrollToBottom(); }, 300); },
		onInputBlur() {},
		scrollToBottom() {
			this.scrollToView = ''
			setTimeout(() => { this.scrollToView = 'msg-bottom' }, 100)
		},
		loadMoreHistory() {
			this.isLoadingHistory = true
			setTimeout(() => {
				this.messages.unshift({
					isMine: false, msgType: 'normal', contentType: 'text',
					content: '你好，在吗？', avatar: this.chatAvatar || '/static/avatar1.png',
					time: '10:00', showTime: true, status: 'read'
				})
				this.isLoadingHistory = false
			}, 800)
		},
		goBack() { uni.navigateBack() }
	}
}
</script>

<style>
.container { min-height: 100vh; background-color: #f5f5f5; display: flex; flex-direction: column; }

.header { background-color: #fff; padding: 20rpx 30rpx; display: flex; align-items: center; justify-content: space-between; border-bottom: 1rpx solid #e5e5e5; padding-top: 60rpx; position: sticky; top: 0; z-index: 100; }
.header .back { font-size: 50rpx; color: #07C160; font-weight: 300; flex-shrink: 0; }

/* 聊天对象信息 */
.chat-user-info { display: flex; align-items: center; gap: 12rpx; flex: 1; overflow: hidden; margin-left: 16rpx; }
.user-avatar { width: 64rpx; height: 64rpx; border-radius: 12rpx; flex-shrink: 0; }
.user-detail { display: flex; flex-direction: column; gap: 4rpx; overflow: hidden; }
.user-name { font-size: 32rpx; font-weight: bold; color: #1d1d1f; }
.online-status { display: flex; align-items: center; gap: 6rpx; font-size: 22rpx; color: #ccc; }
.online-status.online .status-dot { background-color: #07C160; }
.status-dot { width: 14rpx; height: 14rpx; border-radius: 50%; background-color: #ccc; }

.header-right { display: flex; gap: 20rpx; flex-shrink: 0; }
.icon-btn { font-size: 44rpx; width: 60rpx; text-align: center; color: #07C160; }

.chat-area { flex: 1; padding: 20rpx; overflow-y: auto; }
.history-tip { display: flex; align-items: center; justify-content: center; padding: 20rpx; gap: 15rpx; font-size: 24rpx; color: #999; }
.loading-spinner { width: 30rpx; height: 30rpx; border: 3rpx solid #e5e5e5; border-top-color: #07C160; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.msg-item { margin-bottom: 30rpx; }
.time-divider { text-align: center; padding: 10rpx 0; }
.time-divider text { font-size: 22rpx; color: #999; background-color: #e5e5e5; padding: 5rpx 20rpx; border-radius: 10rpx; }
.system-msg { text-align: center; padding: 10rpx 0; }
.system-msg text { font-size: 22rpx; color: #999; background-color: #e8e8e8; padding: 8rpx 20rpx; border-radius: 10rpx; }

/* 任务卡片消息 */
.task-card-msg { display: flex; justify-content: center; margin-bottom: 20rpx; }
.task-card-inner {
	background-color: #fff; border-radius: 16rpx; padding: 24rpx;
	width: 80%; box-shadow: 0 3rpx 12rpx rgba(0,0,0,0.08);
	border-left: 6rpx solid #07C160;
}
.tc-title { font-size: 28rpx; font-weight: bold; color: #1d1d1f; display: block; margin-bottom: 12rpx; }
.tc-meta { display: flex; gap: 20rpx; margin-bottom: 12rpx; }
.tc-meta text { font-size: 26rpx; color: #666; }
.tc-meta text:first-child { color: #07C160; font-weight: bold; font-size: 30rpx; }
.tc-action { font-size: 24rpx; color: #07C160; font-weight: 500; }

.bubble-box { display: flex; align-items: flex-start; padding: 0 20rpx; }
.bubble-box .avatar { width: 72rpx; height: 72rpx; border-radius: 10rpx; flex-shrink: 0; }
.bubble-wrap { max-width: 65%; position: relative; }
.sender-name { font-size: 22rpx; color: #999; margin-bottom: 6rpx; display: block; padding-left: 8rpx; }
.bubble { max-width: 100%; padding: 20rpx 24rpx; font-size: 30rpx; line-height: 1.6; word-break: break-all; border-radius: 18rpx; position: relative; }
.bubble.text {}
.bubble.image { padding: 10rpx; }
.msg-item.received .bubble-box { flex-direction: row; }
.msg-item.received .bubble { background-color: #fff; border-radius: 0 20rpx 20rpx 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.msg-item.sent .bubble-box { flex-direction: row-reverse; }
.msg-item.sent .bubble { background-color: #95ec69; border-radius: 20rpx 0 20rpx 20rpx; }
.text-content {}

.msg-image { max-width: 400rpx; border-radius: 10rpx; display: block; }

/* 消息状态 */
.msg-status { display: flex; justify-content: flex-end; padding: 4rpx 8rpx 0 0; }
.status-icon { font-size: 20rpx; color: #ccc; line-height: 1; }
.status-icon.sending { color: #999; }
.status-icon.sent { color: #999; }
.status-icon.delivered { color: #07C160; }
.status-icon.read { color: #07C160; }

/* 正在输入 */
.typing-indicator { display: flex; align-items: center; justify-content: center; padding: 10rpx 20rpx; gap: 12rpx; margin-left: 120rpx; }
.typing-dots { display: flex; gap: 6rpx; }
.typing-dots .dot { width: 10rpx; height: 10rpx; background-color: #bbb; border-radius: 50%; animation: typing-bounce 1.4s infinite both; }
.typing-dots .dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dots .dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes typing-bounce { 0%,80%,100% { transform: scale(0); } 40% { transform: scale(1.0); } }
.typing-indicator text { font-size: 22rpx; color: #999; }

/* 底部输入栏 */
.input-bar { background-color: #f5f5f5; padding: 15rpx 20rpx; display: flex; align-items: center; gap: 15rpx; border-top: 1rpx solid #e5e5e5; padding-bottom: 30rpx; }
.input-box { flex: 1; background-color: #fff; border-radius: 30rpx; padding: 15rpx 25rpx; box-shadow: inset 0 2rpx 6rpx rgba(0,0,0,0.04); }
.input-box input { font-size: 30rpx; width: 100%; }
.send-btn { background-color: #07C160; color: #fff; padding: 15rpx 30rpx; border-radius: 20rpx; font-size: 28rpx; font-weight: 500; }
.voice-btn { font-size: 44rpx; }

/* 表情面板 */
.emoji-panel { background-color: #fff; padding: 20rpx; border-top: 1rpx solid #e5e5e5; max-height: 400rpx; overflow-y: auto; }
.emoji-grid { display: flex; flex-wrap: wrap; gap: 15rpx; }
.emoji-item { font-size: 44rpx; width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; }
.emoji-item:active { background-color: #f5f5f5; border-radius: 10rpx; }

/* 语音录制覆盖层 */
.voice-overlay {
	position: fixed; top: 0; left: 0; right: 0; bottom: 0;
	background-color: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 999;
}
.voice-hint { background-color: #fff; padding: 40rpx 60rpx; border-radius: 20rpx; display: flex; flex-direction: column; align-items: center; gap: 20rpx; }
.voice-icon { font-size: 80rpx; }
.voice-hint text:last-child { font-size: 28rpx; color: #333; }
</style>
