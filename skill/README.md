# WeChat MP 技能包

一套 CLI 驱动的微信公众号内容工作流，在每个关键节点引入人工审阅，避免自动化黑箱带来的质量风险。

## 工作流

两条独立流程，共享 **wechat-studio** 图像协议与上传/发布脚本：

**A. RSS 资讯流**
```
/wechat-fetch [DOMAIN]
    └─ 脚本抓取原始新闻 → Claude 展示列表 → 你选择感兴趣的条目
         ↓
/wechat-draft
    └─ Claude 翻译 → 你确认 → 提取词汇 → 【缺图条目配图 + 封面（agy 生成）】
       → 生成 HTML → 发布到草稿箱
```

**B. 个人感想流**
```
/wechat-essay
    └─ 你提供原文 → 选风格 → Claude 分段+规划配图 → 你确认
       → 【agy 生成统一风格配图 + 封面】→ 生成 HTML → 发布到草稿箱
```

> **wechat-studio**（协议层 skill，不直接调用）定义 Claude 主管 / agy 执行者的角色边界、agy 调用约定、风格库（写实 / 扁平矢量 / 草绘 / 吉卜力 / 简画，**事先询问、同篇统一**）与失败兜底。

## 快速开始

### 1. 环境变量

确认项目根目录 `.dev.vars` 包含以下变量：

```
APPID=你的微信公众号AppID
APPSECRET=你的微信公众号AppSecret
XAI_API_KEY=你的xAI密钥（仅IMMIGRATION域名需要）
```

> 出口 IP 需在公众号 IP 白名单内（设置与开发 → 基本配置 → IP白名单）。

### 1.5 图片生成依赖（agy）

配图功能依赖 **agy**（Antigravity CLI，内置 Nano Banana 图像生成）：

- 安装并完成 OAuth 认证后，自检 `agy models` 能列出模型即可。
- agy 生成的图片落盘到 `skill/output/images/`，由脚本上传微信换取可用 URL。
- agy 不可用 / 单图失败时流程自动兜底（资讯流退回 RSS 原图或默认封面，感想流跳过该配图点），不中断发布。

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
├── wechat-studio/            # 协议层（图像协作协议，被 draft/essay 引用）
│   ├── SKILL.md              # 角色 / agy 调用约定 / 风格库 / 交接门
│   └── scripts/
│       └── wechat-image.mjs  # 内文图 → 微信 uploadimg → mp.weixin.qq.com URL
├── wechat-fetch/
│   ├── SKILL.md              # /wechat-fetch 命令
│   └── scripts/
│       ├── fetch-rss.mjs     # RSS 预处理脚本（零 token 消耗）
│       └── fetch-grok.mjs    # Grok 搜索脚本
├── wechat-draft/
│   ├── SKILL.md              # /wechat-draft 命令（含 Step 4.5 配图生成）
│   ├── scripts/
│   │   ├── generate-html.mjs # WeChat HTML 生成
│   │   └── wechat-publish.mjs# WeChat API 发布（支持 --thumb-file 本地封面）
│   └── prompts/
│       ├── translate.md      # 翻译指令参考
│       ├── vocabulary.md     # 词汇提取指令参考
│       └── decompose.md      # 长文拆解指令参考（MIT/APA）
└── wechat-essay/             # /wechat-essay 命令（个人感想文章配图发布）
    ├── SKILL.md
    └── scripts/
        └── generate-essay-html.mjs  # 单作者图文 HTML 生成

skill/
├── README.md                 # 本文件
└── output/                   # 生成文件临时目录（已加入 .gitignore）
    ├── article.json / .html  # 资讯流结构化数据 / HTML
    ├── essay.json / .html    # 感想流结构化数据 / HTML
    └── images/               # agy 生成的封面与内文配图
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

# agy 生成一张配图（落盘到 skill/output/images/；--print "<提示词>" 须放在所有 flag 之后）
agy --dangerously-skip-permissions --add-dir "$(pwd)" --print "Generate an image using your nano banana image tool and save the PNG to $(pwd)/skill/output/images/test.png . Subject: a glowing neural network over a city skyline. Style: flat vector illustration. Size 1024x683. No text, no watermark."

# 内文图上传微信，返回可用 URL
node .claude/skills/wechat-studio/scripts/wechat-image.mjs --file skill/output/images/test.png

# 用本地图作封面发布
node .claude/skills/wechat-draft/scripts/wechat-publish.mjs --file skill/output/article.html --title "标题" --thumb-file skill/output/images/test.png
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
