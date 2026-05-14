// ===== 万能任务 APP v5.0 - 简洁版 =====
// 核心功能：本地任务管理，无广告，无冗余

var STORAGE_KEY = 'wanneng_tasks_v5';
var USER_KEY = 'wanneng_user_v5';

// ===== 数据层 =====
function loadTasks() {
  try {
    var d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : [];
  } catch(e) { return []; }
}
function saveTasks(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
function genId() { return Date.now() + Math.floor(Math.random()*10000); }
function now() { return new Date().toISOString(); }

function loadUser() {
  try {
    var u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : {};
  } catch(e) { return {}; }
}

// ===== Vue App =====
new Vue({
  el: '#app',
  data: function() {
    return {
      // 任务数据
      tasks: [],
      // 首页
      kw: '',
      curCat: '全部',
      catList: ['全部', '生活', '工作', '学习', '购物', '健康', '其他'],
      quickInput: '',
      // 编辑
      editingId: null,
      editForm: { title:'', desc:'', category:'', priority:'mid' },
      // 用户
      userName: '',
      userEmoji: '',
      userId: '',
      // 弹窗
      modalShow: false,
      modalTitle: '',
      modalMsg: '',
      modalOkText: '确定',
      modalCancelBtn: false,
      _modalCbOk: null,
      _modalCbCancel: null,
      // Toast
      toastShow: false,
      toastMsg: '',
      _toastTimer: null
    };
  },

  computed: {
    filteredTasks: function() {
      var self = this;
      var list = this.tasks;
      // 分类过滤
      if (this.curCat !== '全部') {
        list = list.filter(function(t) { return t.category === self.curCat; });
      }
      // 搜索
      if (this.kw.trim()) {
        var k = this.kw.toLowerCase();
        list = list.filter(function(t) {
          return t.title.toLowerCase().indexOf(k) >= 0 ||
                 (t.desc && t.desc.toLowerCase().indexOf(k) >= 0);
        });
      }
      // 排序：未完成在前，按时间倒序
      list = list.slice().sort(function(a, b) {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      return list;
    },
    doneCount: function() { return this.tasks.filter(function(t){return t.done;}).length; },
    pendingCount: function() { return this.tasks.filter(function(t){return !t.done;}).length; },
    highPriorityCount: function() { return this.tasks.filter(function(t){return !t.done && t.priority==='high';}).length; },
    totalTasks: function() { return this.tasks.length || 1; },
    categoryStats: function() {
      var m = {};
      for (var i=0;i<this.tasks.length;i++) {
        var c = this.tasks[i].category || '其他';
        m[c] = (m[c]||0) + 1;
      }
      return m;
    },
    weekData: function() {
      var arr = [0,0,0,0,0,0,0];
      var labels = ['一','二','三','四','五','六','日'];
      var today = new Date();
      for (var i=6;i>=0;i--) {
        var d = new Date(today);
        d.setDate(d.getDate()-i);
        labels[6-i] = (d.getMonth()+1)+'/'+d.getDate();
      }
      for (var j=0;j<this.tasks.length;j++) {
        var t = this.tasks[j];
        if (!t.done || !t.doneAt) continue;
        var td = new Date(t.doneAt);
        var diff = Math.floor((today-td)/86400000);
        if (diff>=0&&diff<7) arr[6-diff]++;
      }
      this.weekLabels = labels;
      return arr;
    }
  },

  mounted: function() {
    this.initUser();
    this.tasks = loadTasks();
    this.initBackButton();
  },

  methods: {
    // ===== 导航 =====
    nav: function(id) {
      document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('on');});
      var el = document.getElementById(id);
      if(el) el.classList.add('on');
      if(id === 'pg-edit' && !this.editingId) {
        this.$nextTick(function(){
          var inp = document.querySelector('#pg-edit input');
          if(inp) setTimeout(function(){inp.focus();},100);
        });
      }
    },

    // ===== 任务操作 =====
    toggleDone: function(t) {
      t.done = !t.done;
      t.doneAt = t.done ? now() : null;
      this.save();
      if(t.done) this.toast('已完成 ✓');
    },

    openTask: function(t) {
      this.editingId = t.id;
      this.editForm = {
        title: t.title,
        desc: t.desc || '',
        category: t.category || '',
        priority: t.priority || 'mid'
      };
      this.nav('pg-edit');
    },

    quickAdd: function() {
      var title = this.quickInput.trim();
      if(!title) return;
      this.tasks.unshift({
        id: genId(),
        title: title,
        desc: '',
        category: this.curCat!=='全部'?this.curCat:'',
        priority: 'mid',
        done: false,
        createdAt: now(),
        doneAt: null
      });
      this.quickInput = '';
      this.save();
      this.toast('已添加');
    },

    cancelEdit: function() {
      this.nav('pg-home');
      this.editingId = null;
      this.editForm = {title:'',desc:'',category:'',priority:'mid'};
    },

    saveEdit: function() {
      var f = this.editForm;
      if(!f.title.trim()) { this.toast('请输入标题'); return; }

      if(this.editingId) {
        // 更新
        for(var i=0;i<this.tasks.length;i++) {
          if(this.tasks[i].id===this.editingId) {
            this.tasks[i].title = f.title.trim();
            this.tasks[i].desc = f.desc.trim();
            this.tasks[i].category = f.category;
            this.tasks[i].priority = f.priority;
            break;
          }
        }
        this.toast('已更新');
      } else {
        // 新建
        this.tasks.unshift({
          id: genId(),
          title: f.title.trim(),
          desc: f.desc.trim(),
          category: f.category,
          priority: f.priority,
          done: false,
          createdAt: now(),
          doneAt: null
        });
        this.toast('已创建');
      }
      this.save();
      this.cancelEdit();
    },

    deleteTask: function() {
      var self = this;
      this.showModal('确认删除','确定删除此任务？删除后不可恢复。', '删除', '取消', function() {
        self.tasks = self.tasks.filter(function(t){return t.id!==self.editingId;});
        self.save();
        self.cancelEdit();
        self.toast('已删除');
      }, null, true);
    },

    doSearch: function() {
      // 搜索由computed自动处理
    },

    filterTasks: function() {
      // 分类过滤由computed自动处理
    },

    // ===== 数据持久化 =====
    save: function() {
      saveTasks(this.tasks);
    },

    // ===== 工具函数 =====
    priorityLabel: function(p) {
      return {high:'高',mid:'中',low:'低'}[p]||'中';
    },

    fmtTime: function(t) {
      if(!t) return '';
      try {
        var d = new Date(t.replace(' ','T'));
        if(isNaN(d.getTime())) return '';
        var diff = Date.now() - d.getTime();
        if(diff<60000) return '刚刚';
        if(diff<3600000) return Math.floor(diff/60000)+'分钟前';
        if(diff<86400000) return Math.floor(diff/3600000)+'小时前';
        if(diff<604800000) return Math.floor(diff/86400000)+'天前';
        return (d.getMonth()+1)+'/'+d.getDate();
      }catch(e){return '';}
    },

    // ===== 我的页面 =====
    exportData: function() {
      var data = JSON.stringify(this.tasks,null,2);
      var blob = new Blob([data],{type:'application/json'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href=url; a.download='万能任务备份_'+new Date().toISOString().slice(0,10)+'.json';
      a.click(); URL.revokeObjectURL(url);
      this.toast('导出成功');
    },

    clearCompleted: function() {
      var count = this.tasks.filter(function(t){return t.done;}).length;
      if(count===0) { this.toast('没有已完成的任务'); return; }
      var self = this;
      this.showModal('清除完成项','确定清除 '+count+' 个已完成的任务？', '清除', '取消', function(){
        self.tasks = self.tasks.filter(function(t){return !t.done;});
        self.save();
        self.toast('已清除');
      },null,true);
    },

    showHelp: function() {
      this.showModal('使用帮助',
        '• 首页底部输入框快速添加新任务\n• 点击任务卡片可编辑详情\n• 左侧圆圈标记完成任务\n• 支持搜索和分类筛选\n• 统计页查看完成趋势',
        '知道了', '', null, null, false);
    },

    showAbout: function() {
      this.showModal('关于',
        '万能任务 v5.0\n\n一款简洁高效的任务管理工具。\n所有数据保存在本地，无需联网。',
        '好的', '', null, null, false);
    },

    // ===== 初始化 =====
    initUser: function() {
      var u = loadUser();
      if(u.name) this.userName = u.name;
      if(u.emoji) this.userEmoji = u.emoji;
      if(u.id) this.userId = u.id;
      if(!this.userName) {
        this.userName = '用户';
        this.userEmoji = '😊';
        this.userId = Math.floor(Math.random()*90000+10000).toString();
        localStorage.setItem(USER_KEY, JSON.stringify({name:this.userName,emoji:this.userEmoji,id:this.userId}));
      }
    },

    initBackButton: function() {
      var self = this;
      document.addEventListener('backbutton', function(e){
        e.preventDefault();
        var curOn = document.querySelector('.pg.on');
        if(curOn && curOn.id==='pg-edit') {
          self.cancelEdit();
        } else if(curOn && (curOn.id==='pg-stats'||curOn.id==='pg-me')) {
          self.nav('pg-home');
        } else {
          if(self._canExit) {
            if(navigator.app) navigator.app.exitApp();
          } else {
            self._canExit=true;
            self.toast('再按一次退出');
            setTimeout(function(){self._canExit=false;},2000);
          }
        }
      });
    },

    // ===== Toast & Modal =====
    toast: function(msg) {
      var self=this;
      this.toastMsg=msg;this.toastShow=true;
      clearTimeout(this._toastTimer);
      this._toastTimer=setTimeout(function(){self.toastShow=false;},1600);
    },

    showModal: function(title,msg,okText,cancelText,onOk,onCancel,showCancel) {
      this.modalTitle=title;
      this.modalMsg=msg;
      this.modalOkText=okText||'确定';
      this.modalCancelBtn=!!showCancel;
      this._modalCbOk=onOk||null;
      this._modalCbCancel=onCancel||null;
      this.modalShow=true;
    },

    modalOk: function() {
      this.modalShow=false;
      if(this._modalCbOk)this._modalCbOk();
    },

    modalCancel: function() {
      this.modalShow=false;
      if(this._modalCbCancel)this._modalCbCancel();
    }
  }
});
