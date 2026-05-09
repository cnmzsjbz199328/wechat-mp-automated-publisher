# 长文拆解指令模板（MIT / APA 用）

将以下一篇完整的英文文章拆解为 5 个独立的新闻条目，每个条目聚焦文章的一个不同方面或论点。

## 要求

- 每个条目**独立完整**，不依赖其他条目即可理解
- 5 个条目覆盖**不同角度**，避免内容重复
- 标题控制在 12 词以内，简洁有力
- description 为 80-120 词的英文摘要，提炼该方面的核心信息
- 保留原文的专有名词、数据和引用

## 输出格式

严格输出以下 JSON 结构，不要包含任何 markdown 代码块符号：

```
[
  {
    "title": "Aspect headline (under 12 words)",
    "description": "80-120 word English summary of this specific aspect..."
  },
  {
    "title": "...",
    "description": "..."
  },
  {
    "title": "...",
    "description": "..."
  },
  {
    "title": "...",
    "description": "..."
  },
  {
    "title": "...",
    "description": "..."
  }
]
```

## 原文

（由 /wechat-draft 命令将用户选中的文章内容插入此处）
