# 项目编码规范与最佳实践

> 本文档为 **wechat-mp-automated-publisher** 项目的 AI 辅助开发指南。
> 所有 AI 生成的代码，以及人工编写的代码，均须严格遵守以下规范。

---

## 技术栈概览

| 类别 | 技术 |
|------|------|
| 运行时 | Cloudflare Workers (Edge Runtime) |
| 语言 | TypeScript 5.x（严格模式） |
| AI 绑定 | Cloudflare AI (`@cf/meta/llama-3-8b-instruct`) |
| 部署工具 | Wrangler 4.x |
| 发布目标 | 微信公众号图文素材 API |

---

## 核心原则

### 1. 单文件行数硬性上限：200 行

**这是最高优先级的结构约束，没有任何例外。**

- 每个 `.ts` 文件的代码行数（含注释、空行）**不得超过 200 行**。
- 当一个文件接近 150 行时，应立即审视是否需要拆分。
- 超出 200 行的文件视为**架构违规**，必须在合并前重构。

**✅ 正确做法：**
```
src/services/wechat.ts          (69 行)   ✅
src/services/ai.ts              (25 行)   ✅
src/services/news.ts            (27 行)   ✅
src/templates/article.ts        (24 行)   ✅
src/config/constants.ts         (19 行)   ✅
src/types/index.ts              (33 行)   ✅
src/index.ts                    (52 行)   ✅
```

**❌ 错误做法：**
```
src/handler.ts   (350 行，包含认证、新闻抓取、AI调用、模板渲染) ❌
```

---

### 2. 高内聚（High Cohesion）

**每个模块只做一件事，并把这件事做好。**

#### 目录职责划分

```
src/
├── index.ts            # 入口：仅负责路由分发与服务编排（Orchestration）
├── config/
│   └── constants.ts    # 纯配置：API URL、样式常量。禁止含任何逻辑
├── types/
│   └── index.ts        # 纯类型：TypeScript 接口与类型定义。无运行时代码
├── services/
│   ├── wechat.ts       # WeChat API 交互：Token、媒体上传、草稿创建
│   ├── news.ts         # 新闻数据源：抓取与解析 RSS Feed
│   └── ai.ts           # AI 处理：调用 Cloudflare AI 模型
└── templates/
    └── article.ts      # HTML 模板：将数据渲染为微信图文 HTML
```

#### 内聚性检查清单

在新增或修改代码前，问自己：

- [ ] 这个函数/类是否只有**一个**明确的变化原因？（单一职责原则）
- [ ] 这个文件中的所有代码，是否都紧密围绕**同一个业务概念**？
- [ ] 是否有无关逻辑"顺手"写进来了？

**示例：`WeChatService` 的高内聚实践**
```typescript
// ✅ 正确：WeChatService 只封装 WeChat API 调用
class WeChatService {
  getAccessToken(): Promise<string> { ... }   // 属于 WeChat 认证
  uploadThumb(token: string): Promise<string> { ... }  // 属于 WeChat 媒体
  createDraft(...): Promise<WeChatDraftResponse> { ... } // 属于 WeChat 内容

  // ❌ 错误：不应将以下逻辑放入 WeChatService
  // fetchNews(): Promise<NewsItem[]> { ... }  // 这是 NewsService 的职责
  // processWithAI(...): Promise<string> { ... } // 这是 AIService 的职责
}
```

---

### 3. 低耦合（Low Coupling）

**模块之间通过明确的接口通信，不直接依赖对方的内部实现。**

#### 依赖方向规则

```
index.ts (编排层)
    ↓ 依赖
services/ (业务服务层)
    ↓ 依赖
config/ & types/ (基础设施层)
```

- **上层可以依赖下层，下层绝对不能依赖上层。**
- `services/` 之间**禁止相互 import**。服务间数据传递由 `index.ts` 负责。
- `types/index.ts` 是唯一的全局共享层，任何层级均可引用。

**✅ 正确的依赖关系（当前项目）：**
```typescript
// index.ts 负责编排，各服务之间互相隔离
const news = await newsService.fetchYahooFinanceNews();   // news.ts 的职责
const aiSummary = await aiService.processWithAI(news);   // ai.ts 的职责
const html = generateArticleHtml(aiSummary, news);       // templates/article.ts 的职责
```

**❌ 错误的耦合：**
```typescript
// services/ai.ts 直接调用 NewsService —— 这制造了服务间耦合！
class AIService {
  async run() {
    const news = new NewsService().fetchYahooFinanceNews(); // ❌ 跨服务调用
  }
}
```

#### 环境依赖注入

所有需要访问 Cloudflare 环境变量（`Env`）的服务，**必须通过构造函数注入**，禁止使用全局变量。

```typescript
// ✅ 正确：通过构造函数注入环境
export class WeChatService {
  constructor(private env: Env) {}
}

// ❌ 错误：依赖全局 env 对象
// let globalEnv: Env; // 禁止
```

---

## 文件拆分策略

当一个文件因功能增长面临超过 200 行的风险时，按以下策略拆分：

### 按业务子域拆分 Service

```
# 当 wechat.ts 功能增多时，拆分为：
src/services/wechat/
├── index.ts          # 统一导出（re-export）
├── auth.ts           # Token 管理
├── media.ts          # 媒体上传
└── draft.ts          # 草稿管理
```

### 按数据源拆分

```
# 当 news.ts 需要多个数据源时：
src/services/news/
├── index.ts          # 聚合入口
├── yahoo-finance.ts  # Yahoo Finance RSS
└── bloomberg.ts      # Bloomberg Feed（未来扩展）
```

### 按模板类型拆分

```
# 当 article.ts 需要多种模板时：
src/templates/
├── article.ts        # 图文文章模板
├── daily-brief.ts    # 日报摘要模板
└── styles.ts         # 共享样式常量（从 constants.ts 分离）
```

---

## TypeScript 规范

### 类型定义

- **禁止使用 `any`**，除非对接无类型的第三方 API（如 Cloudflare AI binding，应加注释说明原因）。
- 所有 API 响应必须定义对应的 `interface`，统一放入 `src/types/`。
- 接口名称以业务含义命名，不加 `I` 前缀。

```typescript
// ✅ 正确
interface WeChatTokenResponse {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
}

// ❌ 错误
interface IWeChatTokenResponse { ... }  // 不加 I 前缀
const data: any = await res.json();    // 禁止 any
```

### 错误处理

- 所有外部 API 调用必须检查业务错误码（如微信 `errcode`）。
- 使用 `throw new Error(message)` 向上冒泡，由编排层（`index.ts`）统一捕获。
- 错误信息必须包含上下文，方便排查。

```typescript
// ✅ 正确
if (data.errcode) {
  throw new Error(`Failed to get access token: ${data.errmsg}`);
}

// ❌ 错误
if (data.errcode) {
  console.log('error'); // 不抛出错误，调用方无法感知
}
```

---

## 常量与配置管理

- 所有 URL、Magic String、样式字符串必须定义在 `src/config/constants.ts`，**禁止硬编码在业务逻辑文件中**。
- 常量使用 `SCREAMING_SNAKE_CASE` 命名。
- `constants.ts` 本身禁止包含任何函数或类。

```typescript
// ✅ 正确：统一在 constants.ts 定义
export const API_URLS = {
  WECHAT_TOKEN: 'https://api.weixin.qq.com/cgi-bin/token',
};

// ❌ 错误：在 Service 文件中硬编码 URL
const url = 'https://api.weixin.qq.com/cgi-bin/token'; // 禁止
```

---

## 新功能开发检查清单

在提交任何新代码或 AI 生成代码之前，必须逐项确认：

- [ ] **行数检查**：涉及的每个文件 ≤ 200 行
- [ ] **单一职责**：新增的函数/类只做一件事
- [ ] **正确分层**：代码放在了正确的目录（`types/` / `config/` / `services/` / `templates/`）
- [ ] **无跨服务直接调用**：`services/` 下的文件互不 import
- [ ] **类型安全**：无新增的 `any`（特殊情况需注释说明）
- [ ] **错误处理**：所有外部调用有错误检查并正确抛出
- [ ] **无硬编码魔法值**：URL、Key、样式字符串已提取到 `constants.ts`
- [ ] **环境变量通过注入传递**：无全局 `env` 引用

---

## 项目当前架构图

```
Request (HTTP GET /finance-live)
        │
        ▼
   src/index.ts  ──── 编排层（Orchestrator）
   ┌────┴────────────────────────────────────┐
   │                                         │
   ▼                 ▼                 ▼     ▼
NewsService      AIService       WeChatService  generateArticleHtml
(news.ts)        (ai.ts)         (wechat.ts)    (templates/article.ts)
   │                │                  │              │
   ▼                ▼                  ▼              ▼
Yahoo RSS     CF AI Binding       WeChat API    STYLES (constants.ts)
                                                  
   └──────────────── 共享基础设施 ────────────────┘
                  types/index.ts
                  config/constants.ts
```

---

*本文档由 AI 辅助生成，基于项目实际代码结构提炼。如项目架构发生重大变更，请同步更新此文档。*
