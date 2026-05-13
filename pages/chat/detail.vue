<template>
	<view class="container">
		<!-- 顶部导航 -->
		<view class="header">
			<text class="back" @click="goBack">‹</text>
			<text class="title">{{ chatName }}</text>
			<view class="header-right">
				<text class="icon-btn" @click="showChatInfo">ℹ</text>
			</view>
		</view>
		
		<!-- 聊天消息区域 -->
		<scroll-view 
			scroll-y 
			class="chat-area" 
			:scroll-into-view="scrollToView"
			refresher-enabled
			@refresherrefresh="loadMoreHistory"
			:refresher-triggered="isLoadingHistory"
			refresher-background="#f5f5f5"
		>
			<!-- 历史消息加载提示 -->
			<view class="history-tip" v-if="isLoadingHistory">
				<view class="loading-spinner"></view>
				<text>加载更早消息...</text>
			</view>
			
			<!-- 消息列表 -->
			<view 
				v-for="(msg, index) in messages" 
				:key="index"
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
				
				<!-- 普通消息 -->
				<view class="bubble-box" v-if="msg.msgType !== 'system'">
					<image class="avatar" :src="msg.avatar" v-if="!msg.isMine" @click="viewUserProfile(msg)"></image>
					<view class="bubble" :class="{'text': msg.contentType === 'text', 'image': msg.contentType === 'image'}">
						<text class="text-content" v-if="msg.contentType === 'text'">{{ msg.content }}</text>
						<image class="msg-image" :src="msg.content" v-if="msg.contentType === 'image'" mode="widthFix" @click="previewImage(msg.content)"></image>
					</view>
					<image class="avatar" :src="myAvatar" v-if="msg.isMine"></image>
				</view>
			</view>
			
			<!-- 底部占位（让消息从底部开始显示） -->
			<view id="msg-bottom"></view>
		</scroll-view>
		
		<!-- 底部输入栏 -->
		<view class="input-bar">
			<text class="icon-btn" @click="toggleEmoji">😊</text>
			<view class="input-box">
				<input 
					type="text" 
					v-model="inputMsg" 
					placeholder="输入消息..." 
					@confirm="sendMessage"
					confirm-type="send"
					adjust-position
					@focus="onInputFocus"
				/>
			</view>
			<text class="icon-btn" @click="chooseImage">📎</text>
			<view class="send-btn" v-if="inputMsg.trim()" @click="sendMessage">发送</view>
			<text class="icon-btn voice-btn" v-else @click="startVoice">🎤</text>
		</view>
		
		<!-- 表情面板 -->
		<view class="emoji-panel" v-if="showEmojiPanel">
			<view class="emoji-grid">
				<text 
					v-for="(emoji, idx) in emojis" 
					:key="idx"
					class="emoji-item"
					@click="insertEmoji(emoji)"
				>{{ emoji }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			chatName: '聊天',
			myAvatar: '/static/avatar-me.png',
			inputMsg: '',
			scrollToView: '',
			isLoadingHistory: false,
			showEmojiPanel: false,
			messages: [],
			emojis: ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '🥴', '😠', '😡', '🤬', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🤠', '🤡', '🤥', '🤫', '🤭', '🧐', '🤓']
		}
	},
	onLoad(options) {
		if (options.name) {
			this.chatName = options.name;
			uni.setNavigationBarTitle({
				title: options.name
			});
		}
		this.loadMessages();
	},
	onReady() {
		setTimeout(() => {
			this.scrollToBottom();
		}, 300);
	},
	methods: {
		loadMessages() {
			this.messages = [
				{
					isMine: false,
					msgType: 'normal',
					contentType: 'text',
					content: '你好，我想咨询一下那个任务',
					avatar: '/static/avatar1.png',
					time: '10:30',
					showTime: true
				},
				{
					isMine: true,
					msgType: 'normal',
					contentType: 'text',
					content: '好的，请问有什么问题？',
					avatar: this.myAvatar,
					time: '10:31',
					showTime: false
				},
				{
					isMine: false,
					msgType: 'normal',
					contentType: 'text',
					content: '预算可以商量吗？',
					avatar: '/static/avatar1.png',
					time: '10:32',
					showTime: false
				},
				{
					isMine: true,
					msgType: 'normal',
					contentType: 'text',
					content: '可以的，具体你想出多少？',
					avatar: this.myAvatar,
					time: '10:33',
					showTime: false
				},
				{
					isMine: false,
					msgType: 'normal',
					contentType: 'text',
					content: '50元可以吗？',
					avatar: '/static/avatar1.png',
					time: '10:34',
					showTime: false
				}
			];
		},
		sendMessage() {
			if (!this.inputMsg.trim()) return;
			
			const now = new Date();
			const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
			
			this.messages.push({
				isMine: true,
				msgType: 'normal',
				contentType: 'text',
				content: this.inputMsg,
				avatar: this.myAvatar,
				time: timeStr,
				showTime: true
			});
			
			this.inputMsg = '';
			this.showEmojiPanel = false;
			
			this.scrollToBottom();
			
			// 模拟对方回复
			setTimeout(() => {
				this.messages.push({
					isMine: false,
					msgType: 'normal',
					contentType: 'text',
					content: '好的，收到！',
					avatar: '/static/avatar1.png',
					time: timeStr,
					showTime: false
				});
				this.scrollToBottom();
			}, 1000);
		},
		insertEmoji(emoji) {
			this.inputMsg += emoji;
		},
		toggleEmoji() {
			this.showEmojiPanel = !this.showEmojiPanel;
		},
		chooseImage() {
			uni.chooseImage({
				count: 1,
				success: (res) => {
					const now = new Date();
					const timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
					
					this.messages.push({
						isMine: true,
						msgType: 'normal',
						contentType: 'image',
						content: res.tempFilePaths[0],
						avatar: this.myAvatar,
						time: timeStr,
						showTime: true
					});
					
					this.scrollToBottom();
				}
			});
		},
		previewImage(url) {
			uni.previewImage({
				urls: [url]
			});
		},
		startVoice() {
			uni.showToast({ title: '按住说话', icon: 'none' });
		},
		showMsgAction(msg, index) {
			uni.showActionSheet({
				itemList: ['复制', '删除', '转发'],
				success: (res) => {
					if (res.tapIndex === 0) {
						uni.setClipboardData({
							data: msg.content
						});
					} else if (res.tapIndex === 1) {
						this.messages.splice(index, 1);
						uni.showToast({ title: '已删除', icon: 'success' });
					}
				}
			});
		},
		viewUserProfile(msg) {
			uni.showToast({ title: '查看用户资料', icon: 'none' });
		},
		showChatInfo() {
			uni.showActionSheet({
				itemList: ['清空聊天记录', '举报'],
				success: (res) => {
					if (res.tapIndex === 0) {
						uni.showModal({
							title: '确认',
							content: '确定清空所有聊天记录吗？',
							success: (res) => {
								if (res.confirm) {
									this.messages = [];
									uni.showToast({ title: '已清空', icon: 'success' });
								}
							}
						});
					}
				}
			});
		},
		onInputFocus() {
			this.showEmojiPanel = false;
			setTimeout(() => {
				this.scrollToBottom();
			}, 300);
		},
		scrollToBottom() {
			this.scrollToView = '';
			setTimeout(() => {
				this.scrollToView = 'msg-bottom';
			}, 100);
		},
		loadMoreHistory() {
			this.isLoadingHistory = true;
			setTimeout(() => {
				const historyMsgs = [
					{
						isMine: false,
						msgType: 'normal',
						contentType: 'text',
						content: '你好，在吗？',
						avatar: '/static/avatar1.png',
						time: '10:00',
						showTime: true
					}
				];
				
				this.messages = historyMsgs.concat(this.messages);
				this.isLoadingHistory = false;
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
	display: flex;
	flex-direction: column;
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
.header .back {
	font-size: 50rpx;
	color: #07C160;
	font-weight: 300;
}
.header .title {
	font-size: 34rpx;
	font-weight: 500;
}
.header-right {
	display: flex;
	gap: 20rpx;
}
.icon-btn {
	font-size: 44rpx;
	width: 60rpx;
	text-align: center;
}
.chat-area {
	flex: 1;
	padding: 20rpx;
	overflow-y: auto;
}
.history-tip {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx;
	gap: 15rpx;
	font-size: 24rpx;
	color: #999;
}
.loading-spinner {
	width: 30rpx;
	height: 30rpx;
	border: 3rpx solid #e5e5e5;
	border-top-color: #07C160;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}
@keyframes spin {
	to { transform: rotate(360deg); }
}
.msg-item {
	margin-bottom: 30rpx;
}
.time-divider {
	text-align: center;
	padding: 10rpx 0;
}
.time-divider text {
	font-size: 22rpx;
	color: #999;
	background-color: #e5e5e5;
	padding: 5rpx 20rpx;
	border-radius: 10rpx;
}
.system-msg {
	text-align: center;
	padding: 10rpx 0;
}
.system-msg text {
	font-size: 22rpx;
	color: #999;
	background-color: #e8e8e8;
	padding: 8rpx 20rpx;
	border-radius: 10rpx;
}
.bubble-box {
	display: flex;
	align-items: flex-start;
	padding: 0 20rpx;
}
.bubble-box .avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 10rpx;
	flex-shrink: 0;
}
.bubble {
	max-width: 60%;
	padding: 20rpx 28rpx;
	font-size: 30rpx;
	line-height: 1.6;
	word-break: break-all;
}
.bubble.text {
	
}
.bubble.image {
	padding: 10rpx;
}
.msg-item.received .bubble-box {
	flex-direction: row;
}
.msg-item.received .bubble {
	background-color: #fff;
	border-radius: 0 20rpx 20rpx 20rpx;
	margin-left: 20rpx;
}
.msg-item.sent .bubble-box {
	flex-direction: row-reverse;
}
.msg-item.sent .bubble {
	background-color: #95ec69;
	border-radius: 20rpx 0 20rpx 20rpx;
	margin-right: 20rpx;
}
.text-content {
	
}
.msg-image {
	max-width: 400rpx;
	border-radius: 10rpx;
}
/* 底部输入栏 */
.input-bar {
	background-color: #f5f5f5;
	padding: 15rpx 20rpx;
	display: flex;
	align-items: center;
	gap: 15rpx;
	border-top: 1rpx solid #e5e5e5;
	padding-bottom: 30rpx;
}
.input-box {
	flex: 1;
	background-color: #fff;
	border-radius: 10rpx;
	padding: 15rpx 20rpx;
}
.input-box input {
	font-size: 30rpx;
	width: 100%;
}
.send-btn {
	background-color: #07C160;
	color: #fff;
	padding: 15rpx 30rpx;
	border-radius: 10rpx;
	font-size: 28rpx;
	font-weight: 500;
}
.voice-btn {
	font-size: 44rpx;
}
/* 表情面板 */
.emoji-panel {
	background-color: #fff;
	padding: 20rpx;
	border-top: 1rpx solid #e5e5e5;
	max-height: 400rpx;
	overflow-y: auto;
}
.emoji-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 15rpx;
}
.emoji-item {
	font-size: 44rpx;
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}
.emoji-item:active {
	background-color: #f5f5f5;
	border-radius: 10rpx;
}
</style>
