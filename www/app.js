// ===== 万能任务 APP v5.2 - 智能升级版 =====
// 新增：到期提醒/连续打卡/效率评分/滑动操作/今日聚焦/骨架屏/暗色模式支持

var STORAGE_KEY = 'wanneng_tasks_v5';
var USER_KEY = 'wanneng_user_v5';
var VER = '5.2';

// ===== 数据层 =====
function loadTasks() {
  try { var d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : []; }
  catch(e) { return []; }
}
function saveTasks(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
function genId() { return Date.now().toString(36) + Math.floor(Math.random()*10000).toString(36); }
function now() { return new Date().toISOString(); }
function todayStr() { return new Date().toISOString().slice(0,10); }

function loadUser() {
  try { var u = localStorage.getItem(USER_KEY); return u ? JSON.parse(u) : {}; }
  catch(e) { return {}; }
}

// ===== 连续打卡计算 =====
function calcStreak(tasks) {
  var streak = 0;
  var checkDate = new Date();
  checkDate.setHours(0,0,0,0);
  while(true) {
    var ds = checkDate.toISOString().slice(0,10);
    var hasDone = tasks.some(function(t){ return t.done && t.doneAt && t.doneAt.indexOf(ds)===0; });
    if(!hasDone) break;
    streak++;
    checkDate.setDate(checkDate.getDate()-1);
  }
  return streak;
}

// ===== 效率评分 =====
function calcScore(tasks) {
  if(!tasks.length) return 0;
  var done = tasks.filter(function(t){return t.done;}).length;
  var total = tasks.length;
  var baseRate = done / total;
  // 有截止日期且按时完成的加分
  var onTime=0;var withDeadline=0;
  for(var i=0;i<tasks.length;i++){
    if(tasks[i].dueDate){
      withDeadline++;
      if(tasks[i].done && tasks[i].doneAt && tasks[i].doneAt <= tasks[i].dueDate) onTime++;
    }
  }
  var bonus = withDeadline>0 ? (onTime/withDeadline)*0.15 : 0;
  // 连续打卡加成
  var streak = calcStreak(tasks);
  var streakBonus = Math.min(streak*0.02, 0.15);
  return Math.round((baseRate+bonus+streakBonus)*100);
}

// ===== 问候语 & 日期 =====
function getGreeting() {
  var h = new Date().getHours();
  if(h<6) return '夜深了，注意休息 🌙';
  if(h<9) return '早上好 ☀️';
  if(h<12) return '上午好 👋';
  if(h<14) return '中午好 🍱';
  if(h<18) return '下午好 💪';
  if(h<22) return '晚上好 🌆';
  return '夜深了，注意休息 🌙';
}
function getTodayStr() {
  var d = new Date();
  var week = ['日','一','二','三','四','五','六'];
  return (d.getMonth()+1)+'月'+d.getDate()+'日 星期'+week[d.getDay()];
}

// ===== 到期状态判断 =====
function getDueStatus(task) {
  if(!task.dueDate) return 'none'; // 无截止日期
  var today = todayStr();
  if(task.done) return 'done';
  if(task.dueDate < today) return 'overdue'; // 已过期
  if(task.dueDate === today) return 'today'; // 今天到期
  return 'future'; // 未来
}
function formatDueDate(dueDate) {
  if(!dueDate) return '';
  try {
    var d = new Date(dueDate.replace(' ','T'));
    if(isNaN(d.getTime()))return '';
    var today = new Date(); today.setHours(0,0,0,0);
    var dd = new Date(d); dd.setHours(0,0,0,0);
    var diff = Math.floor((dd-today)/86400000);
    if(diff===0) return '📅 今天';
    if(diff===1) return '📅 明天';
    if(diff===2) return '📅 后天';
    if(diff>0&&diff<=7) return '📅 '+diff+'天后';
    if(diff===-1) return '⚠️ 昨天';
    if(diff<-1)return '⚠️ 过期'+Math.abs(diff)+'天';
    return (d.getMonth()+1)+'/'+d.getDate();
  } catch(e){return'';}
}

// ===== Vue App =====
new Vue({
  el: '#app',
  data: function() {
    return {
      tasks: [],
      kw: '',
      curCat: '全部',
      catList: ['全部', '生活', '工作', '学习', '购物', '健康', '其他'],
      quickInput: '',
      editingId: null,
      editForm: { title:'', desc:'', category:'', priority:'mid', dueDate:'' },
      userName: '',
      userEmoji: '',
      userId: '',
      modalShow: false, modalTitle: '', modalMsg: '',
      modalOkText: '确定', modalCancelBtn: false,
      _modalCbOk: null, _modalCbCancel: null,
      toastShow: false, toastMsg: '', _toastTimer: null,
      // v5.1保留
      greetingText: getGreeting(),
      todayStr: getTodayStr(),
      refreshTip: false,
      _touchY: 0,
      _longPressTimer: null,
      _longPressTask: null,
      // v5.2新增
      streak: 0,
      efficiencyScore: 0,
      todayFocusMode: false,
      showSkeleton: true,
      weekLabels: ['', '', '', '', '', '', '']
    };
  },

  computed: {
    filteredTasks: function() {
      var self = this;
      var list = this.tasks;
      // 分类筛选
      if(this.curCat !== '全部') list = list.filter(function(t){return t.category===self.curCat;});
      // 搜索
      if(this.kw.trim()) {
        var k=this.kw.toLowerCase();
        list=list.filter(function(t){
          return t.title.toLowerCase().indexOf(k)>=0||(t.desc&&t.desc.toLowerCase().indexOf(k)>=0);
        });
      }
      // 聚焦模式：只显示未完成的
      if(this.todayFocusMode) list = list.filter(function(t){return !t.done;});
      
      return list.slice().sort(function(a,b){
        // 已完成的排后面
        if(a.done!==b.done)return a.done?1:-1;
        // 过期的排最前
        var sa=getDueStatus(a), sb=getDueStatus(b);
        if(sa==='overdue'&&sb!=='overdue')return -1;
        if(sb==='overdue'&&sa!=='overdue')return 1;
        // 今天到期的其次
        if(sa==='today'&&sb!=='today')return -1;
        if(sb==='today'&&sa!=='today')return 1;
        // 高优先级在前
        var po={'high':0,'mid':1,'low':2};
        if((a.priority||'mid')!==(b.priority||'mid'))return(po[a.priority||'mid']||1)-(po[b.priority||'mid']||1);
        return new Date(b.createdAt)-new Date(a.createdAt);
      });
    },
    
    // 各类统计
    doneCount: function(){return this.tasks.filter(function(t){return t.done;}).length;},
    pendingCount: function(){return this.tasks.filter(function(t){return !t.done;}).length;},
    highPriorityCount: function(){return this.tasks.filter(function(t){return !t.done&&t.priority==='high';}).length;},
    overdueCount: function(){
      return this.tasks.filter(function(t){return !t.done && getDueStatus(t)==='overdue';}).length;
    },
    dueTodayCount: function(){
      return this.tasks.filter(function(t){return !t.done && getDueStatus(t)==='today';}).length;
    },
    totalTasks: function(){return this.tasks.length||1;},
    
    categoryStats: function(){
      var m={};
      for(var i=0;i<this.tasks.length;i++){var c=this.tasks[i].category||'其他';m[c]=(m[c]||0)+1;}
      return m;
    },
    
    weekData: function(){
      var arr=[0,0,0,0,0,0,0];var labels=['','','','','','',''];
      var today=new Date();
      for(var i=6;i>=0;i--){var d=new Date(today);d.setDate(d.getDate()-i);labels[6-i]=(d.getMonth()+1)+'/'+d.getDate();}
      for(var j=0;j<this.tasks.length;j++){
        var t=this.tasks[j];if(!t.done||!t.doneAt)continue;
        var td=new Date(t.doneAt);
        var diff=Math.floor((today-td)/86400000);
        if(diff>=0&&diff<7)arr[6-diff]++;
      }
      this.weekLabels=labels;return arr;
    },

    // 每月趋势数据（用于统计页）
    monthData: function(){
      var daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
      var arr=[];
      var today=new Date();
      for(var i=1;i<=daysInMonth;i++){arr.push({day:i,count:0});}
      for(var j=0;j<this.tasks.length;j++){
        var t=this.tasks[j];if(!t.done||!t.doneAt)continue;
        var td=new Date(t.doneAt);
        if(td.getMonth()===today.getMonth()&&td.getFullYear()===today.getFullYear()){
          var day=td.getDate();
          if(arr[day-1])arr[day-1].count++;
        }
      }
      return arr;
    }
  },

  mounted: function() {
    var self = this;
    this.initUser();
    this.tasks = loadTasks();
    this.streak = calcStreak(this.tasks);
    this.efficiencyScore = calcScore(this.tasks);
    this.initBackButton();
    // 骨架屏消失
    setTimeout(function(){ self.showSkeleton=false; }, 600);
    // 每分钟更新问候语和日期
    setInterval(function(){
      self.greetingText = getGreeting();
      self.todayStr = getTodayStr();
    }, 60000);
  },

  methods: {
    // ===== 导航 =====
    nav: function(id) {
      document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('on');});
      var el=document.getElementById(id);if(el)el.classList.add('on');
      if(id==='pg-edit'&&!this.editingId){
        this.$nextTick(function(){
          var inp=document.querySelector('#pg-edit input');
          if(inp)setTimeout(function(){inp.focus();},150);
        });
      }
      // 切换页面时刷新统计数据
      if(id==='pg-stats'||id==='pg-me'){
        this.streak = calcStreak(this.tasks);
        this.efficiencyScore = calcScore(this.tasks);
      }
    },

    // ===== 任务操作 =====
    toggleDone: function(t) {
      t.done=!t.done;t.doneAt=t.done?now():null;this.save();
      this.streak = calcStreak(this.tasks);
      this.efficiencyScore = calcScore(this.tasks);
      this.toast(t.done?'已完成 ✓':'已恢复');
    },

    openTask: function(t) {
      this.editingId=t.id;
      this.editForm={title:t.title,desc:t.desc||'',category:t.category||'',priority:t.priority||'mid',dueDate:t.dueDate||''};
      this.nav('pg-edit');
    },

    quickAdd: function() {
      var title=this.quickInput.trim();if(!title)return;
      this.tasks.unshift({
        id:genId(),title:title,desc:'',
        category:this.curCat!=='全部'?this.curCat:'',
        priority:'mid',done:false,createdAt:now(),doneAt:null,dueDate:null
      });
      this.quickInput='';this.save();this.toast('已添加 ✓');
      this.streak = calcStreak(this.tasks);
      this.efficiencyScore = calcScore(this.tasks);
    },

    cancelEdit: function(){this.nav('pg-home');this.editingId=null;this.editForm={title:'',desc:'',category:'',priority:'mid',dueDate:''};},

    saveEdit: function() {
      var f=this.editForm;if(!f.title.trim()){this.toast('请输入标题');return;}
      if(this.editingId){
        for(var i=0;i<this.tasks.length;i++){
          if(this.tasks[i].id===this.editingId){
            this.tasks[i].title=f.title.trim();
            this.tasks[i].desc=f.desc.trim();
            this.tasks[i].category=f.category;
            this.tasks[i].priority=f.priority;
            this.tasks[i].dueDate=f.dueDate||null;
            break;
          }
        }
        this.toast('已更新');
      }else{
        this.tasks.unshift({id:genId(),title:f.title.trim(),desc:f.desc.trim(),category:f.category,priority:f.priority,done:false,createdAt:now(),doneAt:null,dueDate:f.dueDate||null});
        this.toast('已创建 ✓');
      }
      this.save();this.cancelEdit();
      this.streak = calcStreak(this.tasks);
      this.efficiencyScore = calcScore(this.tasks);
    },

    deleteTask: function() {
      var self=this;
      this.showModal('确认删除','确定要删除「'+this.editForm.title+'」吗？\n此操作不可恢复。','删除','取消',function(){
        self.tasks=self.tasks.filter(function(t){return t.id!==self.editingId;});self.save();self.cancelEdit();self.toast('已删除');
        self.streak = calcStreak(self.tasks);
        self.efficiencyScore = calcScore(self.tasks);
      },null,true);
    },

    doSearch: function(){},
    filterTasks: function(){},

    toggleFocus: function(){
      this.todayFocusMode = !this.todayFocusMode;
      this.toast(this.todayFocusMode ? '🎯 聚焦模式：只看待办' : '📋 显示全部');
    },

    // ===== 长按 & 触摸 =====
    onTouchStart: function(e){this._touchY=e.touches?e.touches[0].clientY:0;},
    onTouchMove: function(e){
      if(!this._touchY)return;
      var y=e.touches?e.touches[0].clientY:0;
      if(y-this._touchY>60)this.refreshTip=true;else this.refreshTip=false;
    },
    onTouchEnd: function(){var self=this;if(self.refreshTip){/* 可以触发刷新 */}self.refreshTip=false;self._touchY=0;},
    
    onLongPress: function(task,e){
      var self=this;
      clearTimeout(this._longPressTimer);
      this._longPressTimer=setTimeout(function(){
        self.showModal('快速操作','「'+task.title+'」\n\n选择要执行的操作：','',function(){
          self.tasks=self.tasks.filter(function(t){return t.id!==task.id;});self.save();self.toast('已删除');
        },null,true);
      },500);
    },

    // ===== 数据持久化 =====
    save: function(){saveTasks(this.tasks);},

    // ===== 工具函数 =====
    priorityLabel: function(p){return{high:'⬆ 高',mid:'→ 中',low:'⬇ 低'}[p]||'→ 中';},

    fmtTime: function(t){
      if(!t)return'';
      try{var d=new Date(t.replace(' ','T'));if(isNaN(d.getTime()))return'';
        var diff=Date.now()-d.getTime();
        if(diff<60000)return'刚刚';
        if(diff<3600000)return Math.floor(diff/60000)+'分钟前';
        if(diff<86400000)return Math.floor(diff/3600000)+'小时前';
        if(diff<604800000)return Math.floor(diff/86400000)+'天前';
        return(d.getMonth()+1)+'/'+d.getDate();
      }catch(e){return'';}
    },

    dueInfo: function(task) {
      var s = getDueStatus(task);
      if(s==='none')return '';
      if(s==='overdue')return '⚠️ 已过期';
      if(s==='today')return '🔥 今天';
      if(s==='future')return formatDueDate(task.dueDate);
      return '';
    },

    dueClass: function(task) {
      return 'due-'+getDueStatus(task);
    },

    // ===== 批量操作 =====
    completeAllPending: function() {
      var pending = this.tasks.filter(function(t){return !t.done;});
      if(!pending.length){this.toast('没有待办任务');return;}
      var self=this;
      this.showModal('一键完成','将 '+pending.length+' 个待办任务标记为已完成？\n\n⚠️ 此操作不可快速撤销','全部完成','取消',function(){
        for(var i=0;i<self.tasks.length;i++){if(!self.tasks[i].done){self.tasks[i].done=true;self.tasks[i].doneAt=now();}}
        self.save();self.toast('✅ 已完成 '+pending.length+' 条');
        self.streak = calcStreak(self.tasks);
        self.efficiencyScore = calcScore(self.tasks);
      },null,true);
    },

    // ===== 我的页面 =====
    exportData: function(){
      var data=JSON.stringify({version:VER,exportDate:now(),tasks:this.tasks},null,2);
      var blob=new Blob([data],{type:'application/json'});
      var url=URL.createObjectURL(blob);var a=document.createElement('a');
      a.href=url;a.download='万能任务备份_'+new Date().toISOString().slice(0,10)+'.json';
      a.click();URL.revokeObjectURL(url);this.toast('导出成功 ✓');
    },

    clearCompleted: function(){
      var count=this.tasks.filter(function(t){return t.done;}).length;
      if(count===0){this.toast('没有已完成的任务');return;}
      var self=this;
      this.showModal('清除完成项','确定清除 '+count+' 个已完成的任务？\n\n此操作不可撤销','清除','取消',function(){
        self.tasks=self.tasks.filter(function(t){return !t.done;});self.save();self.toast('已清除 '+count+' 条');
        self.streak = calcStreak(self.tasks);
        self.efficiencyScore = calcScore(self.tasks);
      },null,true);
    },

    showHelp:function(){
      this.showModal('使用帮助',
        '• 底部输入框快速添加任务\n   回车或点击➕即可创建\n\n'
        +'• 点击卡片进入编辑详情\n   可设置优先级和截止日期\n\n'
        +'• 左侧圆圈 ✓ 标记完成/恢复\n\n'
        +'• 🔍 搜索 + 分类标签筛选\n\n'
        +'• 长按卡片可快速删除\n\n'
        +'• 设置截止日期后会自动高亮\n   过期/今天到期 的任务\n\n'
        +'• 统计页查看完成率与趋势图\n\n'
        +' v'+VER+' · 享受高效的每一天 💪',
        '知道了','',null,null,false);
    },

    showAbout:function(){
      this.showModal('关于万能任务',
        '📱 万能任务 v'+VER+'\n\n'
        +'一款简洁高效的任务管理工具。\n'
        +'所有数据保存在本地手机。\n\n'
        +'✨ v'+VER+'新功能：\n'
        +'· 截止日期与到期提醒\n'
        +'· 连续打卡天数统计\n'
        +'· 效率评分系统\n'
        +'· 今日聚焦模式\n'
        +'· 全新视觉体验\n\n'
        +'感谢使用 ❤️',
        '好的','',null,null,false);
    },

    // ===== 初始化 =====
    initUser: function(){
      var u=loadUser();if(u.name)this.userName=u.name;if(u.emoji)this.userEmoji=u.emoji;if(u.id)this.userId=u.id;
      if(!this.userName){this.userName='用户';this.userEmoji='😊';this.userId=Math.floor(Math.random()*90000+10000).toString();localStorage.setItem(USER_KEY,JSON.stringify({name:this.userName,emoji:this.userEmoji,id:this.userId}));}
    },

    initBackButton: function(){
      var self=this;
      document.addEventListener('backbutton',function(e){
        e.preventDefault();var curOn=document.querySelector('.pg.on');
        if(curOn&&curOn.id==='pg-edit'){self.cancelEdit();}
        else if(curOn&&(curOn.id==='pg-stats'||curOn.id==='pg-me')){self.nav('pg-home');}
        else{if(self._canExit){if(navigator.app)navigator.app.exitApp();}
        else{self._canExit=true;self.toast('再按一次退出应用');setTimeout(function(){self._canExit=false;},2000);}}
      });
    },

    // ===== Toast & Modal =====
    toast: function(msg){var self=this;this.toastMsg=msg;this.toastShow=true;clearTimeout(this._toastTimer);this._toastTimer=setTimeout(function(){self.toastShow=false;},1800);},

    showModal: function(title,msg,okText,cancelText,onOk,onCancel,showCancel){
      this.modalTitle=title;this.modalMsg=msg;this.modalOkText=okText||'确定';
      this.modalCancelBtn=!!showCancel;this._modalCbOk=onOk||null;this._modalCbCancel=onCancel||null;this.modalShow=true;
    },

    modalOk: function(){this.modalShow=false;if(this._modalCbOk)this._modalCbOk();},
    modalCancel: function(){this.modalShow=false;if(this._modalCbCancel)this._modalCbCancel();}
  }
});
