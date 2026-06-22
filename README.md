# PromptCraft - AI 提示词工场

一个安全的 AI 提示词共享平台，让用户可以分享、发现、收藏优质的 AI 提示词。

## 功能特性

- 用户登录/登出
- 提示词发布、搜索、分类筛选
- 提示词详情查看、一键复制、点赞
- 数据脱敏（邮箱/手机号）
- 完整的安全防护（XSS、SQL注入、越权、防爆破）

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动后端服务器
```bash
node server/server.js
```
后端将运行在 http://localhost:3000

### 3. 启动前端开发服务器
```bash
npm run dev
```
前端将运行在 http://localhost:5173

### 4. 访问应用
打开浏览器访问 http://localhost:5173

测试账号：
- admin / 123456
- user1 / 123456

## 生产打包
```bash
npm run build
```
打包后的文件将生成在 `dist` 目录。

## 安全措施

详见 [REPORT.md](./REPORT.md)

## 项目结构

```
prompt-craft/
├── .env                    # 环境变量配置
├── server/
│   └── server.js          # 后端服务器
├── src/
│   ├── App.vue            # 主应用组件
│   ├── main.js            # 入口文件
│   └── composables/
│       ├── useAuth.js     # 认证逻辑
│       └── usePrompts.js  # 提示词数据逻辑
├── REPORT.md              # 安全审计报告
└── README.md
```
