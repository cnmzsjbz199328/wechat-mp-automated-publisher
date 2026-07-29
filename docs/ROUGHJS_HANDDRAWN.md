# 用 rough.js 程序化生成手绘风示意图与图表

> 一份可独立阅读、可复用的技术说明：用代码（rough.js + sharp）确定性地生成"手绘潦草风"的 SVG / PNG，用于规则示意图、逻辑图与数据可视化。
> 全文不依赖任何特定业务，给出的代码片段可直接拷到任何 Node 项目复用。

---

## 1. 解决什么问题

当你需要把一张**逻辑/数值必须精确正确**的图放进内容里时，有两条常见路线：

1. **生成式（扩散模型 / 文生图）**：擅长"画得像"——写实场景、人物、插画、有机纹理。
2. **程序化（本文方案）**：擅长"画得对"——坐标、角度、长度由代码计算，逻辑与数值 100% 受控。

扩散模型的根本短板是**按训练先验出图，离主流先验越远越容易崩**，典型三类必崩场景：

- **规则/逻辑推理图**：如"红灯车队故意留空隙让支路车汇入"，训练集里几乎没有这种画面，模型会回退到"车贴车"、删掉支路、或贴网页截图先验。
- **区域性反先验细节**：如靠左行驶、右舵方向盘、环岛顺时针——全球数据以靠右/左舵为主，模型顽固画错。
- **数据可视化**：条形长度必须严格正比于数值，扩散模型只会画"看起来像图表"的东西，数字和长度对不上。

**rough.js 方案的定位**：用代码画 SVG → 坐标 100% 由程序控制 → 逻辑与数值确定正确；同时 rough.js 自带"手绘潦草笔触"，观感不死板，可与文生图的 doodle 插画混排而不违和。

> 选型法则：**"逻辑/数值必须对" → 程序化；"画得像就行" → 生成式。** 两者互补，不是替代。

---

## 2. 技术栈与渲染管线

```
rough.generator()  →  Drawable（含 sets[] 矢量操作集）
       │  toSvg(): gen.opsToPath(set) 把每个 set 转成 <path>
       ▼
   SVG 字符串（白底矩形 + 所有 <path>/<text> 拼接）
       │  sharp(Buffer.from(svg)).png().toFile(...)
       ▼
   PNG 文件（同时可留存 .svg 矢量原件）
```

- **roughjs**：用 `rough.generator()`（**纯生成器，不依赖 canvas / DOM / 浏览器**），把基本图元转成"手绘风"的矢量操作集 `Drawable.sets`。这是能在纯 Node 脚本里跑的关键——大多数 rough.js 教程用 `rough.canvas(domNode)`，那需要浏览器；服务端要用 `rough.generator()`。
- **sharp**：把 SVG 字符串栅格化为 PNG（内部走 librsvg）。**中文/非拉丁文字依赖系统已安装的字体**。
- 依赖安装：`npm i -D roughjs sharp`。Node ≥ 16，脚本用 ESM（`.mjs` 或 `"type":"module"`，因为用到顶层 `await`）。

---

## 3. 优势

| 优势 | 说明 |
|------|------|
| **逻辑/数值 100% 正确** | 坐标、条长、角度、方向全由代码计算。条长严格 `= value / maxV × 轴长`，不存在"模型理解错"。 |
| **确定性、可复现** | 固定 `seed` 后同输入永远同输出。便于回归测试、便于只微调一个坐标而不动其余。 |
| **反先验细节完全可控** | "模型死活画不对"的约定（靠左行驶、右舵、环岛顺时针等），在代码里就是几个坐标常量。 |
| **零成本、零延迟、可离线** | 纯本地 Node 渲染，不消耗任何出图额度/API 调用，不需联网，毫秒级出图。反复调坐标时尤其省。 |
| **手绘观感但不死板** | `roughness` / `bowing` 抖动笔触 + hachure 斜线填充，与文生图 doodle 同路，混排统一。 |
| **文字受控、无乱码** | 文字由 `<text>` 精确排版，不像扩散模型生成乱码字母。 |
| **矢量中间产物** | 先 SVG 再转 PNG，SVG 可留档、无损缩放、二次编辑。 |

---

## 4. 局限

| 局限 | 说明 / 应对 |
|------|------------|
| **必须手写坐标** | 每个新场景都要手工摆放每条线、每个形状。是"用工程量换确定性"，不适合一次性、不复用的复杂插画。 |
| **不擅长写实/有机形态** | 只有基本图元（线、矩形、圆、弧、曲线、路径 + hachure 填充）。人脸、纹理、光影画不了——那是生成式的活。 |
| **表达力受图元限制** | 复杂构图靠手工组合基本形状堆叠，成本随复杂度快速上升。超过"示意图/图表"复杂度就不划算。 |
| **抖动牺牲精密观感** | 抖动是风格优点，但若要工程制图级精确直线观感则不合适（可调低 `roughness`/`bowing` 接近规整）。 |
| **字体依赖系统环境** | sharp/librsvg 用**系统字体**渲染。换机器若缺所需字体（尤其 CJK）会回退甚至缺字。需在目标环境装好字体，或内嵌字体。 |
| **无自动布局** | 没有图表库的自动刻度/图例/防重叠。轴、padding、标签锚点都要手算。 |
| **无所见即所得** | 调一张图要反复出图定位坐标，调试成本高于可视化编辑器。 |

---

## 5. 方法（实现机理与可复用代码）

### 5.1 核心胶水：把 Drawable 转成 SVG 字符串

`rough.generator()` 产出 `Drawable`，内含若干 `set`，每个 set 有 `type`。需要自己把它转成 `<path>` 字符串（因为没有 canvas 帮你画）。这段 `toSvg` 是整个方案的核心，**可原样复用**：

```js
import rough from 'roughjs';
const gen = rough.generator();

function toSvg(d) {
  const o = d.options;
  return d.sets.map(set => {
    const path = gen.opsToPath(set);
    if (set.type === 'fillPath')   // 实心填充区域
      return `<path d="${path}" fill="${o.fill}" stroke="none"/>`;
    if (set.type === 'fillSketch') { // hachure 斜线填充的笔触：用 fillWeight 当线宽
      const w = o.fillWeight > 0 ? o.fillWeight : o.strokeWidth / 2;
      return `<path d="${path}" stroke="${o.fill}" stroke-width="${w}" fill="none"/>`;
    }
    // 普通描边轮廓
    return `<path d="${path}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}"
            fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
}
```

三类 set 必须区分处理：
- `path` —— 描边轮廓 → 普通 stroke。
- `fillPath` —— 实心填充区域 → 仅 fill，无 stroke。
- `fillSketch` —— hachure 斜线填充的笔触 → 用 `fillWeight` 作为线宽来描边。

### 5.2 风格参数：手绘感从哪来

```js
const INK = '#1a1a1a';
const base   = { stroke: INK, strokeWidth: 2.4, roughness: 1.5, bowing: 1.2, seed: 7 };
const filled = { ...base, fill: '#9aa7b1',
                 fillStyle: 'hachure', fillWeight: 1.6, hachureGap: 6, hachureAngle: -41 };
```

- `roughness`：线条抖动幅度（越大越潦草；0 接近规整直线）。
- `bowing`：直线"弯曲/手颤"程度。
- `seed`：固定随机种子 → **确定性**（不设则每次抖动都不同）。
- `fillStyle: 'hachure'` + `hachureGap` / `hachureAngle`：手绘斜线填充，是手绘风的标志性观感。其他可选 `solid` / `cross-hatch` / `zigzag` 等。

### 5.3 组装并落盘（SVG → PNG）

```js
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';

const parts = [];                              // 收集所有 <path>/<text>
parts.push(toSvg(gen.rectangle(40, 40, 200, 120, filled)));
parts.push(toSvg(gen.circle(400, 100, 120, base)));
// ...更多图元

const w = 1024, h = 683;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"
  viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#fff"/>${parts.join('')}</svg>`;

mkdirSync('out', { recursive: true });
writeFileSync('out/demo.svg', svg);            // 留矢量原件（可选）
await sharp(Buffer.from(svg)).png().toFile('out/demo.png');
```

### 5.4 文字：精确排版与字体

文字不走 rough.js，直接写 `<text>`，便于精确控制位置与锚点：

```js
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const FONT = "Microsoft YaHei, 'Noto Sans CJK SC', sans-serif";   // CJK 走系统字体
const txt = (x, y, s, { size = 22, anchor = 'start', weight = 'normal', fill = INK } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-family="${FONT}"
   font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
```

> ⚠️ 字体在**渲染机器**上解析，不在浏览器。CJK 需目标系统装有对应字体，否则缺字。

### 5.5 常用自绘图元（示意图常需要）

rough.js 只给基本图元，复杂形状要自己组合。以下几个在"规则/逻辑示意图"里反复出现，供参考：

```js
// 虚线（rough.js 没有原生 dash，自己按段切）
function dash(x1, y1, x2, y2, seg = 26, gap = 20, opt) {
  const out = [], dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len; let t = 0;
  while (t < len) { const e = Math.min(t + seg, len);
    out.push(gen.line(x1 + ux*t, y1 + uy*t, x1 + ux*e, y1 + uy*e, opt)); t = e + gap; }
  return out;
}

// 带箭头的曲线轨迹：末段方向算出两条短线作箭头
function arrow(points, opt, head = 17) {
  const out = [gen.curve(points, opt)];
  const [px, py] = points.at(-2), [tx, ty] = points.at(-1);
  const a = Math.atan2(ty - py, tx - px);
  out.push(gen.line(tx, ty, tx - head*Math.cos(a-0.4), ty - head*Math.sin(a-0.4), opt));
  out.push(gen.line(tx, ty, tx - head*Math.cos(a+0.4), ty - head*Math.sin(a+0.4), opt));
  return out;
}

// 极坐标辅助（画饼图扇区、环岛弧线时常用）
const polar = (cx, cy, r, deg) => {
  const a = deg * Math.PI / 180;
  return { x: cx + r*Math.cos(a), y: cy + r*Math.sin(a) };
};
```

饼图扇区用路径 + 圆弧命令（`gen.path` 接受 SVG path 字符串，因此可直接喂 `A` 弧线）：

```js
const wedge = `M${cx},${cy} L${p0.x},${p0.y} A${r},${r} 0 ${large} 1 ${p1.x},${p1.y} Z`;
parts.push(toSvg(gen.path(wedge, { ...filled, hachureAngle: 30 })));
```

### 5.6 一个完整的最小可运行示例

```js
// demo.mjs —— node demo.mjs 生成 out/demo.png
import rough from 'roughjs';
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';

const gen = rough.generator();
const INK = '#1a1a1a';
const base = { stroke: INK, strokeWidth: 2.4, roughness: 1.5, bowing: 1.2, seed: 7 };
const bar  = { ...base, fill: '#9aa7b1', fillStyle: 'hachure', fillWeight: 1.6, hachureGap: 6, hachureAngle: -41 };

function toSvg(d) {
  const o = d.options;
  return d.sets.map(set => {
    const p = gen.opsToPath(set);
    if (set.type === 'fillPath')   return `<path d="${p}" fill="${o.fill}" stroke="none"/>`;
    if (set.type === 'fillSketch') { const w = o.fillWeight > 0 ? o.fillWeight : o.strokeWidth/2;
      return `<path d="${p}" stroke="${o.fill}" stroke-width="${w}" fill="none"/>`; }
    return `<path d="${p}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" fill="none" stroke-linecap="round"/>`;
  }).join('');
}

const data = [{ label: 'A', value: 30 }, { label: 'B', value: 75 }, { label: 'C', value: 50 }];
const maxV = Math.max(...data.map(d => d.value));
const W = 700, H = 400, padL = 60, baseY = 340, slot = (W - padL - 40) / data.length;
const parts = [toSvg(gen.line(padL, baseY, W - 40, baseY, base))];   // x 轴
data.forEach((d, i) => {
  const bw = 80, bh = (d.value / maxV) * 240;                        // 条长严格正比数值
  const x = padL + slot * i + (slot - bw) / 2;
  parts.push(toSvg(gen.rectangle(x, baseY - bh, bw, bh, bar)));
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${parts.join('')}</svg>`;
mkdirSync('out', { recursive: true });
writeFileSync('out/demo.svg', svg);
await sharp(Buffer.from(svg)).png().toFile('out/demo.png');
console.log('OK out/demo.png');
```

---

## 6. 实践建议

- **固定 `seed`**，否则每次出图抖动都不同，无法回归对比。
- **先出 SVG 再人眼看**，定位坐标比直接看 PNG 快；把 SVG 一起留档便于二次编辑。
- **把场景做成函数表**（`{ 名称: () => 画这张图 }`），CLI 传名字选图，便于批量与扩展。
- **数据图把"长度/角度 = 数值映射"写死成公式**（`value/maxV × 轴长`、`frac × 360°`），这是程序化相对生成式的核心价值，别手填。
- **目标渲染环境提前装好字体**（尤其 CJK），或考虑把字体内嵌进 SVG。
- **复杂度评估**：若一张图要写几百行坐标，先问是否真的需要"逻辑精确"——若只是好看，交给生成式更省。

---

## 7. 一句话选型

| 需求 | 用程序化（rough.js） | 用生成式（文生图） |
|------|---------------------|-------------------|
| 多步推理 / 精确空间关系 | ✅ | ❌ |
| 反先验细节（靠左、右舵、环岛顺时针…） | ✅ | ❌ |
| 数据/数值图（条形、饼、时序） | ✅ | ❌ |
| 写实 / 人物 / 光影 / 纹理 | ❌ | ✅ |
| 共现插画、无因果顺序的场景图 | ❌ | ✅ |

> **"逻辑/数值必须对" → rough.js 程序化；"画得像就行" → 生成式。**
