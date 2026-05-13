# 万能任务 App 开发文档

## 开发环境

### 1. 前端开发

```bash
# 1. 下载 HBuilderX
https://www.dcloud.io/hbuilderx.html

# 2. 导入项目
打开 HBuilderX → 文件 → 导入 → 选择 app-demo 文件夹

# 3. 运行
运行 → 运行到浏览器 / 微信开发者工具
```

### 2. 后端开发

```bash
# 1. 安装 Node.js
https://nodejs.org/

# 2. 安装 MongoDB
https://www.mongodb.com/try/download/community

# 3. 启动后端
cd server
npm install
node api.js
```

### 3. 配置

修改 `pages/utils/api.js` 中的 API 地址：
```javascript
const API_BASE = 'http://你的服务器IP:3000/api';
```

## 上线部署

### 1. 前端部署（微信小程序）

1. 打开 https://mp.weixin.qq.com/
2. 注册小程序账号
3. 获取 AppID
4. 修改 `manifest.json` 中的 AppID
5. HBuilderX → 发行 → 微信小程序
6. 上传代码到微信公众平台

### 2. 后端部署

```bash
# 1. 购买云服务器
阿里云 / 腾讯云

# 2. 安装环境
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
nvm install mongodb

# 3. 上传代码
scp -r server user@your-server:/home/

# 4. 启动服务
cd /home/server
npm install
pm2 start api.js
```

### 3. 数据库

```bash
# MongoDB 配置
# 1. 创建数据库
use wanneng

# 2. 创建用户
db.createUser({
  user: "admin",
  pwd: "your-password",
  roles: [{ role: "readWrite", db: "wanneng" }]
})
```

## 常见问题

### Q: 运行报错？
A: 检查控制台错误信息，确保 MongoDB 已启动

### Q: 无法连接后端？
A: 检查服务器防火墙，开放 3000 端口

### Q: 微信登录失败？
A: 在微信公众平台配置服务器域名

## 后续功能

- [ ] 支付功能（微信支付）
- [ ] 押金托管
- [ ] 消息推送
- [ ] 实名认证
- [ ] 会员体系
- [ ] 评价系统
- [ ] 举报功能
- [ ] 客服功能