/**
 * IndexedDB封装
 * 离线数据存储和同步
 */

class IndexedDBManager {
  constructor(options = {}) {
    this.dbName = options.dbName || 'wanneng-task-db'
    this.dbVersion = options.dbVersion || 1
    this.db = null
    
    this.stores = options.stores || {
      tasks: { keyPath: 'id', autoIncrement: false },
      messages: { keyPath: 'id', autoIncrement: false },
      offlineQueue: { keyPath: 'id', autoIncrement: true }
    }
  }
  
  /**
   * 打开数据库
   */
  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // 创建对象存储空间
        Object.keys(this.stores).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const storeConfig = this.stores[storeName]
            db.createObjectStore(storeName, {
              keyPath: storeConfig.keyPath,
              autoIncrement: storeConfig.autoIncrement || false
            })
          }
        })
      }
      
      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve(this.db)
      }
      
      request.onerror = (event) => {
        reject(event.target.error)
      }
    })
  }
  
  /**
   * 获取对象存储空间
   */
  getStore(storeName, mode = 'readonly') {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        this.open().then(() => {
          const transaction = this.db.transaction(storeName, mode)
          const store = transaction.objectStore(storeName)
          resolve(store)
        }).catch(reject)
      } else {
        const transaction = this.db.transaction(storeName, mode)
        const store = transaction.objectStore(storeName)
        resolve(store)
      }
    })
  }
  
  /**
   * 添加数据
   */
  add(storeName, data) {
    return new Promise((resolve, reject) => {
      this.getStore(storeName, 'readwrite').then(store => {
        const request = store.add(data)
        
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }).catch(reject)
    })
  }
  
  /**
   * 更新数据
   */
  put(storeName, data) {
    return new Promise((resolve, reject) => {
      this.getStore(storeName, 'readwrite').then(store => {
        const request = store.put(data)
        
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }).catch(reject)
    })
  }
  
  /**
   * 获取数据
   */
  get(storeName, key) {
    return new Promise((resolve, reject) => {
      this.getStore(storeName, 'readonly').then(store => {
        const request = store.get(key)
        
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }).catch(reject)
    })
  }
  
  /**
   * 删除数据
   */
  delete(storeName, key) {
    return new Promise((resolve, reject) => {
      this.getStore(storeName, 'readwrite').then(store => {
        const request = store.delete(key)
        
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }).catch(reject)
    })
  }
  
  /**
   * 获取所有数据
   */
  getAll(storeName) {
    return new Promise((resolve, reject) => {
      this.getStore(storeName, 'readonly').then(store => {
        const request = store.getAll()
        
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }).catch(reject)
    })
  }
  
  /**
   * 清空存储空间
   */
  clear(storeName) {
    return new Promise((resolve, reject) => {
      this.getStore(storeName, 'readwrite').then(store => {
        const request = store.clear()
        
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      }).catch(reject)
    })
  }
  
  /**
   * 统计数量
   */
  count(storeName) {
    return new Promise((resolve, reject) => {
      this.getStore(storeName, 'readonly').then(store => {
        const request = store.count()
        
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }).catch(reject)
    })
  }
  
  /**
   * 添加离线操作到队列
   */
  addToOfflineQueue(operation) {
    return this.add('offlineQueue', {
      operation,
      timestamp: new Date().toISOString(),
      synced: false
    })
  }
  
  /**
   * 同步离线队列
   */
  syncOfflineQueue(api) {
    return this.getAll('offlineQueue').then(queue => {
      const syncPromises = queue
        .filter(item => !item.synced)
        .map(item => {
          return api.request(item.operation)
            .then(() => {
              return this.put('offlineQueue', {
                ...item,
                synced: true,
                syncedAt: new Date().toISOString()
              })
            })
            .catch(error => {
              console.error('Failed to sync item:', item, error)
              return Promise.resolve() // 继续同步其他项
            })
        })
      
      return Promise.all(syncPromises)
    })
  }
  
  /**
   * 关闭数据库
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
  
  /**
   * 删除数据库
   */
  deleteDatabase() {
    return new Promise((resolve, reject) => {
      this.close()
      
      const request = indexedDB.deleteDatabase(this.dbName)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

// 创建默认IndexedDB管理器
const dbManager = new IndexedDBManager()

// 自动打开数据库
dbManager.open().catch(error => {
  console.error('Failed to open IndexedDB:', error)
})

// Vue插件
export const IndexedDBPlugin = {
  install(Vue, options) {
    const manager = new IndexedDBManager(options)
    
    manager.open().catch(error => {
      console.error('Failed to open IndexedDB in plugin:', error)
    })
    
    Vue.prototype.$db = manager
  }
}

export default dbManager
