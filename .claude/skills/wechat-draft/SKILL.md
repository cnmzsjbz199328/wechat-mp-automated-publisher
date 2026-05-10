---
name: wechat-draft
description: 基于选中条目完成翻译、词汇提取，生成 HTML 并发布到微信草稿箱
allowed-tools: Bash(node *), Write
---

基于对话中已筛选的新闻条目，完成翻译、词汇提取，生成 HTML，并发布到微信草稿箱。

## 前提

对话上下文中必须有 `/wechat-fetch` 输出的选中条目。若没有，提示用户先运行 `/wechat-fetch`。

---

## Step 1 — 确认条目

从对话上下文读取用户选中的条目，整理为 `NewsItem[]` 列表。

---

## Step 2 — MIT / APA 长文拆解（仅当来源为 MIT 或 APA 时执行）

用户只选了 1 篇文章时，按照 `${CLAUDE_SKILL_DIR}/prompts/decompose.md` 中的指令拆解为 5 个独立视角。

拆解后得到 5 条 `{ title, description }` 对象，将它们组装为 5 个 `NewsItem`，第一条继承原文的 `imageUrl`、`pubDate`、`link`、`source`，其余条目 `imageUrl` 为 null。

---

## Step 3 — 翻译

按照 `${CLAUDE_SKILL_DIR}/prompts/translate.md` 的指令，将所有条目的 `title` + `description` 翻译为简体中文。

展示翻译结果，询问用户：
> 翻译满意吗？如需修改请告诉我具体条目，否则回复 `ok` 继续。

---

## Step 3.5 — 抓取原文并五段式扩写（英文先行，再逐段中文对照）

翻译确认后，对**每个条目**执行以下步骤：

**3.5.1 抓取原文**

使用 WebFetch 工具获取 `item.link` 对应的原始文章全文。若无法访问，告知用户并跳过扩写，退回摘要模式。

**3.5.2 先写五段英文扩写**

严格依据原文内容，撰写五段英文正文，禁止引入原文未提及的信息：

1. **Background**：背景与读者痛点，带出研究问题
2. **Core Discovery**：核心发现，具体引用基因名、机构名、研究者原话
3. **Experiments**：实验设计与结果（CRISPR、模式生物、数据等）
4. **Breakthrough**：关键突破与技术细节
5. **Outlook**：研究者原话引述 + 未来意义，收尾有力

每段 60–100 词，输出为 JSON 数组（对应 `item.paragraphs`）：
```
["En para 1", "En para 2", "En para 3", "En para 4", "En para 5"]
```

**3.5.3 逐段对照翻译为中文**

按照 `${CLAUDE_SKILL_DIR}/prompts/translate.md` 的风格，将上述五段英文**逐段**翻译为流畅的简体中文，每段 60–100 字，禁止引入原文未提及的信息。

输出为 JSON 数组（对应 `aiTranslation.paragraphs`），与英文段落一一对应：
```
["中文第一段", "中文第二段", "中文第三段", "中文第四段", "中文第五段"]
```

**最终 HTML 布局（中英对照，中文在前）：**
每对段落按以下顺序渲染：
```
[中文第N段]  ← 正文字号，第一段带蓝色左边框引导框
[英文第N段]  ← 小号灰色斜体
```

展示扩写与对照翻译结果，询问用户：
> 中英对照正文满意吗？如需修改请告诉我，否则回复 `ok` 继续。

---

## Step 4 — 词汇提取

按照 `${CLAUDE_SKILL_DIR}/prompts/vocabulary.md` 的指令，从所有英文原文中提取 5 个高级词汇。

展示词汇表（`word | pos | 中文释义 | example` 格式）。

---

## Step 5 — 组装并生成 HTML

将扩写与翻译结果写入对应字段，组装为以下 JSON，写入文件：

```json
{
  "news": [
    {
      "title": "原文标题",
      "pubDate": "...",
      "link": "...",
      "source": "...",
      "imageUrl": "...",
      "description": "原文RSS摘要（一句话）",
      "paragraphs": ["En para 1", "En para 2", "En para 3", "En para 4", "En para 5"],
      "aiTranslation": {
        "title": "中文标题",
        "paragraphs": ["中文第一段", "中文第二段", "中文第三段", "中文第四段", "中文第五段"]
      }
    }
  ],
  "vocab": "word | pos | 释义 | example\nword2 | pos | 释义 | example\n..."
}
```

将文件保存为 `skill/output/article.json`，然后运行：

```
node ${CLAUDE_SKILL_DIR}/scripts/generate-html.mjs --file skill/output/article.json
```

将输出重定向到 `skill/output/article.html`（使用 Write 工具写入，不要用 shell 重定向）：

实际操作：将 `generate-html.mjs` 的 stdout 捕获后，用 Write 工具写入 `skill/output/article.html`。

---

## Step 6 — 确认发布信息

询问用户：
> 1. **文章标题**（微信草稿标题）：
> 2. **摘要**（可选，120字以内，留空则不填）：
> 3. **封面图 URL**（可选，留空使用默认悉尼图片）：

---

## Step 7 — 发布到微信

运行发布脚本：

```
node ${CLAUDE_SKILL_DIR}/scripts/wechat-publish.mjs --file skill/output/article.html --title "<标题>" [--summary "<摘要>"] [--thumb "<封面URL>"]
```

输出发布结果。成功后告知用户：
> ✅ 草稿已创建，请前往 [微信公众平台](https://mp.weixin.qq.com) → 草稿箱 查看并发布。
