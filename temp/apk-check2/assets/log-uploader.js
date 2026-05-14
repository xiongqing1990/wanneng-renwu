/**
 * 日志上传服务
 * 将本地日志上传到服务器
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

class LogUploader {
  constructor() {
    this.uploadUrl = 'https://api.wanengrenwu.com/logs/upload'
    this.batchSize = 50
    this.uploadInterval = 60000  // 1分钟
    this.timer = null
    this.enabled = true
  }

  /**
   * 初始化日志上传器
   */
  init(config = {}) {
    this.uploadUrl = config.uploadUrl || this.uploadUrl
    this.batchSize = config.batchSize || this.batchSize
    this.uploadInterval = config.uploadInterval || this.uploadInterval
    this.enabled = config.enabled !== false

    if (this.enabled) {
      this._startAutoUpload()
      console.log('[LogUploader] 日志上传器初始化成功')
    }
  }

  /**
   * 手动上传日志
   * @param {Array} logs 日志数组
   * @returns {Promise<boolean>} 是否成功
   */
  async upload(logs = null) {
    if (!this.enabled) return false

    const logsToUpload = logs || this._getLogsFromStorage()

    if (!logsToUpload || logsToUpload.length === 0) {
      console.log('[LogUploader] 没有日志需要上传')
      return true
    }

    try {
      // 分批上传
      const batches = this._splitIntoBatches(logsToUpload, this.batchSize)

      for (const batch of batches) {
        await this._uploadBatch(batch)
      }

      // 上传成功，清理本地日志
      this._clearUploadedLogs()

      console.log(`[LogUploader] 成功上传 ${logsToUpload.length} 条日志`)
      return true
    } catch (error) {
      console.error('[LogUploader] 上传失败', error)
      return false
    }
  }

  /**
   * 上传单批日志
   * @private
   */
  async _uploadBatch(batch) {
    return new Promise((resolve, reject) => {
      uni.request({
        url: this.uploadUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${uni.getStorageSync('token') || ''}`
        },
        data: {
          logs: batch,
          deviceInfo: this._getDeviceInfo(),
          appVersion: '1.0.0'
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve()
          } else {
            reject(new Error(`上传失败: ${res.statusCode}`))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }

  /**
   * 从本地存储获取日志
   * @private
   */
  _getLogsFromStorage() {
    try {
      return uni.getStorageSync('app_logs') || []
    } catch (e) {
      console.warn('[LogUploader] 读取本地日志失败', e)
      return []
    }
  }

  /**
   * 清理已上传的日志
   * @private
   */
  _clearUploadedLogs() {
    try {
      uni.removeStorageSync('app_logs')
    } catch (e) {
      console.warn('[LogUploader] 清理本地日志失败', e)
    }
  }

  /**
   * 分批
   * @private
   */
  _splitIntoBatches(array, batchSize) {
    const batches = []
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * 获取设备信息
   * @private
   */
  _getDeviceInfo() {
    try {
      const systemInfo = uni.getSystemInfoSync()
      return {
        platform: systemInfo.platform,
        system: systemInfo.system,
        brand: systemInfo.brand,
        model: systemInfo.model,
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight
      }
    } catch (e) {
      return {}
    }
  }

  /**
   * 启动自动上传
   * @private
   */
  _startAutoUpload() {
    if (this.timer) {
      clearInterval(this.timer)
    }

    this.timer = setInterval(() => {
      this.upload()
    }, this.uploadInterval)
  }

  /**
   * 停止自动上传
   */
  stopAutoUpload() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      console.log('[LogUploader] 自动上传已停止')
    }
  }

  /**
   * 立即上传（手动触发）
   */
  async uploadNow() {
    return await this.upload()
  }
}

// 导出单例
const logUploader = new LogUploader()

export default logUploader
export { LogUploader }
