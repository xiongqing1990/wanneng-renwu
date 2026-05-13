/**
 * 人性化功能工具集
 * 提供智能提示、输入联想、操作引导等功能
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

/**
 * 智能提示工具
 */
class SmartTips {
  constructor() {
    this.tips = []
    this.enabled = true
    this.minInterval = 60000  // 最小提示间隔（ms）
    this.lastTipTime = 0
  }

  /**
   * 初始化智能提示
   */
  init(config = {}) {
    this.enabled = config.enabled !== false
    this.minInterval = config.minInterval || 60000
    this.tips = config.tips || this._getDefaultTips()
  }

  /**
   * 显示提示
   * @param {string} tipKey 提示键
   * @param {Object} context 上下文
   */
  show(tipKey, context = {}) {
    if (!this.enabled) return
    
    const now = Date.now()
    if (now - this.lastTipTime < this.minInterval) return
    
    const tip = this.tips.find(t => t.key === tipKey)
    if (!tip) return
    
    // 检查条件
    if (tip.condition && !tip.condition(context)) return
    
    // 检查是否已显示过
    const shownTips = uni.getStorageSync('shown_tips') || []
    if (tip.once && shownTips.includes(tipKey)) return
    
    // 显示提示
    uni.showModal({
      title: tip.title || '提示',
      content: this._interpolate(tip.content, context),
      showCancel: false,
      confirmText: '知道了'
    })
    
    // 记录已显示
    if (tip.once) {
      shownTips.push(tipKey)
      uni.setStorageSync('shown_tips', shownTips)
    }
    
    this.lastTipTime = now
  }

  /**
   * 插值替换
   * @private
   */
  _interpolate(template, context) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] || match
    })
  }

  /**
   * 获取默认提示
   * @private
   */
  _getDefaultTips() {
    return [
      {
        key: 'first_publish',
        title: '发布任务',
        content: '您还没有发布过任务，点击右上角"发布"按钮开始吧！',
        once: true,
        condition: (ctx) => ctx.publishCount === 0
      },
      {
        key: 'first_accept',
        title: '接受任务',
        content: '浏览任务列表，找到合适的任务，点击"接受任务"即可开始！',
        once: true,
        condition: (ctx) => ctx.acceptCount === 0
      },
      {
        key: 'complete_profile',
        title: '完善资料',
        content: '完善个人资料可以提高任务接受率哦！',
        once: true,
        condition: (ctx) => !ctx.profileCompleted
      }
    ]
  }
}

/**
 * 输入联想工具
 */
class InputSuggestion {
  constructor() {
    this.dictionary = []
    this.enabled = true
    this.debounceTimer = null
  }

  /**
   * 初始化输入联想
   */
  init(config = {}) {
    this.enabled = config.enabled !== false
    this.dictionary = config.dictionary || this._getDefaultDictionary()
  }

  /**
   * 获取联想建议
   * @param {string} input 输入文本
   * @param {number} limit 最大返回数量
   * @returns {Array<string>} 建议列表
   */
  getSuggestions(input, limit = 5) {
    if (!this.enabled || !input || input.length < 2) return []
    
    const suggestions = this.dictionary.filter(item =>
      item.includes(input) || this._pinyinMatch(item, input)
    )
    
    return suggestions.slice(0, limit)
  }

  /**
   * 拼音匹配（简化版）
   * @private
   */
  _pinyinMatch(text, input) {
    // 实际项目中应使用拼音库
    return false
  }

  /**
   * 获取默认词典
   * @private
   */
  _getDefaultDictionary() {
    return [
      '帮忙取快递',
      '帮忙买饭',
      '帮忙排队',
      '代写作业',
      '代设计LOGO',
      '代做PPT',
      '代写文案',
      '校园跑腿',
      '外卖配送',
      '打印服务',
      '翻译服务',
      '摄影服务'
    ]
  }

  /**
   * 添加词条到词典
   * @param {string} word 词条
   */
  addWord(word) {
    if (!this.dictionary.includes(word)) {
      this.dictionary.push(word)
    }
  }
}

/**
 * 操作引导工具
 */
class Guide {
  constructor() {
    this.steps = []
    this.currentStep = 0
    this.enabled = true
  }

  /**
   * 初始化操作引导
   */
  init(config = {}) {
    this.enabled = config.enabled !== false
    this.steps = config.steps || []
  }

  /**
   * 开始引导
   * @param {Array} steps 步骤数组
   */
  start(steps = this.steps) {
    if (!this.enabled || steps.length === 0) return
    
    this.steps = steps
    this.currentStep = 0
    this._showStep()
  }

  /**
   * 显示当前步骤
   * @private
   */
  _showStep() {
    if (this.currentStep >= this.steps.length) {
      this._complete()
      return
    }
    
    const step = this.steps[this.currentStep]
    
    // 高亮目标元素
    this._highlightElement(step.target)
    
    // 显示提示
    uni.showModal({
      title: step.title || `步骤 ${this.currentStep + 1}`,
      content: step.content,
      showCancel: this.currentStep > 0,
      cancelText: '上一步',
      confirmText: this.currentStep < this.steps.length - 1 ? '下一步' : '完成',
      success: (res) => {
        if (res.cancel) {
          this.currentStep--
          this._showStep()
        } else {
          this.currentStep++
          this._showStep()
        }
      }
    })
  }

  /**
   * 高亮元素
   * @private
   */
  _highlightElement(target) {
    if (!target) return
    
    // 实际项目中应使用遮罩层+高亮框
    console.log(`[Guide] 高亮元素: ${target}`)
  }

  /**
   * 完成引导
   * @private
   */
  _complete() {
    uni.showToast({
      title: '引导完成',
      icon: 'success'
    })
    
    // 记录已完成
    uni.setStorageSync('guide_completed', true)
  }

  /**
   * 检查是否需要显示引导
   */
  shouldShowGuide(key) {
    if (!this.enabled) return false
    
    const completed = uni.getStorageSync('guide_completed')
    const keyCompleted = uni.getStorageSync(`guide_${key}_completed`)
    
    return !completed && !keyCompleted
  }

  /**
   * 标记引导已完成
   */
  markCompleted(key) {
    if (key) {
      uni.setStorageSync(`guide_${key}_completed`, true)
    } else {
      uni.setStorageSync('guide_completed', true)
    }
  }
}

// 导出单例
const smartTips = new SmartTips()
const inputSuggestion = new InputSuggestion()
const guide = new Guide()

export {
  smartTips,
  inputSuggestion,
  guide,
  SmartTips,
  InputSuggestion,
  Guide
}
