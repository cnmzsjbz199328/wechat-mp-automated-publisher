# WeChat MP Automated Publisher API Documentation (接口文档)

本文档列出了系统所有支持的 API 端点，供手动触发及前端集成使用。

## 📍 基础路径 (Base URL)

部署运行在 Cloudflare Workers 后，可通过以下基础路径外加对应端点访问：
`https://[your-worker-name].[your-username].workers.dev`

---

## 🛠️ 端点概览

系统使用基于路径的领域（Domain）路由分发，每个 Domain 支持三类基础操作。

### 📌 1. JSON 预览视图
点击或发起 `GET` 请求，返回经过 AI 翻译、摘要及词汇提取后的完整结构化数据（不进行微信发布）。

| 方法 | 端点路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/{DOMAIN}-preview` | 返回结构化资讯 JSON, 包含翻译与词表 |

**示例请求**: `/NASA-preview`

---

### 🎨 2. HTML 视觉预览视图
在浏览器中渲染最终拼接后的微信图文模板框架，完全所见即所得。

| 方法 | 端点路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/{DOMAIN}-preview-html` | 渲染最终微信文章展示效果并直接输出为网页 |

**示例请求**: `/ARS-preview-html`

---

### 🚀 3. Live 触发任务视图
执行完整的生产链路，抓取即时新闻、经过 AI 增强加工且一键推送到配置的微信公众号后台草稿箱（Draft Box）中。

| 方法 | 端点路径 | 说明 |
| :--- | :--- | :--- |
| `GET` | `/{DOMAIN}-live` | **触发发布干线**：创建一版图文草稿 |

**示例请求**: `/MIT-live`

---

## 🌍 支持的业务领域 (`{DOMAIN}`)

在上述端点中的 `{DOMAIN}` 占位符可替换为以下 **7** 大资讯线节点：

| DOMAIN Key | 数据源 | 中文栏目标题 | 内容处理技术栈线 |
| :--- | :--- | :--- | :--- |
| `FINANCE` | MarketWatch | 美国金融动态 | 纯 RSS 标准流水线 |
| `NASA` | NASA 官方 | 航天前沿速递 | 纯 RSS 标准流水线 |
| `ARS` | Ars Technica | 技术洞察 | 纯 RSS 标准流水线 |
| `IMMIGRATION` | Grok AI ASR | 官方移民动态追踪 | Grok 实时检索 + 标准流水线 |
| `SCIENCEDAILY` | ScienceDaily | 每日科学前沿速递 | 纯 RSS 标准流水线 |
| `MIT` | MIT Research | 今日研究前沿 | RSS 摄入 + Nemotron 拆解长文 |
| `APA` | APA Blog | 今日哲学探索 | RSS 摄入 + Nemotron 哲学普及拆解 |

---

## 📊 数据响应示例 (`/preview`)

```json
{
  "domain": "MIT",
  "newsCount": 5,
  "news": [
    {
      "title": "Unlocking AI and Advanced Robotics: A Vision for the Future",
      "pubDate": "Wed, 12 Feb 2026 14:00:00 EST",
      "link": "https://news.mit.edu/...",
      "source": "MIT Research News",
      "description": "Original long text decomposed and refined by Nemotron AI into engaging paragraph...",
      "aiTranslation": {
        "title": "译文：解锁AI与先进机器人技术：对未来的远见",
        "content": "译文：正文翻译以及润色总结..."
      }
    }
  ],
  "digest": "合并标题集合构建的头部前言...",
  "vocab": "Moiré | n. | 莫尔纹 | In physics, a moiré pattern..."
}
```

---

## ⚠️ 错误响应示例

如果遇到上游抓取阻断或 AI 解析崩溃，默认返回 `500` 状态码。

```json
{
  "domain": "APA",
  "error": "APAProvider: RSS fetch failed — Error: 406 Not Acceptable"
}
```
*(注：如果由于 Cron 并发导致的接口调用被限制等临时频受，可直接进行手动接口回重试)*
