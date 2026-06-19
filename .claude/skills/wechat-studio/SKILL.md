---
name: wechat-studio
description: 双 CLI 协作协议——定义 Claude（主管）与 agy（图像执行者）的角色边界、调用约定、风格库、交接门。本 skill 是元协议层，不直接生成内容，被 wechat-draft / wechat-essay 引用。
---

# WeChat Studio Skill（图文协作协议）

## 这是什么

本 skill 是微信公众号配图流水线的**团队宪法**：定义谁生成图、怎么调用、怎么落地到微信、失败怎么兜底。它不执行任何具体创作任务，而是让 `wechat-draft`（RSS 资讯流）与 `wechat-essay`（个人感想流）共用同一套图像生成协议。

---

## 角色定义

| 角色 | 执行主体 | 职责 |
|------|---------|------|
| **主管（Supervisor）** | Claude | 文案 · 分段 · 风格决策 · 图意撰写 · 调用编排 · 落盘校验 · 上传 · 发布 |
| **执行者（Executor）** | agy（Antigravity CLI / Nano Banana）| 0→1 图像生成 |
| **本地脚本** | `.mjs` 脚本 | 上传微信（封面 / 内文）· HTML 组装 |

> **原则**：agy 只负责从零生成图像；Claude 负责判断、审查、上传与兜底。两者之间的每次交接都有明确的门控检查点。

---

## 图像生成双轨策略（重要 · 先判断再画）

并非所有图都该交给 agy。扩散模型擅长"画得像"，不擅长"画得逻辑对"——它按训练先验出图，**离主流先验越远越容易崩**。两类失败模式：

- **规则/逻辑推理图**（让路、变道、环岛通行权等）：训练集里几乎没有"红灯车队故意留空"这种画面，模型会回退到"车贴车"、删掉支路车、或贴网页截图先验，**几乎画不对**。
- **区域性反先验细节**（澳洲靠左行驶、右舵方向盘在右、环岛顺时针）：全球数据以靠右/左舵为主，模型会顽固地画成靠右/左舵。

因此分两轨：

| 轨道 | 适用图类 | 工具 |
|------|---------|------|
| **A. 生成式** | 共现/插画类——人+物同时出现、无因果顺序（封面、罚单、安全带、手机对比、RBT 场景、情绪反差等）| **agy**（Nano Banana）|
| **B. 程序化** | 规则/逻辑图——多步推理或精确空间关系（让路留空隙、提前变道、环岛通行权）| **rule-diagram.mjs**（rough.js 手绘风，坐标确定性，逻辑 100% 正确）|

> rough.js 的手绘潦草笔触与 agy 的 doodle 同属一路，两轨混排风格统一。规则图不要硬让 agy 反复重画（既耗额度又难对），直接走 B 轨。

**B 轨用法**（内置南澳驾驶系列三张：gap 支路留空隙 / lane 提前变道 / roundabout 环岛顺时针）：
```bash
node ${本 skill}/scripts/rule-diagram.mjs [gap lane roundabout] [--out=skill/output/images]
```
新增规则图 → 在 `rule-diagram.mjs` 的 `SCENES` 里加一个场景函数（俯视、澳洲靠左/右舵/环岛顺时针）。依赖 `roughjs` + `sharp`（已在 devDependencies）。

---

## 前置依赖

- `agy` 已安装并完成 OAuth 认证。自检：`agy models` 能列出模型即可。
- 微信凭据：项目根 `.dev.vars` 含 `APPID` / `APPSECRET`，且当前出口 IP 在公众号 IP 白名单内。

---

## agy 调用约定

### 基本语法

```bash
agy --dangerously-skip-permissions --add-dir "<项目绝对路径>" --print "<提示词>"
```

提示词模板（英文更稳）：
> `Generate an image using your nano banana image tool and save the PNG to <图片绝对路径>.png . Subject: <图意>. Style: <STYLE 英文关键词>. Size <宽x高>. No text, no letters, no watermark, no logo. Clean composition with margin, even lighting.`

- **`--print` 必须放在所有 flag 之后，提示词作为它的参数值紧跟其后**。`--print` 会把紧跟其后的下一个 token 当作提示词——若把别的 flag 放在 `--print` 之后，提示词会被吞掉、agy 跑偏（务必遵守此顺序）。
- `--dangerously-skip-permissions`：免去文件写入的逐次确认（本机本人工具）。
- `--add-dir`：把项目目录加入 agy 工作区，使其能写入目标路径。
- agy 需要联网访问其后端；若在受限/沙箱环境调用会挂起，须允许其网络访问。
- agy 在 `--print` 模式下**确认文字未必回到 stdout**——因此一律**以目标 PNG 是否落盘为准**判断成败（见下）。
- 图片统一落盘到 `skill/output/images/`（不存在时先 `mkdir`）。

### 落盘校验与兜底（强制）

每次调用 agy 后，Claude **必须**校验目标文件确实生成（Read 图片或 `test -f`）：

1. 文件存在且为有效图片 → 进入上传交接。
2. 文件缺失 / agy 报错 / 明显不符图意 → **改写 prompt 重试一次**。
3. 仍失败 → **回退**，并明确告知用户：
   - 资讯流封面：退回自定义 URL 或默认图。
   - 资讯流内文：该条目保持无图，不阻断后续条目。
   - 感想流：该配图点跳过（或由用户提供图）。

> agy 的角色是「锦上添花」，任何单图失败都不得中断整篇发布流程。

---

## 风格库（事先询问 · 同篇统一）

**硬性规则**：每篇文章在生成任何图之前，必须先询问用户选定**一种**风格，并对该篇的封面与所有内文配图**统一使用**，不得混用。

| 名称 | 触发词 | 注入 prompt 的英文关键词 |
|------|--------|------------------------|
| **写实编辑插画** | 写实 / realistic | editorial photographic illustration, realistic, cinematic lighting, science-magazine cover feel, rich detail |
| **扁平矢量信息图** | 扁平 / 矢量 / flat | flat vector illustration, clean geometric shapes, limited bold palette, infographic style, no gradients |
| **草绘** | 草绘 / 素描 / sketch | hand-drawn pencil sketch, loose expressive linework, monochrome, sketchbook feel |
| **吉卜力手绘** | 吉卜力 / ghibli | Studio Ghibli watercolor animation style, soft warm palette, painterly, gentle shading |
| **简画** | 简画 / 极简 / minimal | minimalist line-art, very few strokes, lots of white space, elegant, single accent color |

**全局图像约束（所有风格通用，必须写进 prompt）**：
- 图内禁止任何文字、字母、数字、水印、logo。
- 均匀光照，无强烈烘焙阴影。
- 主体居中或遵循图意，构图干净、留白充足。

---

## 图片规格

| 用途 | 尺寸 / 比例 | 说明 |
|------|------------|------|
| **封面** | ≈ 1175×500（约 2.35:1，宽幅） | 贴近微信图文封面比例，经 `--thumb-file` 上传为 `thumb_media_id` |
| **内文配图** | ≈ 1024×683（3:2） | 全宽展示，经 `wechat-image.mjs` 上传换取 `mp.weixin.qq.com` URL |

---

## 落地脚本（本地层）

| 脚本 | 用途 | 输出 |
|------|------|------|
| `${本 skill}/scripts/rule-diagram.mjs [scene...]` | **B 轨**：程序化生成规则/逻辑图（rough.js 手绘风）| `skill/output/images/<scene>.png` |
| `${本 skill}/scripts/wechat-image.mjs --file <png>` | 内文图 → 微信 `uploadimg` | 打印可直接用于正文 `<img>` 的 `mp.weixin.qq.com` URL |
| `wechat-draft/scripts/wechat-publish.mjs --thumb-file <png>` | 本地封面 → `add_material` | 作为草稿 `thumb_media_id` |

> `wechat-image.mjs` 返回的 URL 才能在微信正文中显示；外站图片 URL 会被微信屏蔽。资讯流把该 URL 写回条目 `imageUrl`，由 `generate-html.mjs` 自动注入。

---

## 交接门控（Handoff Gates）

```
Claude 选定风格 + 撰写图意
        │  （门：用户确认风格，整篇统一）
        ▼
agy 生成图像 → skill/output/images/*.png
        │  （门：Claude 校验文件落盘；失败则重试一次→兜底）
        ▼
本地脚本上传微信
        ├─ 封面  → wechat-publish.mjs --thumb-file → thumb_media_id
        └─ 内文  → wechat-image.mjs → mp.weixin.qq.com URL（写回 imageUrl）
        │  （门：拿到 id / URL）
        ▼
组装 HTML → 创建草稿（Claude）
```

---

## 与其他 skill 的关系

```
wechat-studio（本 skill）
  └─ 协议层，被以下流程引用

wechat-draft   RSS 资讯流：为缺图条目补内文配图 + 生成封面
wechat-essay   个人感想流：为原创正文规划并生成图文配图

两条流程共享：本协议 + wechat-image.mjs + wechat-publish.mjs
两条流程独立：各自的 SKILL 步骤与 HTML 生成器，互不混用
```
