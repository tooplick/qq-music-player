# QQ Music Web Player - Serverless Edition

QQ 音乐 Web 播放器的现代重构版本，专为 **Cloudflare Pages** 打造的纯前端 + Serverless 架构。

## 功能特性

- ✅ **纯前端架构**：静态资源托管在 Cloudflare Pages。
- ✅ **Serverless 后端**：使用 Cloudflare Functions (`/functions`) 处理 API 代理和请求签名。
- ✅ **隐私安全**：通过 Cloudflare 代理请求，隐藏真实 IP，支持 `no-referrer` 绕过防盗链。
- ✅ **PWA 支持**：Service Worker 离线缓存。

## 部署 (Cloudflare Pages)

本项目已针对 Cloudflare Pages 优化，开箱即用。

### 1. Fork 本仓库
将本项目 Fork 到你的 GitHub 账号。

### 2. 在 Cloudflare 面板创建项目
1. 登录 Cloudflare Dashboard。
2. 进入 **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**。
3. 选择刚才 Fork 的仓库。

### 3. 配置构建设置
- **Framework preset**: `None`
- **Build command**: `(空)` (不需要构建命令)
- **Output directory**: `.` (根目录)

### 4. 环境变量
目前不需要额外的环境变量。API 代理和加解密逻辑都已内置。

### 5. 部署
点击 **Save and Deploy**。稍等片刻，你的播放器就上线了！

## 本地开发

虽然这是一个 Serverless 项目，但你可以使用 `wrangler` 在本地完美模拟。

### 前置要求
- Node.js (推荐 v18+)
- Wrangler CLI (`npm install -g wrangler`)

### 启动开发服务器
```bash
npm install
wrangler pages dev .
```
这将在本地启动一个开发服务器（通常是 `http://localhost:8788`），同时模拟 Cloudflare Functions。

## 项目结构

```
.
├── functions/              # Cloudflare Functions (后端逻辑)
│   ├── api/
│   │   ├── index.js        # 通用 API 代理
│   │   └── lyric_proxy.js  # 歌词请求代理
│   └── tripledes.js        # (已弃用) 旧版后端解密逻辑，现已移至前端
├── js/
│   ├── api/                # 前端 API 封装
│   ├── utils/
│   │   └── tripledes.js    # 核心解密逻辑 (TripleDES + Zlib)
│   └── app.js              # 主应用逻辑
├── index.html              # 主入口
└── worker.js               # Service Worker
```

### CORS 处理
所有对 `u.y.qq.com` 和 `c.y.qq.com` 的请求都通过 `/functions/api/index.js` 转发，自动处理 CORS 头和 Cookie 转发。

## 免责声明

本项目仅供学习研究使用，请支持正版音乐。
