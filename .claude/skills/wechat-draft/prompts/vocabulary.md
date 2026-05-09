# 词汇提取指令模板

从以下英文新闻内容中提取 5 个适合中国英语学习者的高级词汇。

## 选词标准

- 优先选择学术、科技或政策类词汇（避免 go/have/make 等基础词）
- 词汇须出现在正文中，有真实语境
- 覆盖不同词性：名词、动词、形容词各至少 1 个

## 输出格式

每行一个词，字段用 `|` 分隔，共 5 行，不要额外说明文字：

```
word | part_of_speech | 中文释义 | example sentence containing the word
```

**词性缩写**：n. / v. / adj. / adv. / prep.

**示例**：
```
indigenous | adj. | 土著的；本土的 | "Indigenous communities have long advocated for land rights."
trajectory | n. | 轨迹；发展走势 | "The trajectory of the mission was carefully calculated."
```

## 新闻内容

（由 /wechat-draft 命令将英文原文插入此处）
