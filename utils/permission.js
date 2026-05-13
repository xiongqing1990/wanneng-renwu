/**
 * 权限控制工具
 * 基于角色的访问控制（RBAC）
 */

class Permission {
  constructor() {
    this.roles = {
      guest: {
        permissions: [
          'view:public',
          'view:tasks'
        ]
      },
      user: {
        permissions: [
          'view:public',
          'view:tasks',
          'create:task',
          'edit:own_task',
          'delete:own_task',
          'chat:send',
          'view:own_profile'
        ],
        inherits: ['guest']
      },
      vip: {
        permissions: [
          'view:public',
          'view:tasks',
          'create:task',
          'edit:own_task',
          'delete:own_task',
          'chat:send',
          'view:own_profile',
          'create:premium_task',
          'view:analytics',
          'priority:support'
        ],
        inherits: ['user']
      },
      moderator: {
        permissions: [
          'view:public',
          'view:tasks',
          'create:task',
          'edit:own_task',
          'delete:own_task',
          'chat:send',
          'view:own_profile',
          'moderate:tasks',
          'moderate:users',
          'view:reports'
        ],
        inherits: ['user']
      },
      admin: {
        permissions: [
          'view:public',
          'view:tasks',
          'create:task',
          'edit:own_task',
          'delete:own_task',
          'chat:send',
          'view:own_profile',
          'create:premium_task',
          'view:analytics',
          'priority:support',
          'moderate:tasks',
          'moderate:users',
          'view:reports',
          'manage:users',
          'manage:tasks',
          'manage:system',
          'view:logs'
        ],
        inherits: ['vip', 'moderator']
      }
    }
    
    this.currentUser = null
    this.currentRole = 'guest'
  }
  
  /**
   * 设置当前用户
   */
  setUser(user) {
    this.currentUser = user
    this.currentRole = user.role || 'guest'
  }
  
  /**
   * 获取用户所有权限（包括继承的）
   */
  getUserPermissions(role = this.currentRole) {
    const roleObj = this.roles[role]
    if (!roleObj) return []
    
    let permissions = [...roleObj.permissions]
    
    // 递归获取继承的权限
    if (roleObj.inherits) {
      for (const inheritedRole of roleObj.inherits) {
        const inheritedPermissions = this.getUserPermissions(inheritedRole)
        permissions = [...new Set([...permissions, ...inheritedPermissions])]
      }
    }
    
    return [...new Set(permissions)] // 去重
  }
  
  /**
   * 检查是否有某个权限
   */
  hasPermission(permission, role = this.currentRole) {
    const permissions = this.getUserPermissions(role)
    return permissions.includes(permission)
  }
  
  /**
   * 检查是否有多个权限（AND）
   */
  hasAllPermissions(permissions, role = this.currentRole) {
    return permissions.every(p => this.hasPermission(p, role))
  }
  
  /**
   * 检查是否有多个权限中的任意一个（OR）
   */
  hasAnyPermission(permissions, role = this.currentRole) {
    return permissions.some(p => this.hasPermission(p, role))
  }
  
  /**
   * 检查是否能访问某个路由
   */
  canAccessRoute(route, role = this.currentRole) {
    const routePermissions = {
      '/': ['view:public'],
      '/tasks': ['view:tasks'],
      '/tasks/create': ['create:task'],
      '/tasks/edit': ['edit:own_task'],
      '/profile': ['view:own_profile'],
      '/admin': ['manage:system'],
      '/admin/users': ['manage:users'],
      '/admin/tasks': ['manage:tasks'],
      '/admin/logs': ['view:logs']
    }
    
    const requiredPermissions = routePermissions[route]
    if (!requiredPermissions) return true // 没有配置权限要求的路由，默认允许访问
    
    return this.hasAnyPermission(requiredPermissions, role)
  }
  
  /**
   * 检查是否能执行某个操作
   */
  canPerformAction(action, resourceOwnerId = null) {
    // 检查权限
    if (!this.hasPermission(action)) {
      return false
    }
    
    // 检查资源所有权（如果是编辑/删除自己的资源）
    if (action.startsWith('edit:own_') || action.startsWith('delete:own_')) {
      if (!this.currentUser) return false
      
      // 这里假设资源有userId字段
      // 实际使用时需要从资源对象中获取
      return resourceOwnerId === this.currentUser.id
    }
    
    return true
  }
  
  /**
   * 添加自定义角色
   */
  addRole(roleName, permissions, inherits = []) {
    if (this.roles[roleName]) {
      console.warn(`Role ${roleName} already exists`)
      return false
    }
    
    this.roles[roleName] = {
      permissions,
      inherits
    }
    
    return true
  }
  
  /**
   * 更新角色权限
   */
  updateRole(roleName, permissions, inherits) {
    if (!this.roles[roleName]) {
      console.warn(`Role ${roleName} does not exist`)
      return false
    }
    
    this.roles[roleName].permissions = permissions
    
    if (inherits) {
      this.roles[roleName].inherits = inherits
    }
    
    return true
  }
  
  /**
   * 删除角色
   */
  deleteRole(roleName) {
    if (roleName === 'guest' || roleName === 'user') {
      console.warn(`Cannot delete system role: ${roleName}`)
      return false
    }
    
    delete this.roles[roleName]
    return true
  }
  
  /**
   * 获取所有角色
   */
  getAllRoles() {
    return Object.keys(this.roles)
  }
  
  /**
   * 获取角色信息
   */
  getRole(roleName) {
    return this.roles[roleName] || null
  }
}

/**
 * Vue指令：v-permission
 * 用法：v-permission="'create:task'"
 *       v-permission="['create:task', 'edit:task']"
 */
export const permissionDirective = {
  inserted(el, binding) {
    const permission = new Permission()
    
    const checkPermission = () => {
      const value = binding.value
      
      let hasPermission = false
      
      if (typeof value === 'string') {
        hasPermission = permission.hasPermission(value)
      } else if (Array.isArray(value)) {
        hasPermission = binding.modifiers.all 
          ? permission.hasAllPermissions(value)
          : permission.hasAnyPermission(value)
      }
      
      if (!hasPermission) {
        el.style.display = 'none'
        // 或者完全移除元素
        // el.parentNode.removeChild(el)
      }
    }
    
    checkPermission()
  }
}

/**
 * Vue混入：权限检查
 */
export const permissionMixin = {
  computed: {
    $permission() {
      return new Permission()
    }
  },
  
  methods: {
    hasPermission(permission) {
      return this.$permission.hasPermission(permission)
    },
    
    canAccessRoute(route) {
      return this.$permission.canAccessRoute(route)
    },
    
    canPerformAction(action, resourceOwnerId) {
      return this.$permission.canPerformAction(action, resourceOwnerId)
    }
  }
}

// 创建默认权限实例
const permission = new Permission()

export default permission
