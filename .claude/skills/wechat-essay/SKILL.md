---
name: wechat-essay
description: 为个人原创/感想类文章规划并生成统一风格的配图，组装图文 HTML 并发布到微信草稿箱
allowed-tools: Bash(node *), Bash(agy *), Write
---

为**个人原创/感想类文章**配图并发布。与 RSS 资讯流（wechat-fetch / wechat-draft）相互独立、不混用，但共享 **wechat-studio** 图像协议与 `wechat-image.mjs` / `wechat-publish.mjs` 落地脚本。

本 skill 全程遵循 **wechat-studio** 协议（角色边界、agy 调用约定、风格库、落盘校验与兜底，见 `.claude/skills/wechat-studio/SKILL.md`）。

## 前提

agy 已安装认证；`.dev.vars` 含 `APPID` / `APPSECRET`。

---

## Step 1 — 接收原文

请用户提供：
> 1. **文章标题**
> 2. **正文**（直接粘贴，或给出文件路径，由我读取）
> 3. **署名**（可选，默认「随笔」）

读入正文全文。

---

## Step 2 — 选定视觉风格（整篇统一）

询问用户本篇配图风格，取自 wechat-studio 风格库其一（写实编辑插画 / 扁平矢量信息图 / 草绘 / 吉卜力手绘 / 简画）。**整篇封面与所有内文插图统一使用该风格**。

---

## Step 3 — 分段与配图规划

将正文切分为若干 section（每段含可选 `heading` + `paragraphs[]`），并规划配图点：
- **封面** 1 张（按全文主题）。
- **内文插图**：按 section 语义决定哪些 section 需要插图（不必每段都配，避免堆砌）。可选一句**题记/导语**（`lead`）。

向用户展示分段结构与拟定的配图点（每点附一句图意 concept），询问：
> 分段与配图点满意吗？需要增减配图请告诉我，否则回复 `ok` 继续。

---

## Step 4 — 生成并上传配图

确保目录存在：`mkdir -p skill/output/images`。

**内文插图**（每个配图点 i，按 wechat-studio 约定，`--print "<提示词>"` 放在所有 flag 之后）：
```bash
agy --dangerously-skip-permissions --add-dir "<项目绝对路径>" --print "Generate an image using your nano banana image tool and save the PNG to <项目绝对路径>/skill/output/images/essay-<i>.png . Subject: <concept>. Style: <选定风格英文关键词>. Size 1024x683 (3:2). No text, no letters, no watermark, no logo. Clean composition with margin, even lighting."
```
校验落盘（失败重试一次，仍失败则该点跳过）→ 上传换 URL，写入对应 section 的 `imageUrl`：
```bash
node ${CLAUDE_SKILL_DIR}/../wechat-studio/scripts/wechat-image.mjs --file skill/output/images/essay-<i>.png
```

**封面**（写入 `skill/output/images/cover.png`，规格 1175x500），校验落盘；失败回退默认图。

---

## Step 5 — 组装并生成 HTML

将结果写入 `skill/output/essay.json`：
```json
{
  "title": "文章标题",
  "author": "署名",
  "lead": "题记/导语（可选）",
  "sections": [
    { "heading": "小标题（可选）", "paragraphs": ["段落1", "段落2"], "imageUrl": "mp.weixin.qq.com URL（可选）" }
  ]
}
```

运行生成器，将 stdout 用 Write 工具写入 `skill/output/essay.html`（不要用 shell 重定向）：
```
node ${CLAUDE_SKILL_DIR}/scripts/generate-essay-html.mjs --file skill/output/essay.json
```

---

## Step 6 — 发布到微信

```
# 有生成封面：
node ${CLAUDE_SKILL_DIR}/../wechat-draft/scripts/wechat-publish.mjs --file skill/output/essay.html --title "<标题>" [--summary "<摘要>"] --thumb-file skill/output/images/cover.png

# 封面回退默认图：
node ${CLAUDE_SKILL_DIR}/../wechat-draft/scripts/wechat-publish.mjs --file skill/output/essay.html --title "<标题>" [--summary "<摘要>"]
```

输出发布结果。成功后告知用户：
> ✅ 草稿已创建，请前往 [微信公众平台](https://mp.weixin.qq.com) → 草稿箱 查看并发布。
