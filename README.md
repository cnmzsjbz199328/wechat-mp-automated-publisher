# WeChat MP Automated Publisher (微信公众号自动化发布系统)

基于 Cloudflare Workers 的全自动微信公众号图文素材发布系统。系统能够自动抓取多个权威领域的资讯（金融、航天、技术、移民），利用 AI 进行内容摘要、翻译和“英语词汇学习”增强，并一键发布至微信公众号草稿箱。

## 🌟 核心功能

- **多领域资讯抓取**：
  - **FINANCE**: 抓取 MarketWatch 全球金融快讯。
  - **NASA**: 抓取 NASA 官方航天科研简报。
  - **ARS**: 抓取 Ars Technica 深度技术洞察。
  - **IMMIGRATION**: 抓取澳洲官方移民动态（通过 Grok AI 实时检索）。
- **AI 智能增强**：
  - **内容摘要**：自动提取长文的核心要点。
  - **中英双语**：自动翻译标题与摘要。
  - **词汇助手**：AI 自动从新闻中提取 5 个高阶词汇，提供中文释义及例句，提升阅读价值。
- **微信一键集成**：
  - 自动管理微信 Access Token。
  - 自动上传图片至微信 CDN，并作为封面或内容插图。
  - 自动创建图文草稿。
- **定时自动化**：
  - 支持 Cron 定时任务，实现每日固定时间点自动发布不同领域内容。
- **可视化预览**：
  - 提供 HTML 预览接口，在发布前即可查看最终显示效果。

## 🛠️ 技术栈

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) (Edge Runtime)
- **AI Engine**: [Cloudflare AI](https://developers.cloudflare.com/workers-ai/) (@cf/meta/llama-3-8b-instruct) & [xAI Grok](https://x.ai/api)
- **Language**: TypeScript 5.x
- **Infrastructure**: Wrangler 3.x
- **Framework**: 原生无框架轻量化设计，严格遵守单一职责原则。

## 📂 项目结构

```
src/
├── index.ts            # 入口：路由分发与 Cron 定时任务编排
├── config/
│   └── constants.ts    # 配置：API 终点、样式常量与 RSS 源
├── services/
│   ├── ai.ts           # Cloudflare AI：词汇提取与摘要
│   ├── translation.ts  # 翻译服务
│   ├── wechat.ts       # 微信 API：Token 管理、媒体上传、草稿创建
│   └── news/           # 新闻源实现（策略模式）
│       ├── finance.ts  # 金融 RSS
│       ├── nasa.ts     # NASA RSS
│       ├── ars.ts      # 技术 RSS
│       └── grok.ts     # Grok AI 搜索（移民动态）
├── templates/
│   ├── article.ts      # 微信图文 HTML 模板
│   └── preview.ts      # 浏览器预览 Shell
└── types/
    └── index.ts        # 全局类型定义
```

## 🚀 快速开始

### 1. 环境变量配置

在 `.dev.vars` (本地开发) 或 Cloudflare Dashboard (生产环境) 中配置以下变量：

| 变量名 | 说明 |
| :--- | :--- |
| `APPID` | 微信公众号 AppID |
| `APPSECRET` | 微信公众号 AppSecret |
| `XAI_API_KEY` | xAI (Grok) API Key (用于 IMMIGRATION 领域) |
| `AI` | Cloudflare AI Binding |

### 2. 路由接口

| 路径 | 说明 |
| :--- | :--- |
| `/{DOMAIN}-preview-html` | 浏览器预览最终 HTML 效果 (例如 `/NASA-preview-html`) |
| `/{DOMAIN}-preview` | 返回处理后的 JSON 数据预览 |
| `/{DOMAIN}-live` | **触发发布**：执行抓取、AI 处理并发布至微信草稿箱 |

*支持的 `{DOMAIN}`: `FINANCE`, `NASA`, `ARS`, `IMMIGRATION`*

### 3. 本地开发

```bash
# 安装依赖
npm install

# 启动本地开发服务
npx wrangler dev
```

### 4. 部署

```bash
npx wrangler deploy
```

## 📅 定时发布计划 (Cron)

系统默认配置了以下发布时间（UTC/服务器时间）：

- **21:30**: 金融动态 (FINANCE)
- **21:45**: 航天前沿 (NASA)
- **22:00**: 技术洞察 (ARS)
- **22:15**: 移民快讯 (IMMIGRATION)

## ⚖️ 开发规范

项目遵循 `gemini.md` 中定义的编码规范：
- **单文件上限**：单个文件不得超过 200 行。
- **高内聚**：每个模块仅负责单一业务逻辑。
- **低耦合**：服务层之间禁止直接相互引用，由 `index.ts` 进行编排。

---
*Created with ❤️ by Gemini CLI*
