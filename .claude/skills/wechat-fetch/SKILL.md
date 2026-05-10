---
name: wechat-fetch
description: 从指定新闻源预取候选文章，展示摘要列表供用户筛选
argument-hint: "[DOMAIN]"
allowed-tools: Bash(node *)
---

从指定新闻源预取候选文章，展示摘要列表供用户筛选。

## 参数

`$ARGUMENTS` 为域名，可选值：`FINANCE` / `NASA` / `ARS` / `SCIENCEDAILY` / `MIT` / `APA` / `BBC` / `NATURE` / `SPACE` / `IMMIGRATION` / `all`

## 执行步骤

**Step 1 — 确定域名**

如果 `$ARGUMENTS` 为空，询问用户：
> 请指定新闻域名：FINANCE / NASA / ARS / SCIENCEDAILY / MIT / APA / BBC / NATURE / SPACE / IMMIGRATION / all

如果用户输入 `all`，按顺序处理全部域名。

---

**Step 2 — 运行预取脚本**

- 所有域名（除 IMMIGRATION）：
  ```
  node ${CLAUDE_SKILL_DIR}/scripts/fetch-rss.mjs <DOMAIN>
  ```
- IMMIGRATION：
  ```
  node ${CLAUDE_SKILL_DIR}/scripts/fetch-grok.mjs
  ```
- `all` 时依次运行所有域名，汇总结果

---

**Step 3 — 格式化展示**

将脚本输出的 JSON 整理为以下格式（每个域名一组）：

```
── NASA ──────────────────────────────────
1. [文章标题原文]
   📅 [pubDate]  |  [source]
   [description 前 80 字]...
   🔗 [link 的域名部分]

2. [文章标题原文]
   ...
```

MIT 和 APA 会展示最多 8 条候选（用于选 1 篇做拆解）。

---

**Step 4 — 基于公众号特性推荐**

展示完毕后，综合所有条目，从以下维度评估并推荐 3–5 条最适合本公众号读者的文章：

评估维度（面向目标读者：关注留学/移民/科技前沿的华人群体）：
- **关联性**：与澳洲生活、移民政策、海外华人直接相关的优先
- **新颖性**：重大科学发现、政策突破、颠覆性技术更易引发分享
- **可读性**：有具体数字、人名、实验结果的文章比泛论更易转化
- **情感共鸣**：健康、家庭、职业发展类话题对华人读者吸引力强
- **时效性**：当日或近期发布的文章优先

输出格式：

```
📌 推荐阅读（按吸引力排序）
1. [编号] 标题 — 推荐理由（一句话）
2. [编号] 标题 — 推荐理由
...
```

---

**Step 5 — 询问用户选择**

推荐完毕后，询问：

> 请选择要处理的条目编号（例如 `1,3` 或 `all`）。
> 
> 提示：MIT / APA 请选 1 篇，Claude 会自动将其拆解为 5 个视角。
> 选好后，运行 `/wechat-draft` 继续处理。

将用户选中的条目 JSON 保留在对话上下文中，等待 `/wechat-draft`。
