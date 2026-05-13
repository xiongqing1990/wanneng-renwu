// API 接口封装
const API_BASE = 'http://localhost:3000/api';

// 封装请求
const request = (url, method = 'GET', data = {}) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: API_BASE + url,
			method,
			data,
			header: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + uni.getStorageSync('token')
			},
			success: (res) => {
				if (res.data.code === 200) {
					resolve(res.data.data);
				} else {
					uni.showToast({ title: res.data.msg, icon: 'none' });
					reject(res.data);
				}
			},
			fail: (err) => {
				uni.showToast({ title: '网络错误', icon: 'none' });
				reject(err);
			}
		});
	});
};

// 用户相关
export const userLogin = (phone, code) => request('/user/login', 'POST', { phone, code });
export const getUserInfo = () => request('/user/info');

// 任务相关
export const getTaskList = (page = 1, limit = 20, tag = '') => 
	request('/task/list', 'GET', { page, limit, tag });

export const createTask = (data) => request('/task/create', 'POST', data);

export const getTaskDetail = (id) => request('/task/detail', 'GET', { id });

// 聊天相关
export const getChatList = (userId) => request('/chat/list', 'GET', { userId });

export const sendMessage = (data) => request('/chat/send', 'POST', data);

export const getChatMessages = (chatId, page = 1) => 
	request('/chat/messages', 'GET', { chatId, page });

// WebSocket 连接
let ws = null;

export const connectWebSocket = (onMessage) => {
	if (ws) return ws;
	
	ws = uni.connectSocket({
		url: 'ws://localhost:8080'
	});
	
	ws.onOpen(() => {
		console.log('WebSocket connected');
	});
	
	ws.onMessage((res) => {
		const data = JSON.parse(res.data);
		onMessage && onMessage(data);
	});
	
	ws.onClose(() => {
		console.log('WebSocket closed');
		ws = null;
	});
	
	return ws;
};

export const sendWebSocketMessage = (data) => {
	if (ws && ws.sendSocketMessage) {
		ws.sendSocketMessage({ data: JSON.stringify(data) });
	}
};