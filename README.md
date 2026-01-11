# QQ Music Web - 纯前端播放器

纯前端实现的 QQ 音乐播放器，可静态托管。

## 功能特性

- ✅ 歌曲搜索
- ✅ 在线播放（FLAC/320K/128K）
- ✅ 同步歌词显示
- ✅ 播放列表管理
- ✅ 多种播放模式（顺序/单曲循环/随机）
- ✅ Service Worker 离线缓存

## 技术栈

- **纯前端**: HTML + CSS + JavaScript ES6 Modules
- **无需后端**: 直接调用 QQ 音乐 API
- **静态托管**: 可部署到任何静态托管服务

## 本地运行

### 方法 1: Python 环境（推荐）

需同时运行 HTTP 服务器和 CORS 代理：

```bash
# 终端 1: 启动前端服务器
python -m http.server 8080

# 终端 2: 启动 API 代理
python cors_proxy.py
```

访问 `http://localhost:8080`

### 凭证管理

访问 `http://localhost:8080/admin.html` 可以管理 QQ 音乐 API 凭证。凭证过期时应用会自动尝试刷新，也可以在此手动刷新。

## 部署

可部署到以下平台：

- GitHub Pages
- Vercel
- Netlify

**注意**: 生产环境部署需要配置真正的 CORS 代理（如 Nginx 反代或使用 Cloudflare Workers），并在 `js/api/request.js` 中更新 `encEndpoint`。
目前的 `cors_proxy.py` 仅供本地开发测试使用。

## 注意事项

### CORS 问题

QQ 音乐 API (`u.y.qq.com`) 可能存在 CORS 限制。如果遇到跨域问题：

1. **浏览器扩展**: 使用 CORS Unblock 等浏览器扩展（仅开发用）
2. **CORS 代理**: 使用公共 CORS 代理服务（不推荐生产环境）
3. **自建代理**: 部署简单的 CORS 代理服务器

### 凭证更新

凭证默认保存在 `localStorage`。如需更新凭证，编辑 `js/api/credential.js` 中的 `DEFAULT_CREDENTIAL`。

## 项目结构

```
frontend/
├── index.html              # 主页
├── css/
│   └── style.css           # 样式
├── js/
│   ├── api/                # API 模块
│   │   ├── sign.js         # 签名算法
│   │   ├── credential.js   # 凭证管理
│   │   ├── request.js      # 请求封装
│   │   ├── search.js       # 搜索 API
│   │   ├── song.js         # 歌曲 URL API
│   │   ├── lyric.js        # 歌词 API
│   │   ├── login.js        # 凭证刷新
│   │   └── index.js        # API 入口
│   └── app.js              # 主应用
├── images/
│   └── favicon.png
└── sw.js                   # Service Worker
```

## 许可证

继承自原项目 GPL-3.0

## 免责声明

本项目仅供学习研究使用，请支持正版音乐。
