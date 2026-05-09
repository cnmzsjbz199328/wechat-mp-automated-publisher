# WeChat MP 技能包

一套 CLI 驱动的微信公众号内容工作流，在每个关键节点引入人工审阅，避免自动化黑箱带来的质量风险。

## 工作流

```
/wechat-fetch [DOMAIN]
    └─ 脚本抓取原始新闻 → Claude 展示列表 → 你选择感兴趣的条目
         ↓
/wechat-draft
    └─ Claude 翻译 → 你确认 → Claude 提取词汇 → 生成 HTML → 发布到草稿箱
```

## 快速开始

### 1. 环境变量

确认项目根目录 `.dev.vars` 包含以下变量：

```
APPID=你的微信公众号AppID
APPSECRET=你的微信公众号AppSecret
XAI_API_KEY=你的xAI密钥（仅IMMIGRATION域名需要）
```

### 2. 运行命令

在 Claude Code CLI 中：

```
/wechat-fetch NASA
```

Claude 会展示最新的 NASA 新闻列表，你选择感兴趣的条目（如 `1,3`），然后运行：

```
/wechat-draft
```

Claude 完成翻译、词汇提取、HTML 生成，最终发布到微信草稿箱。

---

## 支持的域名

| 域名 | 来源 | 说明 |
|---|---|---|
| `FINANCE` | MarketWatch | 全球金融新闻 |
| `NASA` | NASA RSS | 航天科学新闻 |
| `ARS` | Ars Technica | 科技新闻 |
| `SCIENCEDAILY` | ScienceDaily | 科学研究新闻 |
| `MIT` | MIT Research | 返回 8 篇候选，选 1 篇由 Claude 拆解为 5 个视角 |
| `APA` | APA Blog | 哲学文章，同上处理方式 |
| `IMMIGRATION` | xAI Grok | 澳洲移民政策，需要 `XAI_API_KEY` |
| `all` | 全部 | 依次抓取所有域名 |

---

## 目录结构

```
.claude/skills/
├── wechat-fetch/
│   ├── SKILL.md              # /wechat-fetch 命令
│   └── scripts/
│       ├── fetch-rss.mjs     # RSS 预处理脚本（零 token 消耗）
│       └── fetch-grok.mjs    # Grok 搜索脚本
└── wechat-draft/
    ├── SKILL.md              # /wechat-draft 命令
    ├── scripts/
    │   ├── generate-html.mjs # WeChat HTML 生成
    │   └── wechat-publish.mjs# WeChat API 发布
    └── prompts/
        ├── translate.md      # 翻译指令参考
        ├── vocabulary.md     # 词汇提取指令参考
        └── decompose.md      # 长文拆解指令参考（MIT/APA）

skill/
├── README.md                 # 本文件
└── output/                   # 生成文件临时目录（已加入 .gitignore）
    ├── article.json          # 处理后的结构化数据
    └── article.html          # 生成的微信 HTML
```

---

## 单独运行脚本（调试用）

```bash
# 测试 RSS 抓取
node .claude/skills/wechat-fetch/scripts/fetch-rss.mjs NASA

# 测试 Grok 抓取（需要 XAI_API_KEY）
node .claude/skills/wechat-fetch/scripts/fetch-grok.mjs

# 手动生成 HTML（需要先有 article.json）
node .claude/skills/wechat-draft/scripts/generate-html.mjs --file skill/output/article.json > skill/output/article.html

# 手动发布
node .claude/skills/wechat-draft/scripts/wechat-publish.mjs --file skill/output/article.html --title "今日 NASA 资讯" --summary "最新航天动态"
```

---

## 与 Cloudflare Worker 的关系

技能包和 Worker 并行运行，互不干扰：

| | Cloudflare Worker | 技能包 |
|---|---|---|
| 触发方式 | Cron 自动 | CLI 手动 |
| 内容审核 | 无 | 翻译前可筛选 |
| 适合场景 | 每日定时推送 | 特定话题精选 / 测试 |
| AI 翻译 | Unified AI Backend | Claude 直接处理 |
