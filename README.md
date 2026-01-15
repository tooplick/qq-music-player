# QQ Music Web Player - Serverless Edition

QQ 音乐 Web 播放器的现代重构版本，专为 **Cloudflare Pages** 打造的纯前端 + Serverless 架构。

## 功能特性

- ✅ **纯前端架构**：静态资源托管在 Cloudflare Pages
- ✅ **Serverless 后端**：使用 Cloudflare Functions 处理 API 代理和请求签名
- ✅ **D1 凭证存储**：凭证存储在 Cloudflare D1 数据库
- ✅ **自动化凭证同步**：一键从外部 API 同步并更新凭证
- ✅ **智能预加载**：自动预取下一首歌曲歌词，零延迟切换
- ✅ **隐私安全**：通过 Cloudflare 代理请求，隐藏真实 IP
- ✅ **PWA 支持**：Service Worker 离线缓存

## 部署 (Cloudflare Pages)

### 1. Fork 本仓库

将本项目 Fork 到你的 GitHub 账号。

### 2. 创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **D1** → **Create database**
3. 命名为 `qqmusic-credentials`
4. 记下 **Database ID**

### 3. 创建 Pages 项目

1. 进入 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选择 Fork 的仓库
3. 构建设置保持默认（无需构建命令）

### 4. 绑定 D1 数据库

1. 进入 Pages 项目 → **Settings** → **Functions** → **D1 database bindings**
2. 添加绑定：
   - Variable name: `DB`
   - D1 database: 选择 `qqmusic-credentials`

### 5. 配置外部 API (Cloudflare Pages)

如果使用 Git 自动构建部署，请务必在后台手动配置环境变量：

1. 进入 **Settings** → **Environment variables**
2. 添加变量：
   - Variable name: `EXTERNAL_API_URL`
   - Value: `https://api.ygking.top` (或你自己的 API 服务地址)

### 6. 部署

保存设置后触发重新部署。

## 凭证管理

项目不再使用环境变量存储初始凭证，而是提供了可视化的管理页面。

1. 访问 `/admin` (例如 `https://your-project.pages.dev/admin`)
2. 页面会自动尝试从配置的 `EXTERNAL_API_URL` 获取凭证并存入数据库
3. 如果成功，播放器即可正常使用

## 本地开发

```bash
# 安装依赖
npm install -g wrangler

# 创建本地 D1 数据库
wrangler d1 create qqmusic-credentials --local
wrangler d1 execute qqmusic-credentials --local --file=./schema.sql # 如果有 sql 文件

# 启动开发服务器
wrangler pages dev .
```

访问 `http://localhost:8788`

## 项目结构

```
.
├── functions/              # Cloudflare Functions
│   ├── admin.js            # 凭证管理页面
│   └── api/
│       ├── index.js        # API 代理
│       ├── credential.js   # 凭证读取 API
│       ├── refresh.js      # 凭证自动刷新
│       └── lyric_proxy.js  # 歌词代理
├── js/
│   ├── api/                # 前端 API 封装
│   └── app.js              # 核心业务逻辑
├── wrangler.toml           # Wrangler 配置
├── index.html              # 应用入口
└── sw.js                   # Service Worker
```

## 免责声明

本项目仅供学习研究使用，请支持正版音乐。
