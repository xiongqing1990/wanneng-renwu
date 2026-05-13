/**
 * 权限控制工具
 * 提供细粒度权限管理
 * 
 * @author AI助手
 * @version 1.0.0
 * @date 2026-05-12
 */

// 角色定义
const Roles = {
  GUEST: 'guest',       // 游客
  USER: 'user',         // 普通用户
  PREMIUM: 'premium',   // 会员用户
  ADMIN: 'admin',       // 管理员
  SUPER_ADMIN: 'super_admin'  // 超级管理员
}

// 权限定义
const Permissions = {
  // 任务相关
  TASK_PUBLISH: 'task:publish',
  TASK_ACCEPT: 'task:accept',
  TASK_DELETE: 'task:delete',
  TASK_VIEW: 'task:view',
  
  // 用户相关
  USER_PROFILE: 'user:profile',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  
  // 支付相关
  PAYMENT_PAY: 'payment:pay',
  PAYMENT_REFUND: 'payment:refund',
  
  // 管理相关
  ADMIN_USER: 'admin:user',
  ADMIN_TASK: 'admin:task',
  ADMIN_SYSTEM: 'admin:system'
}

// 角色-权限映射
const RolePermissions = {
  [Roles.GUEST]: [
    Permissions.TASK_VIEW
  ],
  [Roles.USER]: [
    Permissions.TASK_VIEW,
    Permissions.TASK_PUBLISH,
    Permissions.TASK_ACCEPT,
    Permissions.USER_PROFILE,
    Permissions.USER_EDIT,
    Permissions.PAYMENT_PAY
  ],
  [Roles.PREMIUM]: [
    Permissions.TASK_VIEW,
    Permissions.TASK_PUBLISH,
    Permissions.TASK_ACCEPT,
    Permissions.TASK_DELETE,
    Permissions.USER_PROFILE,
    Permissions.USER_EDIT,
    Permissions.PAYMENT_PAY,
    Permissions.PAYMENT_REFUND
  ],
  [Roles.ADMIN]: [
    Permissions.TASK_VIEW,
    Permissions.TASK_PUBLISH,
    Permissions.TASK_ACCEPT,
    Permissions.TASK_DELETE,
    Permissions.USER_PROFILE,
    Permissions.USER_EDIT,
    Permissions.USER_DELETE,
    Permissions.PAYMENT_PAY,
    Permissions.PAYMENT_REFUND,
    Permissions.ADMIN_USER,
    Permissions.ADMIN_TASK
  ],
  [Roles.SUPER_ADMIN]: [
    Permissions.TASK_VIEW,
    Permissions.TASK_PUBLISH,
    Permissions.TASK_ACCEPT,
    Permissions.TASK_DELETE,
    Permissions.USER_PROFILE,
    Permissions.USER_EDIT,
    Permissions.USER_DELETE,
    Permissions.PAYMENT_PAY,
    Permissions.PAYMENT_REFUND,
    Permissions.ADMIN_USER,
    Permissions.ADMIN_TASK,
    Permissions.ADMIN_SYSTEM
  ]
}

class PermissionManager {
  constructor() {
    this.currentRole = Roles.GUEST
    this.customPermissions = new Set()
    this.initialized = false
  }

  /**
   * 初始化权限管理器
   */
  init(userRole = Roles.GUEST) {
    this.currentRole = userRole
    this.customPermissions.clear()
    
    // 从本地存储恢复自定义权限
    try {
      const saved = uni.getStorageSync('custom_permissions')
      if (saved && Array.isArray(saved)) {
        saved.forEach(p => this.customPermissions.add(p))
      }
    } catch (e) {
      console.warn('[PermissionManager] 恢复自定义权限失败', e)
    }
    
    this.initialized = true
    console.log(`[PermissionManager] 权限管理器初始化成功，当前角色: ${this.currentRole}`)
  }

  /**
   * 设置当前用户角色
   * @param {string} role 角色
   */
  setRole(role) {
    if (!Object.values(Roles).includes(role)) {
      throw new Error(`无效的角色: ${role}`)
    }
    
    this.currentRole = role
    console.log(`[PermissionManager] 角色已切换为: ${role}`)
  }

  /**
   * 获取当前角色
   * @returns {string} 角色
   */
  getRole() {
    return this.currentRole
  }

  /**
   * 检查是否拥有某个权限
   * @param {string} permission 权限
   * @returns {boolean} 是否拥有
   */
  hasPermission(permission) {
    if (!this.initialized) {
      console.warn('[PermissionManager] 未初始化')
      return false
    }

    // 检查自定义权限
    if (this.customPermissions.has(permission)) {
      return true
    }

    // 检查角色权限
    const rolePermissions = RolePermissions[this.currentRole]
    if (rolePermissions && rolePermissions.includes(permission)) {
      return true
    }

    return false
  }

  /**
   * 检查是否拥有所有权限
   * @param {Array<string>} permissions 权限数组
   * @returns {boolean} 是否拥有所有权限
   */
  hasAllPermissions(permissions) {
    return permissions.every(p => this.hasPermission(p))
  }

  /**
   * 检查是否拥有任一权限
   * @param {Array<string>} permissions 权限数组
   * @returns {boolean} 是否拥有任一权限
   */
  hasAnyPermission(permissions) {
    return permissions.some(p => this.hasPermission(p))
  }

  /**
   * 添加自定义权限
   * @param {string} permission 权限
   */
  addPermission(permission) {
    this.customPermissions.add(permission)
    this._saveCustomPermissions()
    console.log(`[PermissionManager] 已添加自定义权限: ${permission}`)
  }

  /**
   * 移除自定义权限
   * @param {string} permission 权限
   */
  removePermission(permission) {
    this.customPermissions.delete(permission)
    this._saveCustomPermissions()
    console.log(`[PermissionManager] 已移除自定义权限: ${permission}`)
  }

  /**
   * 保存自定义权限到本地存储
   * @private
   */
  _saveCustomPermissions() {
    try {
      const permissions = Array.from(this.customPermissions)
      uni.setStorageSync('custom_permissions', permissions)
    } catch (e) {
      console.warn('[PermissionManager] 保存自定义权限失败', e)
    }
  }

  /**
   * 检查权限，无权限时显示提示
   * @param {string} permission 权限
   * @param {string} message 无权限时的提示信息
   * @returns {boolean} 是否有权限
   */
  check(permission, message = '权限不足') {
    if (!this.hasPermission(permission)) {
      uni.showToast({
        title: message,
        icon: 'none'
      })
      return false
    }
    return true
  }

  /**
   * 检查权限，无权限时跳转页面
   * @param {string} permission 权限
   * @param {string} redirect 跳转路径
   * @returns {boolean} 是否有权限
   */
  checkAndRedirect(permission, redirect = '/pages/login/login') {
    if (!this.hasPermission(permission)) {
      uni.navigateTo({
        url: redirect
      })
      return false
    }
    return true
  }

  /**
   * 获取当前角色的所有权限
   * @returns {Array<string>} 权限数组
   */
  getPermissions() {
    const rolePermissions = RolePermissions[this.currentRole] || []
    const customPermissions = Array.from(this.customPermissions)
    return [...new Set([...rolePermissions, ...customPermissions])]
  }
}

// 创建Vue指令：v-permission
export const permissionDirective = {
  inserted(el, binding) {
    const permission = binding.value
    const permissionManager = new PermissionManager()
    
    if (!permissionManager.hasPermission(permission)) {
      el.parentNode && el.parentNode.removeChild(el)
    }
  }
}

// 导出单例
const permissionManager = new PermissionManager()

export default permissionManager
export { Roles, Permissions, RolePermissions, PermissionManager }
