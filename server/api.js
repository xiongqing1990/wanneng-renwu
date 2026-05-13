/**
 * 万能任务APP - 后端API v2.0
 * sql.js (SQLite WASM) 持久化 + 完整业务逻辑
 */
const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3100;

app.use(cors());
app.use(express.json());

// ===== 数据库初始化 =====
const DB_PATH = path.join(__dirname, 'data.db');
let db;
let saveTimer;

function saveDb() {
  if (!db) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const data = db.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (e) { console.error('DB save error:', e.message); }
  }, 1000);
}

function run(sql, params = []) {
  try { const r = db.run(sql, params); saveDb(); return r; }
  catch (e) { console.error('SQL:', sql, e.message); return null; }
}
function all(sql, params = []) {
  try { return db.exec(sql, params); } catch (e) { console.error('SQL:', sql, e.message); return []; }
}
function getOne(sql, params = []) {
  const res = all(sql, params);
  if (res.length > 0 && res[0].values.length > 0) {
    const obj = {};
    res[0].columns.forEach((c, i) => obj[c] = res[0].values[0][i]);
    return obj;
  }
  return null;
}
function getList(sql, params = []) {
  const res = all(sql, params);
  if (res.length === 0) return [];
  return res[0].values.map(row => {
    const obj = {};
    res[0].columns.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

// ===== 启动 =====
async function start() {
  const SQL = await initSqlJs();

  // 加载已有数据库或新建
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
    console.log('数据库已加载');
    // 兼容：旧表增加 images、views、accepted_bid_id 字段
    try { db.run("ALTER TABLE tasks ADD COLUMN images TEXT DEFAULT '[]'"); } catch(e) {}
    try { db.run("ALTER TABLE tasks ADD COLUMN views INTEGER DEFAULT 0"); } catch(e) {}
    try { db.run("ALTER TABLE tasks ADD COLUMN accepted_bid_id INTEGER DEFAULT 0"); } catch(e) {}
  } else {
    db = new SQL.Database();
    initSchema();
  }

  app.listen(PORT, () => console.log(`万能任务API已启动: http://localhost:${PORT}`));
}

function initSchema() {
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      avatar_emoji TEXT DEFAULT '😊',
      credit_score INTEGER DEFAULT 500,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      budget REAL NOT NULL,
      deposit REAL DEFAULT 0,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'ongoing',
      likes INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      images TEXT DEFAULT '[]',
      accepted_bid_id INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      quote REAL NOT NULL,
      message TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      last_msg TEXT DEFAULT '',
      last_time TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      tags TEXT DEFAULT '',
      content TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task_id INTEGER,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      reasons TEXT DEFAULT '',
      content TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE task_likes (
      user_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, task_id)
    );
  `);

  // 示例数据
  db.run(`INSERT INTO users (phone, nickname, avatar_emoji, credit_score) VALUES ('13800138001','小明','😎',750)`);
  db.run(`INSERT INTO users (phone, nickname, avatar_emoji, credit_score) VALUES ('13800138002','大王','🎮',800)`);
  db.run(`INSERT INTO users (phone, nickname, avatar_emoji, credit_score) VALUES ('13800138003','小红','🌸',720)`);
  db.run(`INSERT INTO users (phone, nickname, avatar_emoji, credit_score) VALUES ('13800138004','阿强','💪',680)`);
  db.run(`INSERT INTO users (phone, nickname, avatar_emoji, credit_score) VALUES ('13800138005','小李','🧋',690)`);

  db.run(`INSERT INTO tasks (user_id, title, description, budget, deposit, category, status, likes) VALUES (1,'求5月15日电影票2张','想买下午3点的票，3排5-6座，有的联系我',30,10,'ticket','ongoing',12)`);
  db.run(`INSERT INTO tasks (user_id, title, description, budget, deposit, category, status, likes) VALUES (2,'出售游戏金币1000个','王者荣耀金币，诚心出售，不议价',100,0,'game','ongoing',8)`);
  db.run(`INSERT INTO tasks (user_id, title, description, budget, deposit, category, status, likes) VALUES (3,'求XX餐厅5折券','明天去吃，想买2张优惠券，可加价',80,20,'ticket','ongoing',5)`);
  db.run(`INSERT INTO tasks (user_id, title, description, budget, deposit, category, status, likes) VALUES (4,'帮忙取快递','菜鸟驿站，送到3号楼，今天下班前',5,0,'life','ongoing',3)`);
  db.run(`INSERT INTO tasks (user_id, title, description, budget, deposit, category, status, likes) VALUES (5,'代买喜茶一杯','多冰少糖，送到公司A栋',15,0,'shopping','ongoing',6)`);
  db.run(`INSERT INTO tasks (user_id, title, description, budget, deposit, category, status, likes) VALUES (1,'求购二手自行车','学生党预算有限，成色不限，能骑就行',200,50,'other','ongoing',4)`);
  db.run(`INSERT INTO tasks (user_id, title, description, budget, deposit, category, status, likes) VALUES (3,'代送文件到市中心','加急文件，今天必须送到，靠谱的来',20,10,'errand','ongoing',2)`);
  db.run(`INSERT INTO tasks (user_id, title, description, budget, deposit, category, status, likes) VALUES (4,'帮忙遛狗1小时','金毛，很乖，小区内即可，爱狗人士优先',30,0,'life','ongoing',9)`);

  db.run(`INSERT INTO bids (task_id, user_id, quote, message, status) VALUES (1,2,28,'我有优惠渠道，可以帮你买','pending')`);
  db.run(`INSERT INTO bids (task_id, user_id, quote, message, status) VALUES (1,3,30,'我也能买，原价就行','pending')`);
  db.run(`INSERT INTO bids (task_id, user_id, quote, message, status) VALUES (3,2,75,'我手里有5折券','pending')`);
  db.run(`INSERT INTO bids (task_id, user_id, quote, message, status) VALUES (5,4,15,'正好路过喜茶','pending')`);
  db.run(`INSERT INTO bids (task_id, user_id, quote, message, status) VALUES (8,3,25,'超爱狗狗！','pending')`);
  db.run(`INSERT INTO bids (task_id, user_id, quote, message, status) VALUES (8,5,30,'住隔壁小区可以来','pending')`);

  db.run(`INSERT INTO chats (task_id, user1_id, user2_id, last_msg, last_time) VALUES (1,1,2,'好的，没问题','2026-05-11 10:30')`);
  db.run(`INSERT INTO chats (task_id, user1_id, user2_id, last_msg, last_time) VALUES (3,1,3,'线下碰面给你','2026-05-10 18:20')`);

  // 聊天1的消息
  db.run(`INSERT INTO messages (chat_id, sender_id, content, type, created_at) VALUES (1,2,'你好，我看到你发布的电影票任务','text','2026-05-11 10:20')`);
  db.run(`INSERT INTO messages (chat_id, sender_id, content, type, created_at) VALUES (1,1,'是的，我想买5月15日的','text','2026-05-11 10:21')`);
  db.run(`INSERT INTO messages (chat_id, sender_id, content, type, created_at) VALUES (1,2,'可以的，15元一张','text','2026-05-11 10:22')`);
  db.run(`INSERT INTO messages (chat_id, sender_id, content, type, created_at) VALUES (1,1,'好的，怎么交易？','text','2026-05-11 10:25')`);
  db.run(`INSERT INTO messages (chat_id, sender_id, content, type, created_at) VALUES (1,2,'先付10元押金就行','text','2026-05-11 10:28')`);
  db.run(`INSERT INTO messages (chat_id, sender_id, content, type, created_at) VALUES (1,1,'好的，没问题','text','2026-05-11 10:30')`);

  // 聊天2的消息
  db.run(`INSERT INTO messages (chat_id, sender_id, content, type, created_at) VALUES (2,3,'5折券有的，你需要几张？','text','2026-05-10 18:15')`);
  db.run(`INSERT INTO messages (chat_id, sender_id, content, type, created_at) VALUES (2,1,'2张，怎么交易？','text','2026-05-10 18:17')`);
  db.run(`INSERT INTO messages (chat_id, sender_id, content, type, created_at) VALUES (2,3,'线下碰面给你','text','2026-05-10 18:20')`);

  saveDb();
  console.log('示例数据已插入');
}

// ===== 工具 =====
const CAT_MAP = { '票券':'ticket', '游戏':'game', '生活':'life', '代购':'shopping', '跑腿':'errand', '其他':'other' };
const CAT_RMAP = Object.fromEntries(Object.entries(CAT_MAP).map(([k,v])=>[v,k]));

function uid(req) { return parseInt(req.headers['x-user-id']) || 1; }
function ok(data, message='success') { return { code:0, data, message }; }
function fail(message, code=-1) { return { code, data:null, message }; }

// ===== 认证 =====
app.post('/api/auth/send-code', (req, res) => res.json(ok(null, '验证码已发送')));

app.post('/api/auth/login', (req, res) => {
  const { phone, code } = req.body;
  if (!phone) return res.json(fail('请输入手机号'));
  if (code !== '123456') return res.json(fail('验证码错误'));
  let user = getOne('SELECT * FROM users WHERE phone = ?', [phone]);
  if (!user) {
    run('INSERT INTO users (phone, nickname, avatar_emoji, credit_score) VALUES (?,?,?,?)', [phone, '新用户'+phone.slice(-4), '😊', 500]);
    user = getOne('SELECT * FROM users WHERE phone = ?', [phone]);
  }
  res.json(ok({ token: 'tk_'+Date.now(), user }, '登录成功'));
});

// ===== 用户 =====
app.get('/api/user/profile', (req, res) => {
  const id = uid(req);
  const user = getOne('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) return res.json(fail('用户不存在'));
  user.task_count = getOne('SELECT COUNT(*) as c FROM tasks WHERE user_id = ?', [id]).c;
  user.bid_count = getOne('SELECT COUNT(*) as c FROM bids WHERE user_id = ? AND status = "accepted"', [id]).c;
  const r = getOne('SELECT AVG(score) as a FROM ratings WHERE to_user_id = ?', [id]);
  user.avg_rating = r ? (r.a || 0) : 0;
  res.json(ok(user));
});

app.put('/api/user/profile', (req, res) => {
  const id = uid(req);
  const { nickname, avatar_emoji } = req.body;
  run('UPDATE users SET nickname = COALESCE(?,nickname), avatar_emoji = COALESCE(?,avatar_emoji) WHERE id = ?', [nickname, avatar_emoji, id]);
  res.json(ok(getOne('SELECT * FROM users WHERE id = ?', [id]), '更新成功'));
});

// ===== 任务 =====
app.get('/api/tasks', (req, res) => {
  const { category, keyword, page=1, pageSize=20, status='ongoing', userId: qUid } = req.query;
  let sql = `SELECT t.*, u.nickname, u.avatar_emoji FROM tasks t JOIN users u ON t.user_id = u.id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  if (category && category !== 'all' && category !== '全部') {
    const ck = CAT_MAP[category] || category;
    sql += ' AND t.category = ?'; params.push(ck);
  }
  if (keyword) { sql += ' AND (t.title LIKE ? OR t.description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  if (qUid) { sql += ' AND t.user_id = ?'; params.push(qUid); }

  const totalResult = getOne(`SELECT COUNT(*) as c FROM tasks t JOIN users u ON t.user_id = u.id WHERE 1=1` +
    (status ? ' AND t.status = ?' : '') +
    (category && category !== 'all' && category !== '全部' ? ' AND t.category = ?' : '') +
    (keyword ? ' AND (t.title LIKE ? OR t.description LIKE ?)' : '') +
    (qUid ? ' AND t.user_id = ?' : ''), params);
  const total = totalResult ? totalResult.c : 0;

  sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page)-1)*parseInt(pageSize));

  const list = getList(sql, params).map(t => {
    const bidCount = getOne('SELECT COUNT(*) as c FROM bids WHERE task_id = ?', [t.id]);
    var imgs = [];
    try { imgs = JSON.parse(t.images || '[]'); } catch(e) { imgs = []; }
    return { ...t, catName: CAT_RMAP[t.category]||t.category, bids: bidCount?bidCount.c:0, images: imgs, views: t.views||0, acceptedBidId: t.accepted_bid_id||0 };
  });
  res.json(ok({ list, total, page:+page, pageSize:+pageSize }));
});

app.get('/api/user/bids', (req, res) => {
  const userId = uid(req);
  const bids = getList('SELECT b.*, t.title, t.budget, t.deposit, t.category, t.status as task_status, t.description, u.nickname, u.avatar_emoji FROM bids b JOIN tasks t ON b.task_id = t.id JOIN users u ON t.user_id = u.id WHERE b.user_id = ? ORDER BY b.created_at DESC', [userId]);
  const list = bids.map(b => ({ ...b, catName: CAT_RMAP[b.category]||b.category }));
  res.json(ok({ list }));
});

app.get('/api/tasks/:id', (req, res) => {
  const userId = uid(req);
  const task = getOne('SELECT t.*, u.nickname, u.avatar_emoji, u.credit_score FROM tasks t JOIN users u ON t.user_id = u.id WHERE t.id = ?', [req.params.id]);
  if (!task) return res.json(fail('任务不存在'));
  // 浏览量+1
  run('UPDATE tasks SET views = views + 1 WHERE id = ?', [req.params.id]);
  task.views = (task.views || 0) + 1;
  const bids = getList('SELECT b.*, u.nickname, u.avatar_emoji, u.credit_score FROM bids b JOIN users u ON b.user_id = u.id WHERE b.task_id = ? ORDER BY b.created_at', [req.params.id]);
  var images = [];
  try { images = JSON.parse(task.images || '[]'); } catch(e) { images = []; }
  // 当前用户的报价
  const myBid = bids.find(function(b) { return b.user_id === userId; });
  // 被接受的报价
  const acceptedBid = task.accepted_bid_id ? bids.find(function(b) { return b.id === task.accepted_bid_id; }) : bids.find(function(b) { return b.status === 'accepted'; });
  // 当前用户是被接受者？
  const isAcceptedWinner = acceptedBid && acceptedBid.user_id === userId;
  res.json(ok({
    ...task,
    catName: CAT_RMAP[task.category]||task.category,
    bids: bids,
    images: images,
    myBidId: myBid ? myBid.id : 0,
    acceptedBidId: acceptedBid ? acceptedBid.id : 0,
    isAcceptedWinner: isAcceptedWinner,
    canAcceptBid: task.user_id === userId && task.status === 'ongoing',
    canComplete: task.user_id === userId && task.status === 'assigned'
  }));
});

app.post('/api/tasks', (req, res) => {
  const id = uid(req);
  const { title, description='', category, images=[] } = req.body;
  if (!title) return res.json(fail('请输入标题'));
  const ck = CAT_MAP[category] || category || 'other';
  const imgs = JSON.stringify(Array.isArray(images) ? images : []);
  run('INSERT INTO tasks (user_id, title, description, budget, deposit, category, images) VALUES (?,?,?,?,?,?,?)', [id, title, description, 0, 0, ck, imgs]);
  const task = getOne('SELECT * FROM tasks WHERE id = (SELECT MAX(id) FROM tasks)');
  var imgs2 = [];
  try { imgs2 = JSON.parse(task.images || '[]'); } catch(e) { imgs2 = []; }
  res.json(ok({ ...task, catName: CAT_RMAP[task.category]||task.category, images: imgs2 }, '发布成功'));
});

app.post('/api/tasks/:id/bid', (req, res) => {
  const userId = uid(req);
  const tid = req.params.id;
  const task = getOne('SELECT * FROM tasks WHERE id = ?', [tid]);
  if (!task) return res.json(fail('任务不存在'));
  if (task.user_id === userId) return res.json(fail('不能接自己的任务'));
  if (task.status !== 'ongoing') return res.json(fail('该任务已不接受接单'));
  const { quote=0, message='' } = req.body;
  const existing = getOne('SELECT id FROM bids WHERE task_id = ? AND user_id = ?', [tid, userId]);
  if (existing) return res.json(fail('已提交过申请'));
  run('INSERT INTO bids (task_id, user_id, quote, message) VALUES (?,?,?,?)', [tid, userId, quote, message]);
  res.json(ok(null, '申请成功，等待发布者确认'));
});

app.get('/api/bids/:taskId', (req, res) => {
  const taskId = req.params.taskId;
  const bids = getList('SELECT b.*, u.nickname, u.avatar_emoji, u.credit_score FROM bids b JOIN users u ON b.user_id = u.id WHERE b.task_id = ? ORDER BY b.created_at', [taskId]);
  res.json(ok({ list: bids }));
});

app.post('/api/tasks/:id/accept/:bidId', (req, res) => {
  const userId = uid(req);
  const task = getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (!task || task.user_id !== userId) return res.json(fail('无权操作'));
  run('UPDATE bids SET status = "accepted" WHERE id = ?', [req.params.bidId]);
  run('UPDATE bids SET status = "rejected" WHERE task_id = ? AND id != ? AND status = "pending"', [req.params.id, req.params.bidId]);
  run('UPDATE tasks SET status = "assigned", accepted_bid_id = ? WHERE id = ?', [req.params.bidId, req.params.id]);
  res.json(ok(null, '已接受'));
});

app.post('/api/tasks/:id/complete', (req, res) => {
  const userId = uid(req);
  const task = getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (!task) return res.json(fail('任务不存在'));
  if (task.user_id !== userId) return res.json(fail('只有发布者能完成'));
  run('UPDATE tasks SET status = "completed" WHERE id = ?', [req.params.id]);
  if (task.deposit > 0) {
    run('INSERT INTO deposits (user_id, task_id, amount, type) VALUES (?,?,?,"in")', [userId, req.params.id, task.deposit]);
  }
  res.json(ok(null, '任务已完成'));
});

app.post('/api/tasks/:id/cancel', (req, res) => {
  const userId = uid(req);
  const task = getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  if (!task || task.user_id !== userId) return res.json(fail('无权取消'));
  run('UPDATE tasks SET status = "cancelled" WHERE id = ?', [req.params.id]);
  res.json(ok(null, '已取消'));
});

app.post('/api/tasks/:id/like', (req, res) => {
  const userId = uid(req);
  const tid = req.params.id;
  const existing = getOne('SELECT * FROM task_likes WHERE user_id = ? AND task_id = ?', [userId, tid]);
  if (existing) {
    run('DELETE FROM task_likes WHERE user_id = ? AND task_id = ?', [userId, tid]);
    run('UPDATE tasks SET likes = MAX(0, likes - 1) WHERE id = ?', [tid]);
    res.json(ok({ liked: false }));
  } else {
    run('INSERT OR IGNORE INTO task_likes (user_id, task_id) VALUES (?,?)', [userId, tid]);
    run('UPDATE tasks SET likes = likes + 1 WHERE id = ?', [tid]);
    res.json(ok({ liked: true }));
  }
});

// ===== 聊天 =====
app.get('/api/chats', (req, res) => {
  const userId = uid(req);
  const chats = getList('SELECT c.*, u1.nickname as name1, u1.avatar_emoji as emoji1, u2.nickname as name2, u2.avatar_emoji as emoji2 FROM chats c JOIN users u1 ON c.user1_id = u1.id JOIN users u2 ON c.user2_id = u2.id WHERE c.user1_id = ? OR c.user2_id = ? ORDER BY c.last_time DESC', [userId, userId]);
  const list = chats.map(c => {
    const isU1 = c.user1_id === userId;
    const peer = isU1 ? { id: c.user2_id, nickname: c.name2, avatar_emoji: c.emoji2 } : { id: c.user1_id, nickname: c.name1, avatar_emoji: c.emoji1 };
    // 简化未读计算
    const lastOwn = getOne('SELECT MAX(id) as mid FROM messages WHERE chat_id = ? AND sender_id = ?', [c.id, userId]);
    const unreadResult = getOne('SELECT COUNT(*) as c FROM messages WHERE chat_id = ? AND sender_id != ? AND id > ?', [c.id, userId, (lastOwn&&lastOwn.mid)?lastOwn.mid:0]);
    return { id: c.id, peer, lastMsg: c.last_msg, lastTime: c.last_time, unread: unreadResult?unreadResult.c:0, taskId: c.task_id };
  });
  res.json(ok({ list }));
});

app.post('/api/chats', (req, res) => {
  const userId = uid(req);
  const { peer_id, task_id } = req.body;
  if (!peer_id) return res.json(fail('缺少对方ID'));
  const minId = Math.min(userId, peer_id);
  const maxId = Math.max(userId, peer_id);
  let chat = getOne('SELECT * FROM chats WHERE user1_id = ? AND user2_id = ?', [minId, maxId]);
  if (!chat) {
    run('INSERT INTO chats (task_id, user1_id, user2_id) VALUES (?,?,?)', [task_id||null, minId, maxId]);
    chat = getOne('SELECT * FROM chats WHERE user1_id = ? AND user2_id = ?', [minId, maxId]);
  }
  res.json(ok(chat));
});

app.get('/api/chats/:id/messages', (req, res) => {
  const { before, limit=50 } = req.query;
  let sql = 'SELECT m.*, u.nickname, u.avatar_emoji FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.chat_id = ?';
  const params = [req.params.id];
  if (before) { sql += ' AND m.id < ?'; params.push(before); }
  sql += ' ORDER BY m.id DESC LIMIT ?';
  params.push(parseInt(limit));
  const list = getList(sql, params).reverse();
  res.json(ok({ list }));
});

app.post('/api/chats/:id/messages', (req, res) => {
  const userId = uid(req);
  const { content, type='text', duration=0 } = req.body;
  if (!content) return res.json(fail('消息不能为空'));
  run('INSERT INTO messages (chat_id, sender_id, content, type) VALUES (?,?,?,?)', [req.params.id, userId, content, type]);
  const lastMsg = type === 'image' ? '[图片]' : type === 'voice' ? '[语音 ' + duration + '"\']' : content.slice(0,50);
  run('UPDATE chats SET last_msg = ?, last_time = datetime("now","localtime") WHERE id = ?', [lastMsg, req.params.id]);
  const msg = getOne('SELECT m.*, u.nickname, u.avatar_emoji FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = (SELECT MAX(id) FROM messages WHERE chat_id = ?)', [req.params.id]);
  if (msg && type === 'voice') msg.duration = duration;
  res.json(ok(msg, '发送成功'));
});

// ===== 押金 =====
app.get('/api/deposit/records', (req, res) => {
  const userId = uid(req);
  const records = getList('SELECT * FROM deposits WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  const balance = records.reduce((s, r) => s + (r.type==='in'?r.amount:-r.amount), 0);
  res.json(ok({ balance, records }));
});

app.post('/api/deposit/pay', (req, res) => {
  const userId = uid(req);
  const { amount, task_id } = req.body;
  run('INSERT INTO deposits (user_id, task_id, amount, type) VALUES (?,?,?,"out")', [userId, task_id, amount]);
  res.json(ok(null, '押金已缴纳'));
});

app.post('/api/deposit/refund', (req, res) => {
  const userId = uid(req);
  const { task_id, amount } = req.body;
  run('INSERT INTO deposits (user_id, task_id, amount, type) VALUES (?,?,?,"in")', [userId, task_id, amount]);
  res.json(ok(null, '押金已退还'));
});

// ===== 评价 =====
app.post('/api/ratings', (req, res) => {
  const userId = uid(req);
  const { task_id, to_user_id, score, tags='', content='' } = req.body;
  if (!score || score<1 || score>5) return res.json(fail('评分1-5'));
  run('INSERT INTO ratings (task_id, from_user_id, to_user_id, score, tags, content) VALUES (?,?,?,?,?,?)', [task_id, userId, to_user_id, score, typeof tags==='string'?tags:JSON.stringify(tags), content]);
  // 更新信用分
  const avgR = getOne('SELECT AVG(score) as a FROM ratings WHERE to_user_id = ?', [to_user_id]);
  if (avgR && avgR.a) {
    const newScore = Math.min(950, Math.max(350, Math.round(avgR.a * 100 + 300)));
    run('UPDATE users SET credit_score = ? WHERE id = ?', [newScore, to_user_id]);
  }
  res.json(ok(null, '评价成功'));
});

app.get('/api/ratings/:userId', (req, res) => {
  const list = getList('SELECT r.*, u.nickname as from_nickname, u.avatar_emoji as from_emoji FROM ratings r JOIN users u ON r.from_user_id = u.id WHERE r.to_user_id = ? ORDER BY r.created_at DESC LIMIT 20', [req.params.userId]);
  const avgR = getOne('SELECT AVG(score) as a, COUNT(*) as c FROM ratings WHERE to_user_id = ?', [req.params.userId]);
  res.json(ok({ list, avgScore: avgR ? (Math.round((avgR.a||0)*10)/10) : 0, total: avgR?avgR.c:0 }));
});

// ===== 举报 =====
app.post('/api/reports', (req, res) => {
  const userId = uid(req);
  const { target_id, target_type, reasons='', content='' } = req.body;
  run('INSERT INTO reports (reporter_id, target_id, target_type, reasons, content) VALUES (?,?,?,?,?)', [userId, target_id, target_type, typeof reasons==='string'?reasons:JSON.stringify(reasons), content]);
  res.json(ok(null, '举报成功，我们会尽快处理'));
});

// ===== 数据分析 =====
app.get('/api/stats/home', (req, res) => {
  const today = new Date().toISOString().slice(0,10);
  const todayCount = getOne("SELECT COUNT(*) as c FROM tasks WHERE date(created_at) = date('now','localtime')");
  const catCounts = getList('SELECT category, COUNT(*) as c FROM tasks WHERE status=\'ongoing\' GROUP BY category ORDER BY c DESC');
  const hotCat = catCounts.length ? (CAT_RMAP[catCounts[0].category] || catCounts[0].category) : '-';
  const activeUsers = getOne('SELECT COUNT(DISTINCT user_id) as c FROM tasks WHERE date(created_at) >= date("now","localtime","-7 days")');
  res.json(ok({ today: todayCount ? todayCount.c : 0, hotCat, activeUsers: activeUsers ? activeUsers.c : 0 }));
});

app.get('/api/stats/detail', (req, res) => {
  const totalTasks = getOne('SELECT COUNT(*) as c FROM tasks');
  const ongoing = getOne('SELECT COUNT(*) as c FROM tasks WHERE status="ongoing"');
  const completed = getOne('SELECT COUNT(*) as c FROM tasks WHERE status="completed"');
  const catCounts = getList('SELECT category, COUNT(*) as c FROM tasks GROUP BY category ORDER BY c DESC');
  const maxCat = catCounts.length ? catCounts[0].c : 1;
  const catStats = catCounts.map(function(c) { return { name: CAT_RMAP[c.category]||c.category, count: c.c, pct: Math.round(c.c / maxCat * 100) }; });
  const topUsers = getList('SELECT u.id, u.nickname, u.avatar_emoji, COUNT(t.id) as task_count FROM users u LEFT JOIN tasks t ON u.id = t.user_id GROUP BY u.id ORDER BY task_count DESC LIMIT 5');
  res.json(ok({ totalTasks: totalTasks ? totalTasks.c : 0, ongoing: ongoing ? ongoing.c : 0, completed: completed ? completed.c : 0, catStats, topUsers }));
});

// 启动
start().catch(e => { console.error('启动失败:', e); process.exit(1); });
