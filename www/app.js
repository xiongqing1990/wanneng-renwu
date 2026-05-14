const API = (localStorage.getItem('wn_api_base') || '') + '/api';
let token = localStorage.getItem('wn_token') || '';
let userId = parseInt(localStorage.getItem('wn_uid')) || 1;

// ===== Mock 数据（离线/演示模式）=====
var MOCK_TASKS = [
  { id:1, user_id:2, title:'求5月15日电影票2张', description:'万达影城3排5座，预算15元/张，共2张', category:'票券', catName:'票券', status:'ongoing', budget:30, nickname:'小明', avatar_emoji:'😊', credit_score:480, bid_count:3, likes:12, views:89, images:[], bids:[], publish_time:new Date(Date.now()-3600000).toISOString(), acceptedBidId:0 },
  { id:2, user_id:3, title:'出售游戏金币1000个', description:'王者荣耀iOS区，诚心出售，可小刀', category:'游戏', catName:'游戏', status:'ongoing', budget:100, nickname:'大王', avatar_emoji:'🎮', credit_score:520, bid_count:5, likes:23, views:156, images:[], bids:[], publish_time:new Date(Date.now()-7200000).toISOString(), acceptedBidId:0 },
  { id:3, user_id:4, title:'求XX餐厅5折券2张', description:'海底捞或星巴克都行，明天朋友聚餐用', category:'餐饮优惠', catName:'餐饮优惠', status:'ongoing', budget:80, nickname:'小红', avatar_emoji:'🌸', credit_score:490, bid_count:8, likes:45, views:230, images:[], bids:[], publish_time:new Date(Date.now()-86400000).toISOString(), acceptedBidId:0 },
  { id:4, user_id:5, title:'帮忙取快递送到家门口', description:'菜鸟驿站取3个件，送上门，小区内有电梯', category:'跑腿', catName:'跑腿', status:'assigned', budget:5, nickname:'阿强', avatar_emoji:'💪', credit_score:510, bid_count:1, likes:7, views:45, images:[], bids:[{id:1,user_id:1,nickname:'我',avatar_emoji:'😊',quote:5,message:'我可以帮忙',status:'accepted'}], publish_time:new Date(Date.now()-1800000).toISOString(), acceptedBidId:1 },
  { id:5, user_id:6, title:'代买喜茶多冰少糖一杯', description:'喜茶(万达店)，芝芝莓莓，多冰少糖', category:'代购', catName:'代购', status:'ongoing', budget:15, nickname:'小李', avatar_emoji:'🍵', credit_score:475, bid_count:2, likes:18, views:67, images:[], bids:[], publish_time:new Date(Date.now()-900000).toISOString(), acceptedBidId:0 },
  { id:6, user_id:7, title:'求购二手山地车一辆', description:'学生党通勤用，预算有限，200以内能骑就行', category:'二手', catName:'二手', status:'ongoing', budget:200, nickname:'小王', avatar_emoji:'🚲', credit_score:500, bid_count:4, likes:34, views:178, images:[], bids:[], publish_time:new Date(Date.now()-172800000).toISOString(), acceptedBidId:0 },
  { id:7, user_id:8, title:'帮忙排队买限量球鞋', description:'明天上午9点商场开门，帮排前10名', category:'生活', catName:'生活服务', status:'ongoing', budget:50, nickname:'阿杰', avatar_emoji:'👟', credit_score:530, bid_count:6, likes:56, views:290, images:[], bids:[], publish_time:new Date(Date.now()-3600000).toISOString(), acceptedBidId:0 },
  { id:8, user_id:2, title:'设计一张活动海报', description:'校园跳蚤市场海报，风格活泼可爱，A3尺寸', category:'其他', catName:'其他', status:'completed', budget:80, nickname:'小明', avatar_emoji:'😊', credit_score:480, bid_count:2, likes:29, views:134, images:[], bids:[{id:2,user_id:1,nickname:'我',avatar_emoji:'😊',quote:80,message:'可以设计',status:'accepted'}], publish_time:new Date(Date.now()-604800000).toISOString(), acceptedBidId:2 }
];
var MOCK_USER = { id:1, nickname:'测试用户', avatar_emoji:'😊', credit_score:500, phone:'138****0000', task_count:3, bid_count:5, avg_rating:4.8 };
var MOCK_CHATS = [
  { id:1, peer_id:2, peer:{id:2,nickname:'小明',avatar_emoji:'😊'}, lastMsg:'好的，没问题！', lastTime:new Date(Date.now()-1800000).toISOString(), unread:2, task_id:1 },
  { id:2, peer_id:4, peer:{id:4,nickname:'阿强',avatar_emoji:'💪'}, lastMsg:'已经取到了', lastTime:new Date(Date.now()-3600000).toISOString(), unread:0, task_id:4 }
];
var MOCK_CHAT_MSGS = [
  { id:1, chat_id:1, sender_id:2, content:'你好，电影票还有吗？', type:'text', created_at:new Date(Date.now()-3600000).toISOString() },
  { id:2, chat_id:1, sender_id:1, content:'有的，你要几张？', type:'text', created_at:new Date(Date.now()-3000000).toISOString() },
  { id:3, chat_id:1, sender_id:2, content:'要2张，15号晚上的', type:'text', created_at:new Date(Date.now()-2400000).toISOString() },
  { id:4, chat_id:1, sender_id:1, content:'好的，没问题！', type:'text', created_at:new Date(Date.now()-1800000).toISOString() }
];
var mockMsgId = 5;
var mockTaskId = 9;
var mockChatId = 3;
var mockBidId = 10;

function mockResponse(data) {
  return Promise.resolve({ code:0, data:data });
}

async function api(path, opts) {
  opts = opts || {};
  var headers = { 'Content-Type': 'application/json', 'x-user-id': String(userId) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  // 尝试真实API
  if (API && API !== '/api') {
    try {
      var res = await fetch(API + path, Object.assign({}, opts, {
        headers: Object.assign(headers, opts.headers || {})
      }));
      var json = await res.json();
      if (json.code === 0) return json;
      // 真实API返回非0也走mock
    } catch(e) {}
  }

  // ===== Mock Fallback =====
  var method = (opts.method || 'GET').toUpperCase();
  // GET /tasks
  if (path.match(/^\/tasks(\?|$)/) && method === 'GET') {
    var params = new URLSearchParams(path.split('?')[1]||'');
    var cat = params.get('category');
    var kw = params.get('keyword');
    var list = MOCK_TASKS.filter(function(t){return t.status==='ongoing'||t.status==='assigned';});
    if(cat) list=list.filter(function(t){return t.category===cat||t.catName===cat;});
    if(kw){var k=kw.toLowerCase();list=list.filter(function(t){return t.title.toLowerCase().indexOf(k)>=0||t.description.toLowerCase().indexOf(k)>=0;});}
    return mockResponse({list:list,total:list.length});
  }
  // GET /tasks/:id
  var tmatch = path.match(/^\/tasks\/(\d+)$/);
  if(tmatch&&method==='GET'){var t=MOCK_TASKS.find(function(t){return t.id==tmatch[1]});if(t)return mockResponse(JSON.parse(JSON.stringify(t)));}
  // POST /tasks (发布)
  if(path==='/tasks'&&method==='POST'){try{var body=JSON.parse(opts.body);var nt={id:++mockTaskId,user_id:userId,title:body.title||'',description:body.description||'',category:body.cat||body.category||'',catName:body.cat||body.category||'',status:'ongoing',budget:parseInt(body.budget)||0,nickname:MOCK_USER.nickname,avatar_emoji:MOCK_USER.avatar_emoji,credit_score:MOCK_USER.credit_score,bid_count:0,likes:0,views:0,images:body.images||[],bids:[],publish_time:new Date().toISOString(),acceptedBidId:0};MOCK_TASKS.unshift(nt);return mockResponse(nt);}catch(ex){}}
  // POST /tasks/:id/bid (接单)
  var bmatch=path.match(/^\/tasks\/(\d+)\/bid$/);
  if(bmatch&&method==='POST'){var bt=MOCK_TASKS.find(function(t){return t.id==bmatch[1]});if(bt){bt.bid_count=(bt.bid_count||0)+1;return mockResponse({id:++mockBidId,user_id:userId,nickname:MOCK_USER.nickname,avatar_emoji:MOCK_USER.avatar_emoji,message:'我可以帮忙',status:'pending'});}}
  // POST /tasks/:id/accept/:bidId
  if(path.match(/\/accept\//)&&method==='POST'){return mockResponse({ok:true});}
  // POST /tasks/:id/complete
  var cmatch=path.match(/^\/tasks\/(\d+)\/complete$/);
  if(cmatch&&method==='POST'){var ct=MOCK_TASKS.find(function(t){return t.id==cmatch[1]});if(ct){ct.status='completed';return mockResponse({ok:true});}}
  // POST /tasks/:id/like
  var lmatch=path.match(/^\/tasks\/(\d+)\/like$/);
  if(lmatch&&method==='POST'){return mockResponse({liked:true});}
  // GET /chats
  if(path==='/chats'&&method==='GET'){
    var list=MOCK_CHATS.map(function(c){return{id:c.id,peer_id:c.peer_id,peer:c.peer,lastMsg:c.lastMsg||'',lastTime:c.lastTime||'',unread:c.unread||0,task_id:c.task_id};});
    return mockResponse({list:list});
  }
  // POST /chats
  if(path==='/chats'&&method==='POST'){return mockResponse({id:++mockChatId,peer:{id:2,nickname:'小明',avatar_emoji:'😊'}});}
  // GET /chats/:id/messages
  var mmatch=path.match(/^\/chats\/(\d+)\/messages$/);
  if(mmatch&&method==='GET'){
    var cid=parseInt(mmatch[1]);var msgs=MOCK_CHAT_MSGS.filter(function(m){return m.chat_id===cid;});if(cid===2)msgs=[{id:20,chat_id:2,sender_id:4,content:'快递我放门口了',type:'text',created_at:new Date(Date.now()-1800000).toISOString()}];
    return mockResponse({list:msgs,total:msgs.length});
  }
  // POST /chats/:id/messages
  var smatch=path.match(/^\/chats\/(\d+)\/messages$/);
  if(smatch&&method==='POST'){try{var sb=JSON.parse(opts.body);var nm={id:++mockMsgId,chat_id:parseInt(smatch[1]),sender_id:userId,content:sb.content,type:sb.type||'text',created_at:new Date().toISOString()};MOCK_CHAT_MSGS.push(nm);return mockResponse(nm);}catch(ex){}}
  // GET /user/profile
  if(path==='/user/profile'&&method==='GET'){return mockResponse(MOCK_USER);}
  // GET /tasks?userId=
  if(path.indexOf('userId=')>0&&method==='GET'){var uid=parseInt(path.match(/userId=(\d+)/)[1]);var ml=MOCK_TASKS.filter(function(t){return t.user_id===uid;});return mockResponse({list:ml,total:ml.length});}
  // GET /user/bids
  if(path==='/user/bids'&&method==='GET'){return mockResponse({list:[]});}
  // GET /stats/home
  if(path==='/stats/home'&&method==='GET'){return mockResponse({today:128,hotCat:'票券',activeUsers:56});}
  // GET /stats/detail
  if(path==='/stats/detail'&&method==='GET'){return mockResponse({total:256,ongoing:32,completed:189,catStats:[{name:'票券',count:68},{name:'游戏',count:45},{name:'跑腿',count:38},{name:'代购',count:32},{name:'其他',count:43}],topUsers:[]});}
  // POST /auth/login
  if(path==='/auth/login'&&method==='POST'){token='mock_token_'+Date.now();localStorage.setItem('wn_token',token);return mockResponse({token:token,user:MOCK_USER});}
  // POST /ratings
  if(path==='/ratings'&&method==='POST'){return mockResponse({ok:true,score:5});}
  // GET /ratings/:userId
  var rmatch=path.match(/^\/ratings\/(\d+)$/);
  if(rmatch&&method==='GET'){return mockResponse({list:[]});}

  // 默认返回
  return Promise.resolve({code:-1,message:'离线演示模式：此操作已模拟成功'});
}

function compressImage(file, maxW, quality) {
  maxW = maxW || 800; quality = quality || 0.6;
  return new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

new Vue({
  el: '#app',
  data: function() {
    return {
      loading: false,
      kw: '',
      curCat: '全部',
      catList: ['全部', '票券', '游戏', '生活', '代购', '跑腿', '其他'],
      tasks: [],
      page: 1,
      pageSize: 20,
      hasMore: false,
      homeStats: { today: 0, hotCat: '-', activeUsers: 0 },
      pub: { title: '', desc: '', cat: '票券' },
      pubCats: ['票券', '游戏', '生活', '代购', '跑腿', '其他'],
      pubImages: [],
      chatList: [],
      curChat: { id: 0, peer: { id: 0, nickname: '' } },
      chatMsgs: [],
      msgInput: '',
      detail: { id: 0, user_id: 0, title: '', description: '', category: '', catName: '', status: '', bids: 0, likes: 0, views: 0, bids: [], images: [], acceptedBidId: 0, myBidId: 0, canAcceptBid: false, canComplete: false },
      liked: false,
      me: { id: userId, nickname: '加载中...', avatar_emoji: '😊', credit_score: 500 },
      myStats: { tasks: 0, bids: 0, rating: '-' },
      mtab: 0,
      myPublished: [],
      myBids: [],
      stats: { total: 0, ongoing: 0, completed: 0, catStats: [], topUsers: [] },
      loginPhone: '',
      loginCode: '',
      modalOn: false,
      modalTitle: '',
      modalContent: '',
      modalOk: null,
      toastOn: false,
      toastMsg: '',
      _toastTimer: null,
      recording: false,
      recSec: 0,
      _recInterval: null,
      _recChunks: [],
      _mediaRec: null,
      playingVoice: null,
      previewing: false,
      previewUrl: '',
      _pollTimer: null,
      _lastMsgId: 0,
      // 评价相关
      ratingOn: false,
      ratingScore: 5,
      ratingTags: [],
      ratingContent: '',
      ratingTo: { id: 0, nickname: '', avatar_emoji: '' },
      ratingTaskId: 0,
      ratingTargetUserId: 0,
      ratingSubmitted: false,
      ratingTagOpts: ['准时交付', '沟通顺畅', '质量很好', '值得推荐', '态度认真'],
      myRatings: []
    };
  },

  computed: {
    totalUnread: function() {
      var s = 0;
      for (var i = 0; i < this.chatList.length; i++) s += (this.chatList[i].unread || 0);
      return s;
    },
    myTaskList: function() { return this.mtab === 0 ? this.myPublished : this.myBids; },
    acceptedBid: function() {
      var abid = this.detail.acceptedBidId;
      if (!abid && this.detail.bids) {
        for (var i = 0; i < this.detail.bids.length; i++) {
          if (this.detail.bids[i].status === 'accepted') { abid = this.detail.bids[i].id; break; }
        }
      }
      if (!abid) return null;
      for (var i = 0; i < this.detail.bids.length; i++) {
        if (this.detail.bids[i].id === abid) return this.detail.bids[i];
      }
      return null;
    }
  },

  mounted: function() {
    this.loadHome();
    this.loadProfile();
    this.initSwipeBack();
    this.initAndroidBack();
  },

  methods: {
    nav: function(id) {
      var self = this;
      document.querySelectorAll('.pg').forEach(function(p) { p.classList.remove('on'); });
      var el = document.getElementById(id);
      if (el) el.classList.add('on');
      // 记录导航栈（首页不入栈）
      if (id !== 'pg-home' && id !== 'pg-pub' && id !== 'pg-chats' && id !== 'pg-me') {
        this._navStack = this._navStack || [];
        if (this._navStack[this._navStack.length - 1] !== id) {
          this._navStack.push({ page: id, home: this._curHome || 'pg-home' });
        }
      } else {
        this._navStack = [];
        this._curHome = id;
      }
      if (id === 'pg-me') this.loadProfile();
      if (id === 'pg-chats') this.loadChats();
      if (id === 'pg-home') { this.page = 1; this.tasks = []; this.loadTasks(); }
      if (id === 'pg-stats') this.loadStats();
      if (id === 'pg-mytasks') this.loadMyTasks();
    },
    goBack: function() {
      // Android返回 / 左滑返回
      var stack = this._navStack || [];
      if (stack.length > 0) {
        var prev = stack.pop();
        this.nav(prev.home || 'pg-home');
      } else {
        // 当前在首页tab，尝试退出app
        if (this._canExit) {
          if (navigator.app) navigator.app.exitApp();
          else window.history.back();
        } else {
          this.toast('再按一次退出');
          this._canExit = true;
          var self = this;
          setTimeout(function() { self._canExit = false; }, 2000);
        }
      }
    },
    initSwipeBack: function() {
      var self = this;
      var appEl = document.getElementById('app');
      var hint = document.getElementById('swipeHint');
      var sx = 0, sy = 0, swiping = false, threshold = 80;

      appEl.addEventListener('touchstart', function(e) {
        // 只在非首页页面、从左边缘开始滑动时触发
        var curOn = document.querySelector('.pg.on');
        if (!curOn) return;
        var pid = curOn.id;
        if (pid === 'pg-home' || pid === 'pg-pub' || pid === 'pg-chats' || pid === 'pg-me') return;
        if (e.touches[0].clientX > 20) return;
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
        swiping = true;
      }, { passive: true });

      appEl.addEventListener('touchmove', function(e) {
        if (!swiping) return;
        var dx = e.touches[0].clientX - sx;
        var dy = e.touches[0].clientY - sy;
        // 防止垂直滚动误触发
        if (Math.abs(dy) > Math.abs(dx) * 2.5) { swiping = false; hint.style.width = '0'; return; }
        if (dx > 0 && dx < 200) {
          hint.style.width = Math.min(dx / 2, 100) + '%';
          e.preventDefault();
        }
      }, { passive: false });

      appEl.addEventListener('touchend', function(e) {
        if (!swiping) return;
        swiping = false;
        var dx = e.changedTouches[0].clientX - sx;
        hint.style.width = '0';
        if (dx > threshold) self.goBack();
      }, { passive: true });
    },
    initAndroidBack: function() {
      var self = this;
      document.addEventListener('backbutton', function(e) {
        e.preventDefault();
        self.goBack();
      });
      // 也监听popstate作为备选
      window.addEventListener('popstate', function(e) {
        e.preventDefault();
        self.goBack();
      });
    },

    // ===== 通用 =====
    toast: function(msg) {
      var self = this;
      this.toastMsg = msg; this.toastOn = true;
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(function() { self.toastOn = false; }, 1800);
    },
    showModal: function(title, content, ok) {
      this.modalTitle = title;
      this.modalContent = content;
      this.modalOk = ok;
      this.modalOn = true;
    },
    closeModal: function(confirm) {
      this.modalOn = false;
      if (confirm && this.modalOk) this.modalOk();
    },
    statusText: function(s) {
      var m = { ongoing: '进行中', assigned: '已接单', completed: '已完成', cancelled: '已取消', draft: '草稿', pending: '待确认', accepted: '已接受', rejected: '已拒绝' };
      return m[s] || s || '';
    },
    statusColor: function(s) {
      var m = { ongoing: 'var(--g)', assigned: 'var(--o)', completed: 'var(--b)', cancelled: 'var(--t3)', pending: 'var(--o)', accepted: 'var(--g)', rejected: 'var(--t3)' };
      return m[s] || 'var(--t2)';
    },
    timeAgo: function(t) {
      if (!t) return '';
      var d = new Date(t.replace(' ', 'T'));
      if (isNaN(d.getTime())) return String(t).slice(5, 10);
      var diff = Date.now() - d.getTime();
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      return Math.floor(diff / 86400000) + '天前';
    },
    coverEmoji: function(cat) {
      var m = { ticket: '🎫', game: '🎮', life: '🏠', shopping: '🛒', delivery: '🏃', other: '📦', 票券: '🎫', 游戏: '🎮', 生活: '🏠', 代购: '🛒', 跑腿: '🏃', 其他: '📦' };
      return m[cat] || '📋';
    },
    tagToggle: function(t) {
      var idx = this.ratingTags.indexOf(t);
      if (idx >= 0) this.ratingTags.splice(idx, 1); else this.ratingTags.push(t);
    },

    // ===== 启动加载 =====
    loadHome: function() {
      this.loadHomeStats();
      this.loadTasks();
    },

    // ===== 首页 =====
    loadHomeStats: async function() {
      var r = await api('/stats/home');
      if (r.code === 0) this.homeStats = r.data;
    },
    loadTasks: async function() {
      this.loading = true;
      var cat = this.curCat === '全部' ? '' : this.curCat;
      var url = '/tasks?page=' + this.page + '&pageSize=' + this.pageSize;
      if (cat) url += '&category=' + encodeURIComponent(cat);
      if (this.kw) url += '&keyword=' + encodeURIComponent(this.kw);
      var r = await api(url);
      this.loading = false;
      if (r.code === 0) {
        var list = r.data.list || [];
        if (this.page === 1) {
          this.tasks = list;
        } else {
          this.tasks = this.tasks.concat(list);
        }
        this.hasMore = list.length >= this.pageSize;
      }
    },
    doSearch: function() {
      this.page = 1; this.tasks = []; this.loadTasks();
    },
    loadMore: function() {
      if (this.loading || !this.hasMore) return;
      this.page++;
      this.loadTasks();
    },

    // ===== 详情 =====
    openDetail: async function(t) {
      var r = await api('/tasks/' + t.id);
      if (r.code === 0) {
        var d = r.data;
        d.bids = d.bids || [];
        d.images = d.images || [];
        this.detail = d;
        this.liked = false;
        this.ratingSubmitted = false;
        // 检查是否已评价过
        this.loadMyRatings();
        this.nav('pg-detail');
      } else { this.toast(r.message || '加载失败'); }
    },
    toggleLike: async function() {
      var r = await api('/tasks/' + this.detail.id + '/like', { method: 'POST' });
      if (r.code === 0) {
        this.liked = r.data && r.data.liked;
        this.detail.likes = (this.detail.likes || 0) + (this.liked ? 1 : -1);
        this.detail.likes = Math.max(0, this.detail.likes);
      }
    },
    chatWithOwner: async function() {
      if (!this.detail.user_id || this.detail.user_id === this.me.id) { this.toast('不能和自己聊天'); return; }
      var r = await api('/chats', { method: 'POST', body: JSON.stringify({ peer_id: this.detail.user_id, task_id: this.detail.id }) });
      if (r.code === 0) {
        this.curChat = { id: r.data.id, peer: { id: this.detail.user_id, nickname: this.detail.nickname, avatar_emoji: this.detail.avatar_emoji } };
        this.startPolling();
        var mr = await api('/chats/' + r.data.id + '/messages');
        if (mr.code === 0) this.chatMsgs = mr.data.list || [];
        this.nav('pg-chat');
        this.scrollChat();
      }
    },

    // ===== 接单 =====
    doBid: async function() {
      var r = await api('/tasks/' + this.detail.id + '/bid', { method: 'POST', body: JSON.stringify({ quote: 0, message: '我可以帮忙！' }) });
      if (r.code === 0) {
        this.toast('申请成功，等待确认');
        this.openDetail({ id: this.detail.id });
      } else { this.toast(r.message || '申请失败'); }
    },

    // ===== 接受报价 =====
    acceptBid: function(bid) {
      var self = this;
      this.showModal('确认接受', '确定选择「' + bid.nickname + '」来完成此任务吗？', function() {
        self.doAcceptBid(bid.id);
      });
    },
    doAcceptBid: async function(bidId) {
      var r = await api('/tasks/' + this.detail.id + '/accept/' + bidId, { method: 'POST' });
      if (r.code === 0) {
        this.toast('已接受，请配合完成');
        this.openDetail({ id: this.detail.id });
      } else { this.toast(r.message || '操作失败'); }
    },

    // ===== 完成验收 =====
    markComplete: function() {
      var self = this;
      var ab = this.acceptedBid;
      var winnerName = ab ? ab.nickname : '接单者';
      this.showModal('确认完成', '确认任务「' + this.detail.title + '」已完成？完成后请给「' + winnerName + '」一个评价。', function() {
        self.doMarkComplete();
      });
    },
    doMarkComplete: async function() {
      var r = await api('/tasks/' + this.detail.id + '/complete', { method: 'POST' });
      if (r.code === 0) {
        this.toast('任务已完成，记得评价');
        this.openDetail({ id: this.detail.id });
        // 自动弹出评价
        var ab = this.acceptedBid;
        if (ab) {
          var self2 = this;
          setTimeout(function() {
            self2.showRatingModal(ab.user_id, ab.nickname, ab.avatar_emoji, self2.detail.id);
          }, 500);
        }
      } else { this.toast(r.message || '操作失败'); }
    },

    // ===== 评价 =====
    showRatingModal: function(toUserId, toNickname, toEmoji, taskId) {
      this.ratingTargetUserId = toUserId;
      this.ratingTaskId = taskId;
      this.ratingTo = { id: toUserId, nickname: toNickname, avatar_emoji: toEmoji };
      this.ratingScore = 5;
      this.ratingTags = [];
      this.ratingContent = '';
      this.ratingOn = true;
    },
    closeRatingModal: function() { this.ratingOn = false; },
    submitRating: async function() {
      if (!this.ratingScore || this.ratingScore < 1) { this.toast('请选择评分'); return; }
      var r = await api('/ratings', {
        method: 'POST',
        body: JSON.stringify({
          task_id: this.ratingTaskId,
          to_user_id: this.ratingTargetUserId,
          score: this.ratingScore,
          tags: this.ratingTags.join(','),
          content: this.ratingContent
        })
      });
      if (r.code === 0) {
        this.toast('评价成功，感谢你的反馈');
        this.ratingSubmitted = true;
        this.ratingOn = false;
        this.loadMyRatings();
      } else { this.toast(r.message || '评价失败'); }
    },
    loadMyRatings: async function() {
      var r = await api('/ratings/' + this.me.id);
      if (r.code === 0) this.myRatings = r.data.list || [];
    },
    isRatedByMe: function(toUserId, taskId) {
      for (var i = 0; i < this.myRatings.length; i++) {
        var r = this.myRatings[i];
        if (String(r.to_user_id) === String(toUserId)) return true;
      }
      return false;
    },

    // ===== 发布 =====
    pickPubImage: async function() {
      if (this.pubImages.length >= 3) { this.toast('最多3张图片'); return; }
      // 在Capacitor Android中，使用原生的文件选择器
      document.getElementById('pubFileInput').click();
    },
    onPubImage: function(e) {
      var self = this;
      var f = e.target.files[0]; if (!f) return;
      if (this.pubImages.length >= 3) { this.toast('最多3张图片'); return; }
      compressImage(f).then(function(base64) { self.pubImages.push(base64); });
      e.target.value = '';
    },
    doPublish: async function() {
      if (!this.pub.title) return this.toast('请输入标题');
      if (!this.pub.cat) return this.toast('请选择分类');
      var r = await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: this.pub.title,
          description: this.pub.desc || '',
          category: this.pub.cat,
          images: this.pubImages
        })
      });
      if (r.code === 0) {
        this.pub = { title: '', desc: '', cat: '票券' };
        this.pubImages = [];
        this.toast('发布成功！');
        this.kw = ''; this.curCat = '全部'; this.page = 1; this.tasks = [];
        this.loadTasks();
        this.nav('pg-home');
      } else { this.toast(r.message || '发布失败'); }
    },

    // ===== 消息列表 =====
    loadChats: async function() {
      var r = await api('/chats');
      if (r.code === 0) this.chatList = r.data.list || [];
    },

    // ===== 聊天 =====
    openChat: async function(c) {
      this.curChat = c;
      this.startPolling();
      var r = await api('/chats/' + c.id + '/messages');
      if (r.code === 0) this.chatMsgs = r.data.list || [];
      this.nav('pg-chat');
      var self = this;
      this.$nextTick(function() { self.scrollChat(); });
    },
    startPolling: function() {
      var self = this;
      this.stopPolling();
      this._pollTimer = setInterval(function() { self.pollMessages(); }, 4000);
    },
    stopPolling: function() {
      if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    },
    pollMessages: async function() {
      if (!this.curChat || !this.curChat.id) return;
      var r = await api('/chats/' + this.curChat.id + '/messages');
      if (r.code === 0 && r.data.list) {
        var msgs = r.data.list;
        if (msgs.length > this.chatMsgs.length) {
          this.chatMsgs = msgs;
          var self = this;
          this.$nextTick(function() { self.scrollChat(); });
        }
      }
    },
    sendMsg: async function() {
      if (!this.msgInput.trim()) return;
      var content = this.msgInput.trim();
      this.msgInput = '';
      var r = await api('/chats/' + this.curChat.id + '/messages', {
        method: 'POST', body: JSON.stringify({ content: content, type: 'text' })
      });
      if (r.code === 0) { this.chatMsgs.push(r.data); this.scrollChat(); }
      else { this.toast('发送失败'); }
    },
    pickChatImage: function() {
      document.getElementById('chatImgInput').click();
    },
    onChatImage: async function(e) {
      var self = this;
      var f = e.target.files[0]; if (!f) return;
      var base64 = await compressImage(f);
      var r = await api('/chats/' + this.curChat.id + '/messages', {
        method: 'POST', body: JSON.stringify({ content: base64, type: 'image' })
      });
      if (r.code === 0) { this.chatMsgs.push(r.data); this.scrollChat(); }
      else { this.toast('发送失败'); }
      e.target.value = '';
    },
    previewImg: function(url) { this.previewUrl = url; this.previewing = true; },
    playVoice: function(m) {
      var self = this;
      if (this.playingVoice === m.id) { this.playingVoice = null; return; }
      this.playingVoice = m.id;
      var audio = new Audio(m.content);
      audio.onended = function() { self.playingVoice = null; };
      audio.onerror = function() { self.playingVoice = null; self.toast('播放失败'); };
      audio.play();
    },
    startRec: function() {
      var self = this;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { this.toast('浏览器不支持录音'); return; }
      navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function(stream) {
        self.recording = true; self.recSec = 0; self._recChunks = [];
        self._mediaRec = new MediaRecorder(stream);
        self._mediaRec.ondataavailable = function(e) { if (e.data.size > 0) self._recChunks.push(e.data); };
        self._mediaRec.onstop = function() {
          stream.getTracks().forEach(function(t) { t.stop(); });
          if (self._recChunks.length === 0) return;
          var blob = new Blob(self._recChunks, { type: 'audio/webm' });
          var dur = self.recSec || 1;
          var reader = new FileReader();
          reader.onload = function() {
            api('/chats/' + self.curChat.id + '/messages', {
              method: 'POST', body: JSON.stringify({ content: reader.result, type: 'voice', duration: dur })
            }).then(function(r) {
              if (r.code === 0) { self.chatMsgs.push(r.data); self.scrollChat(); }
              else { self.toast('发送失败'); }
            });
          };
          reader.readAsDataURL(blob);
        };
        self._mediaRec.start();
        self._recInterval = setInterval(function() { self.recSec++; if (self.recSec >= 60) self.stopRec(); }, 1000);
      }).catch(function() { self.toast('无法访问麦克风'); });
    },
    stopRec: function() {
      if (!this.recording) return;
      this.recording = false;
      clearInterval(this._recInterval);
      if (this._mediaRec && this._mediaRec.state !== 'inactive') this._mediaRec.stop();
    },
    scrollChat: function() {
      this.$nextTick(function() {
        var el = document.getElementById('msgBox');
        if (el) el.scrollTop = el.scrollHeight;
      });
    },

    // ===== 我的 =====
    loadProfile: async function() {
      var r = await api('/user/profile');
      if (r.code === 0) {
        this.me = r.data;
        this.myStats = {
          tasks: r.data.task_count || 0,
          bids: r.data.bid_count || 0,
          rating: r.data.avg_rating ? Number(r.data.avg_rating).toFixed(1) : '-'
        };
      }
    },
    loadMyTasks: async function() {
      var uid = this.me.id;
      var r1 = await api('/tasks?page=1&pageSize=100&userId=' + uid);
      if (r1.code === 0) this.myPublished = r1.data.list || [];
      var r2 = await api('/user/bids');
      if (r2.code === 0) this.myBids = r2.data.list || [];
    },

    // ===== 数据分析 =====
    loadStats: async function() {
      var r = await api('/stats/detail');
      if (r.code === 0) this.stats = r.data;
    },

    // ===== 登录 =====
    doLogin: async function() {
      if (!this.loginPhone) return this.toast('请输入手机号');
      var r = await api('/auth/login', {
        method: 'POST', body: JSON.stringify({ phone: this.loginPhone, code: this.loginCode || '123456' })
      });
      if (r.code === 0) {
        token = r.data.token || '';
        userId = r.data.user ? r.data.user.id : userId;
        localStorage.setItem('wn_token', token);
        localStorage.setItem('wn_uid', userId);
        this.me = r.data.user || this.me;
        this.toast('登录成功');
        this.loadHome();
        this.nav('pg-home');
      } else { this.toast(r.message || '登录失败'); }
    }
  }
});
