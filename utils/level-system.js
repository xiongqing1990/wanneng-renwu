// ============================================
// 万能任务APP - 用户等级与积分系统
// ============================================

/**
 * 用户等级 (1-10级)
 * 每个等级对应不同权益
 */
export const USER_LEVELS = {
	1: { name: '新手', icon: '🌱', color: '#95a5a6', minPoints: 0, maxPoints: 99 },
	2: { name: '初级', icon: '⭐', color: '#3498db', minPoints: 100, maxPoints: 299 },
	3: { name: '进阶', icon: '⭐⭐', color: '#2ecc71', minPoints: 300, maxPoints: 599 },
	4: { name: '达人', icon: '💎', color: '#9b59b6', minPoints: 600, maxPoints: 999 },
	5: { name: '精英', icon: '👑', color: '#f39c12', minPoints: 1000, maxPoints: 1999 },
	6: { name: '专家', icon: '🏆', color: '#e74c3c', minPoints: 2000, maxPoints: 3999 },
	7: { name: '大师', icon: '🔥', color: '#ff6b35', minPoints: 4000, maxPoints: 6999 },
	8: { name: '传奇', icon: '⚡', color: '#1abc9c', minPoints: 7000, maxPoints: 11999 },
	9: { name: '至尊', icon: '👑', color: '#e84393', minPoints: 12000, maxPoints: 19999 },
	10: { name: '荣耀王者', icon: '🏅', color: '#ffd700', minPoints: 20000, maxPoints: Infinity }
}

/**
 * 发布者评级 (类似淘宝商家评级)
 * 基于信用分、完成率、好评率综合评定
 */
export const PUBLISHER_RATINGS = [
	{ level: 1, name: '普通发布者', icon: '📝', color: '#999', minCredit: 500, desc: '新入驻用户' },
	{ level: 2, name: '诚信发布者', icon: '✓', color: '#07C160', minCredit: 650, desc: '信用良好' },
	{ level: 3, name: '优质发布者', icon: '⭐', color: '#f39c12', minCredit: 750, desc: '交易活跃' },
	{ level: 4, name: '金牌发布者', icon: '🥇', color: '#FFD700', minCredit: 850, desc: '口碑优秀' },
	{ level: 5, name: '钻石发布者', icon: '💎', color: '#b8860b', minCredit: 950, desc: '平台认证' }
]

/**
 * 积分获取规则
 */
export const POINTS_RULES = {
	// 每日任务
	dailyLogin: { points: 5, desc: '每日登录', limit: 1 },
	dailyShare: { points: 10, desc: '分享任务', limit: 3 },
	
	// 发布相关
	publishTask: { points: 20, desc: '发布任务', limit: 10 },
	completeTask: { points: 50, desc: '完成订单', limit: 50 },
	getGoodReview: { points: 30, desc: '获得好评', limit: 30 },
	fiveStarReview: { points: 50, desc: '五星好评', limit: 30 },
	
	// 聊天相关
	firstResponse: { points: 5, desc: '首次回复', limit: 20 },
	
	// 特殊
	bindPhone: { points: 50, desc: '绑定手机', limit: 1 },
	realNameAuth: { points: 100, desc: '实名认证', limit: 1 },
	inviteUser: { points: 200, desc: '邀请好友', limit: 50 }
}

/**
 * 各等级核心权益
 * key: 等级, value: 权益列表
 */
export const LEVEL_BENEFITS = {
	1: [
		{ type: 'ad_free', count: 1, desc: '免费广告位x1（24小时）', icon: '📢' },
		{ type: 'task_daily', count: 3, desc: '每日可发布3条任务', icon: '📋' },
		{ type: 'badge', desc: '新手徽章展示', icon: '🌱' }
	],
	2: [
		{ type: 'ad_free', count: 1, desc: '免费广告位x1（48小时）', icon: '📢' },
		{ type: 'task_daily', count: 5, desc: '每日可发布5条任务', icon: '📋' },
		{ type: 'priority_display', desc: '排名加权+10%', icon: '🔼' },
		{ type: 'badge', desc: '初级徽章展示', icon: '⭐' }
	],
	3: [
		{ type: 'ad_free', count: 2, desc: '免费广告位x2（各48小时）', icon: '📢' },
		{ type: 'task_daily', count: 8, desc: '每日可发布8条任务', icon: '📋' },
		{ type: 'priority_display', desc: '排名加权+25%', icon: '🔼' },
		{ type: 'custom_tag', desc: '自定义标签', icon: '🏷️' },
		{ type: 'badge', desc: '进阶徽章展示', icon: '⭐⭐' }
	],
	4: [
		{ type: 'ad_free', count: 3, desc: '免费广告位x3（各72小时）', icon: '📢' },
		{ type: 'task_daily', count: 15, desc: '每日可发布15条任务', icon: '📋' },
		{ type: 'priority_display', desc: '排名加权+45%', icon: '🔼' },
		{ type: 'custom_tag', desc: '自定义标签x2', icon: '🏷️' },
		{ type: 'top_banner', desc: '顶部推荐位机会', icon: '🔥' },
		{ type: 'badge', desc: '达人徽章展示', icon: '💎' }
	],
	5: [
		{ type: 'ad_free', count: 5, desc: '免费广告位x5（各72小时）', icon: '📢' },
		{ type: 'task_daily', count: 30, desc: '每日可发布30条任务', icon: '📋' },
		{ type: 'priority_display', desc: '排名加权+70%', icon: '🔼' },
		{ type: 'custom_tag', desc: '自定义标签x3', icon: '🏷️' },
		{ type: 'top_banner', desc: '顶部推荐位优先权', icon: '🔥' },
		{ type: 'verify_fast', desc: '快速审核通道', icon: '⚡' },
		{ type: 'badge', desc: '精英徽章展示', icon: '👑' }
	],
	6: [
		{ type: 'ad_free', count: 8, desc: '免费广告位x8（各7天）', icon: '📢' },
		{ type: 'task_daily', count: 50, desc: '每日可发布50条任务', icon: '📋' },
		{ type: 'priority_display', desc: '排名加权+90%（仅次于广告）', icon: '🔼' },
		{ type: 'custom_tag', desc: '自定义标签无限制', icon: '🏷️' },
		{ type: 'top_banner', desc: '固定顶部推荐位', icon: '🔥' },
		{ type: 'verify_fast', desc: '快速审核通道', icon: '⚡' },
		{ type: 'customer_service', desc: '专属客服', icon: '💬' },
		{ type: 'badge', desc: '专家徽章展示', icon: '🏆' }
	]
	// 7-10级在此基础上叠加更多特权
}

/**
 * 广告位类型和价格
 */
export const AD_POSITIONS = {
	top_pinned: { name: '置顶广告', price: 5, unit: '元/小时', duration: [1, 2, 4, 8, 24], icon: '📌', style: 'pinned-card' },
	recommend: { name: '推荐位', price: 3, unit: '元/小时', duration: [1, 2, 4, 8, 24], icon: '🔥', style: 'recommend-card' },
	home_banner: { name: '首页Banner', price: 10, unit: '元/天', duration: [1, 3, 7], icon: '🎯', style: 'banner-card' }
}

/**
 * 广告位图标等级（按购买级别区分样式）
 */
export const AD_BADGE_LEVELS = [
	{ level: 1, label: '推广', bgColor: '#ffeaa7', textColor: '#d68910', borderColor: '#f1c40f', icon: '📢' },
	{ level: 2, label: '热门', bgColor: '#fab1a0', textColor: '#d63031', borderColor: '#ff7675', icon: '🔥' },
	{ level: 3, label: '精选', bgColor: '#74b9ff', textColor: '#0984e3', borderColor: '#0984e3', icon: '⭐' },
	{ level: 4, label: '置顶', bgColor: '#55efc4', textColor: '#00b894', borderColor: '#00b894', icon: '🚀' }
]

/**
 * 任务类型
 */
export const TASK_TYPES = {
	short_term: { id: 'short', name: '短期任务', desc: '一人接取即下架', icon: '⚡', color: '#07C160', defaultExpireHours: 24 },
	long_term: { id: 'long', name: '长期任务', desc: '多人接取，长期有效', icon: '📅', color: '#3498db', defaultExpireDays: 30 }
}

/**
 * 根据积分计算等级
 */
export function getLevelByPoints(points) {
	for (let i = 10; i >= 1; i--) {
		if (points >= USER_LEVELS[i].minPoints) return i;
	}
	return 1;
}

/**
 * 根据信用分获取发布者评级
 */
export function getPublisherRating(credit) {
	for (let i = PUBLISHER_RATINGS.length - 1; i >= 0; i--) {
		if (credit >= PUBLISHER_RATINGS[i].minCredit) return PUBLISHER_RATINGS[i];
	}
	return PUBLISHER_RATINGS[0];
}
