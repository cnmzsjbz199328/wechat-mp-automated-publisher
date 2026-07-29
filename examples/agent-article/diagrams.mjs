// 手绘风示意图生成器（rough.js）——为《让 agent 替你干长活》一文出图。
// 复用 wechat-studio 的手绘原语：toSvg / txt / 圆角盒子 / 箭头。
// 输出为内联 SVG 字符串（供 HTML 直接嵌入；浏览器里 webfont 也能正常渲染 SVG <text>）。

import rough from 'roughjs';

const gen = rough.generator();
const INK = '#1a1a1a';
const ACCENT = '#b8503e';
const TEAL = '#2c5f6b';
const MUTED = '#8a8780';
const SERIF = "'Noto Serif SC','Songti SC',serif";
const HAND = "'Kalam','Noto Serif SC',cursive";

const base = { stroke: INK, strokeWidth: 2.2, roughness: 1.5, bowing: 1.1, seed: 11 };
const thin = { ...base, strokeWidth: 1.5, roughness: 1.8 };
const arrowOpt = { ...base, strokeWidth: 2.4, roughness: 0.9 };

function toSvg(d) {
  const o = d.options;
  return d.sets.map(set => {
    const path = gen.opsToPath(set);
    if (set.type === 'fillPath')   return `<path d="${path}" fill="${o.fill}" stroke="none"/>`;
    if (set.type === 'fillSketch') { const w = o.fillWeight > 0 ? o.fillWeight : o.strokeWidth / 2; return `<path d="${path}" stroke="${o.fill}" stroke-width="${w}" fill="none"/>`; }
    return `<path d="${path}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const txt = (x, y, s, { size = 22, anchor = 'middle', weight = 'normal', fill = INK, font = SERIF } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-family="${font}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;

function rrPath(x, y, w, h, r) {
  return `M${x + r},${y} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - 2 * r)} a${r},${r} 0 0 1 ${-r},${-r} v${-(h - 2 * r)} a${r},${r} 0 0 1 ${r},${-r} z`;
}

// 圆角盒子 + 标题/副标题（多行）
function box(x, y, w, h, { title, sub, fill = '#ffffff', hatch, stroke = INK, titleColor = INK, titleSize = 23 } = {}) {
  const opt = hatch
    ? { ...base, stroke, fill, fillStyle: 'hachure', fillWeight: 1.5, hachureGap: 7, hachureAngle: hatch, roughness: 1.3 }
    : { ...base, stroke, fill, fillStyle: 'solid', roughness: 1.3 };
  const parts = [toSvg(gen.path(rrPath(x, y, w, h, 12), opt))];
  const cx = x + w / 2;
  if (sub) {
    parts.push(txt(cx, y + h / 2 - 6, title, { size: titleSize, weight: '700', fill: titleColor }));
    parts.push(txt(cx, y + h / 2 + 22, sub, { size: 16, fill: MUTED }));
  } else {
    parts.push(txt(cx, y + h / 2 + 8, title, { size: titleSize, weight: '700', fill: titleColor }));
  }
  return parts.join('');
}

function arrow(x1, y1, x2, y2, { o = arrowOpt, head = 15, curve } = {}) {
  const pts = curve || [[x1, y1], [x2, y2]];
  const out = [toSvg(gen.curve(pts, o))];
  const [px, py] = pts[pts.length - 2], [tx, ty] = pts[pts.length - 1];
  const a = Math.atan2(ty - py, tx - px);
  out.push(toSvg(gen.line(tx, ty, tx - head * Math.cos(a - 0.45), ty - head * Math.sin(a - 0.45), o)));
  out.push(toSvg(gen.line(tx, ty, tx - head * Math.cos(a + 0.45), ty - head * Math.sin(a + 0.45), o)));
  return out.join('');
}

// 圆柱（数据库/文献库）
function cylinder(cx, topY, w, h, { title, sub } = {}) {
  const x = cx - w / 2, ry = 12;
  const opt = { ...base, fill: '#eef0e8', fillStyle: 'solid', roughness: 1.2 };
  const body = gen.path(
    `M${x},${topY} v${h} a${w / 2},${ry} 0 0 0 ${w},0 v${-h} a${w / 2},${ry} 0 0 0 ${-w},0 a${w / 2},${ry} 0 0 0 ${w},0`,
    opt);
  const lid = gen.ellipse(cx, topY, w, ry * 2, { ...base, fill: '#f6f7f1', fillStyle: 'solid', roughness: 1.2 });
  const parts = [toSvg(body), toSvg(lid)];
  if (title) parts.push(txt(cx, topY + h / 2 + 2, title, { size: 19, weight: '700', fill: TEAL }));
  if (sub) parts.push(txt(cx, topY + h / 2 + 26, sub, { size: 14, fill: MUTED }));
  return parts.join('');
}

const wrap = (w, h, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="hd"><rect width="${w}" height="${h}" fill="#fffdf8"/>${inner}</svg>`;

// ============================================================
// 图 1：网页 AI（一问一答） vs CLI Agent
// ============================================================
export function diagCompare() {
  const W = 1080, H = 520, p = [];
  const midX = W / 2;
  // 分隔
  p.push(toSvg(gen.line(midX, 70, midX, H - 30, { ...thin, strokeWidth: 1.4 })));
  p.push(txt(W / 4, 46, '网页 AI · 一问一答', { size: 24, weight: '700', font: HAND, fill: MUTED }));
  p.push(txt(W * 3 / 4, 46, 'CLI Agent · 会动手', { size: 24, weight: '700', font: HAND, fill: ACCENT }));

  // —— 左侧：你 ⇄ 聊天框，文档在旁边断开 ——
  p.push(box(60, 120, 150, 70, { title: '你', sub: '复制 / 粘贴' }));
  p.push(box(300, 120, 170, 70, { title: '聊天框', sub: '聊长了会失忆' }));
  p.push(arrow(212, 145, 298, 145));
  p.push(arrow(298, 168, 212, 168));
  // 断开的文档
  p.push(box(150, 270, 230, 64, { title: '本地文档 / 图片', fill: '#f1efe8', hatch: 20, titleColor: MUTED, titleSize: 18 }));
  p.push(txt(265, 372, '✕ AI 碰不到，全靠你搬', { size: 16, fill: ACCENT }));
  p.push(toSvg(gen.line(330, 200, 300, 268, { ...thin, stroke: '#c9c4b5' })));
  p.push(toSvg(gen.line(300, 240, 360, 230, { ...thin, stroke: ACCENT })));
  p.push(toSvg(gen.line(360, 230, 300, 252, { ...thin, stroke: ACCENT })));
  p.push(txt(W / 4, 460, '你是搬运工', { size: 22, weight: '700', font: HAND, fill: INK }));

  // —— 右侧：你 → 一句话 → Agent → 直接读写项目 ——
  const ox = midX;
  p.push(box(ox + 30, 120, 130, 64, { title: '你', sub: '一句话' }));
  p.push(box(ox + 210, 120, 160, 64, { title: 'Agent', titleColor: ACCENT }));
  p.push(arrow(ox + 162, 152, ox + 208, 152));
  // 项目文件夹
  p.push(box(ox + 200, 230, 180, 64, { title: '项目文件夹', sub: '文档 · 图片 · 产出' }));
  p.push(arrow(ox + 290, 186, ox + 290, 228));
  p.push(txt(ox + 410, 262, '直接读写', { size: 15, fill: TEAL }));
  // skill / memory 挂件
  p.push(box(ox + 30, 230, 130, 56, { title: 'skill', sub: '可复用', fill: '#eaf1f2', hatch: -30, titleColor: TEAL, titleSize: 18 }));
  p.push(box(ox + 30, 320, 130, 56, { title: 'memory', sub: '会记住', fill: '#eaf1f2', hatch: 30, titleColor: TEAL, titleSize: 18 }));
  p.push(arrow(ox + 162, 258, ox + 208, 200, { curve: [[ox + 162, 258], [ox + 195, 240], [ox + 215, 200]] }));
  p.push(arrow(ox + 162, 348, ox + 240, 296, { curve: [[ox + 162, 348], [ox + 210, 330], [ox + 250, 296]] }));
  p.push(txt(W * 3 / 4, 460, '它替你动手', { size: 22, weight: '700', font: HAND, fill: ACCENT }));

  return wrap(W, H, p.join(''));
}

// ============================================================
// 图 2：联动的 skill 流水线（核心图）
// ============================================================
export function diagPipeline() {
  const W = 1080, H = 560, p = [];
  p.push(txt(W / 2, 44, '三个 skill 接力，共用同一个文献库', { size: 24, weight: '700', font: HAND, fill: INK }));

  const boxes = [
    { x: 60,  title: '① 文献阅读归档', sub: '读专著 / 论文，结构化存档', hatch: -35 },
    { x: 410, title: '② 准确性审查', sub: '拿文献校对你的稿子', hatch: 0 },
    { x: 760, title: '③ 新见解 / 新方向', sub: '文献 + 世界知识，提选题', hatch: 35 },
  ];
  const bw = 260, by = 90, bh = 92;
  boxes.forEach((b, i) => {
    p.push(box(b.x, by, bw, bh, { title: b.title, sub: b.sub, fill: '#fbf6ee', hatch: b.hatch, titleSize: 21, titleColor: ACCENT }));
    if (i < boxes.length - 1) p.push(arrow(b.x + bw + 6, by + bh / 2, boxes[i + 1].x - 6, by + bh / 2));
  });

  // 共享文献库
  const cylCx = 360, cylTop = 330;
  p.push(cylinder(cylCx, cylTop, 280, 90, { title: '我的皮肤科文献库', sub: '一次建立，长期复用' }));

  // ① 写入库
  p.push(arrow(190, by + bh + 4, 300, cylTop + 6, { curve: [[190, by + bh + 4], [230, 280], [300, cylTop + 6]] }));
  p.push(txt(210, 300, '写入', { size: 15, fill: TEAL, anchor: 'start' }));
  // ② 读库
  p.push(arrow(440, cylTop + 70, 500, by + bh + 4, { curve: [[440, cylTop + 70], [470, 290], [500, by + bh + 4]] }));
  // ③ 读库
  p.push(arrow(490, cylTop + 40, 840, by + bh + 4, { curve: [[490, cylTop + 40], [700, 300], [840, by + bh + 4]] }));
  p.push(txt(660, 300, '读取', { size: 15, fill: TEAL }));

  // ② 指向待审稿件
  p.push(box(700, 350, 300, 70, { title: '《寻常痤疮的临床鉴别诊断》', sub: '你正在写的稿子', fill: '#f1efe8', hatch: 20, titleSize: 17, titleColor: INK }));
  p.push(arrow(540, by + bh + 30, 760, 352, { curve: [[540, by + bh + 30], [640, 260], [760, 352]] }));
  p.push(txt(905, 470, '校对 → 标红存疑', { size: 16, fill: ACCENT }));

  return wrap(W, H, p.join(''));
}

// ============================================================
// 图 3：最佳流程四步
// ============================================================
export function diagFlow() {
  const W = 1080, H = 230, p = [];
  const steps = [
    { t: '1  请进电脑', s: '装好 CLI agent' },
    { t: '2  开个项目', s: '给它一块工作台' },
    { t: '3  固化 skill', s: '把"怎么做"写一次' },
    { t: '4  跑长活', s: '一句话反复调用' },
  ];
  const bw = 220, gap = 30, by = 70, bh = 86;
  const totalW = steps.length * bw + (steps.length - 1) * gap;
  let x = (W - totalW) / 2;
  steps.forEach((s, i) => {
    p.push(box(x, by, bw, bh, { title: s.t, sub: s.s, fill: '#eaf1f2', hatch: i % 2 ? 30 : -30, titleColor: TEAL, titleSize: 21 }));
    if (i < steps.length - 1) p.push(arrow(x + bw + 2, by + bh / 2, x + bw + gap - 2, by + bh / 2));
    x += bw + gap;
  });
  return wrap(W, H, p.join(''));
}

// ============================================================
// 图 4：好习惯——分类命名 + 版本可恢复
// ============================================================
export function diagHabits() {
  const W = 1080, H = 560, p = [];

  // —— 上半：一股脑堆 vs 分类命名 ——
  p.push(txt(W / 2, 40, '别一股脑堆一个文件夹', { size: 24, weight: '700', font: HAND, fill: INK }));

  // 左：乱堆
  p.push(box(70, 70, 330, 200, { title: '', fill: '#f1efe8', hatch: 20 }));
  p.push(txt(235, 100, '一个文件夹全堆一起', { size: 19, weight: '700', fill: MUTED }));
  const msgY = 130;
  for (let i = 0; i < 5; i++) {
    const w = 120 + (i * 37 % 150);
    p.push(toSvg(gen.line(110, msgY + i * 24, 110 + w, msgY + i * 24, { ...thin, stroke: '#c2bdae' })));
  }
  p.push(txt(235, 258, '✕ AI 翻半天，容易拿错', { size: 15, fill: ACCENT }));

  // 箭头
  p.push(arrow(410, 170, 466, 170));
  p.push(txt(438, 150, '分好类', { size: 14, fill: TEAL }));
  p.push(txt(438, 200, '起好名', { size: 14, fill: TEAL }));

  // 右：分类树
  p.push(box(480, 60, 540, 230, { title: '', fill: '#fbf6ee' }));
  const tree = [
    ['痤疮研究/', '', '700', ACCENT],
    ['├ 文献/', '放原始论文、专著', 'normal', INK],
    ['├ 稿件/', '正在写的文档', 'normal', INK],
    ['├ 产出/', 'agent 生成的结果', 'normal', INK],
    ['└ 图片/', '配图素材', 'normal', INK],
  ];
  tree.forEach((r, i) => {
    const y = 100 + i * 38;
    p.push(txt(510, y, r[0], { size: 19, anchor: 'start', weight: r[2], fill: r[3], font: SERIF }));
    if (r[1]) p.push(txt(720, y, r[1], { size: 15, anchor: 'start', fill: MUTED }));
  });
  p.push(txt(560, 280, '命名见名知意 → agent 一读就懂', { size: 15, anchor: 'start', fill: TEAL }));

  // —— 下半：版本控制 ——
  p.push(toSvg(gen.line(70, 340, W - 60, 340, { ...thin, strokeWidth: 1.3, stroke: '#d8d2c2' })));
  p.push(txt(W / 2, 380, '保留版本：覆盖了也能回去', { size: 24, weight: '700', font: HAND, fill: INK }));

  const vs = [
    { x: 110, t: 'v1', s: '初稿' },
    { x: 410, t: 'v2', s: '审查改过' },
    { x: 710, t: 'v3', s: '当前', accent: true },
  ];
  const vbw = 200, vby = 420, vbh = 80;
  vs.forEach((v, i) => {
    p.push(box(v.x, vby, vbw, vbh, {
      title: v.t, sub: v.s,
      fill: v.accent ? '#eaf1f2' : '#ffffff',
      hatch: v.accent ? -30 : undefined,
      titleColor: v.accent ? TEAL : INK,
    }));
    if (i < vs.length - 1) p.push(arrow(v.x + vbw + 2, vby + vbh / 2, vs[i + 1].x - 2, vby + vbh / 2));
  });
  // 恢复弧线 v3 -> v1
  p.push(arrow(810, vby + vbh + 6, 210, vby + vbh + 6, {
    o: { ...arrowOpt, stroke: ACCENT },
    curve: [[810, vby + vbh + 6], [620, 545], [410, 548], [210, vby + vbh + 6]],
  }));
  p.push(txt(510, 542, '随时恢复任意版本', { size: 16, fill: ACCENT }));

  return wrap(W, H, p.join(''));
}

// ============================================================
// 封面（1175x500）——标题图片化
// ============================================================
export function diagCover() {
  const W = 1175, H = 500, p = [];
  // 印章
  p.push(toSvg(gen.rectangle(80, 70, 240, 50, { ...base, stroke: ACCENT, roughness: 1.4 })));
  p.push(txt(200, 102, 'CLI agent 日常实战', { size: 21, weight: '700', fill: ACCENT }));
  // 主标题
  p.push(txt(W / 2, 250, '让 agent 替你干长活', { size: 72, weight: '800', fill: INK }));
  // 手绘下划线
  p.push(toSvg(gen.line(330, 285, 845, 285, { ...base, stroke: ACCENT, strokeWidth: 4, roughness: 2.2 })));
  // 副标题
  p.push(txt(W / 2, 345, '长任务，从"一问一答"升级成"有人替你动手、还会积累"', { size: 26, fill: MUTED }));
  p.push(txt(W / 2, 392, '—— 它早已不是程序员的专属', { size: 22, fill: TEAL, font: HAND, weight: '700' }));
  // 角落涂鸦箭头
  p.push(arrow(950, 430, 1040, 360, { o: { ...arrowOpt, stroke: ACCENT }, curve: [[950, 430], [1000, 400], [1040, 360]] }));
  return wrap(W, H, p.join(''));
}

// ============================================================
// 图：能力对比表（手绘）
// ============================================================
export function diagTable() {
  const W = 1080, H = 540, p = [];
  p.push(txt(W / 2, 44, 'agent 比一问一答多了什么', { size: 24, weight: '700', font: HAND, fill: INK }));

  const x0 = 40, tableW = 1000, c1 = 170, c2 = 415; // 列宽
  const top = 78, headH = 56, rowH = 70;
  const rows = [
    ['碰文件', '手动复制进、粘出来', '直接读写本地文件'],
    ['干长活', '每条目重开一轮', '一句话跑完十几条'],
    ['统一格式', '每次重新交代排版', '写一次 skill 永久复用'],
    ['记得住', '聊长了失忆、被截断', 'memory 跨会话续接'],
    ['会积累', '每次从零开始', '资料 / 产出沉淀成库'],
  ];
  const tableH = headH + rows.length * rowH;
  // 外框 + 表头底色
  p.push(toSvg(gen.rectangle(x0, top, tableW, tableH, { ...base, roughness: 1.1 })));
  p.push(toSvg(gen.rectangle(x0, top, tableW, headH, { ...base, fill: '#f6f3ea', fillStyle: 'solid', roughness: 1.1 })));
  // 竖线
  const v1 = x0 + c1, v2 = x0 + c1 + c2;
  p.push(toSvg(gen.line(v1, top, v1, top + tableH, thin)));
  p.push(toSvg(gen.line(v2, top, v2, top + tableH, thin)));
  // 表头
  const hy = top + headH / 2 + 8;
  p.push(txt(x0 + c1 / 2, hy, '能力', { size: 20, weight: '700' }));
  p.push(txt(v1 + c2 / 2, hy, '网页 AI · 一问一答', { size: 20, weight: '700', fill: MUTED }));
  p.push(txt(v2 + (tableW - c1 - c2) / 2, hy, 'CLI Agent', { size: 20, weight: '700', fill: ACCENT }));
  // 行
  rows.forEach((r, i) => {
    const ry = top + headH + i * rowH;
    if (i > 0) p.push(toSvg(gen.line(x0, ry, x0 + tableW, ry, { ...thin, stroke: '#d8d2c2' })));
    const ty = ry + rowH / 2 + 7;
    p.push(txt(x0 + c1 / 2, ty, r[0], { size: 19, weight: '700' }));
    p.push(txt(v1 + 36, ty, '✕ ' + r[1], { size: 18, anchor: 'start', fill: '#7a756c' }));
    p.push(txt(v2 + 36, ty, '✓ ' + r[2], { size: 18, anchor: 'start', fill: TEAL }));
  });
  return wrap(W, H, p.join(''));
}

// ============================================================
// 图：以 DeepCode CLI 为例 · 三步上手（手绘终端卡）
// ============================================================
export function diagDeepcode() {
  const W = 1080, H = 560, p = [];
  const MONO = "'Cascadia Mono','JetBrains Mono','Noto Sans SC',monospace";
  p.push(txt(W / 2, 44, '以 DeepCode CLI 为例 · 三步上手', { size: 24, weight: '700', font: HAND, fill: INK }));

  // 终端窗口
  const x = 90, y = 78, w = 900, h = 410, bar = 42;
  p.push(toSvg(gen.path(rrPath(x, y, w, h, 14), { ...base, fill: '#fbfaf5', fillStyle: 'solid', roughness: 1.1 })));
  p.push(toSvg(gen.line(x, y + bar, x + w, y + bar, { ...thin, stroke: '#d8d2c2' })));
  ['#cf6b5c', '#d9b25a', '#8fae73'].forEach((c, i) =>
    p.push(toSvg(gen.circle(x + 30 + i * 26, y + bar / 2, 13, { ...thin, stroke: INK, fill: c, fillStyle: 'solid' }))));
  p.push(txt(x + 140, y + bar / 2 + 6, 'terminal', { size: 16, anchor: 'start', fill: MUTED, font: MONO }));

  const lx = x + 30;
  const line = (yy, s, { c = INK, size = 19, prompt = false } = {}) => {
    if (prompt) p.push(txt(lx, yy, '$', { size, anchor: 'start', fill: TEAL, weight: '700', font: MONO }));
    p.push(txt(lx + (prompt ? 26 : 0), yy, s, { size, anchor: 'start', fill: c, font: MONO }));
  };
  let yy = y + bar + 44;
  line(yy, '# 1. 安装（装一次，全局可用 · 需 Node.js 18+）', { c: MUTED, size: 17 }); yy += 40;
  line(yy, 'npm install -g @vegamo/deepcode-cli', { prompt: true }); yy += 56;
  line(yy, '# 2. 配置 DeepSeek API Key', { c: MUTED, size: 17 }); yy += 38;
  line(yy, '编辑 ~/.deepcode/settings.json，填入 API_KEY', { c: INK, size: 17 }); yy += 56;
  line(yy, '# 3. 进入项目文件夹，启动它', { c: MUTED, size: 17 }); yy += 40;
  line(yy, 'cd 我的项目', { prompt: true }); yy += 38;
  line(yy, 'deepcode', { prompt: true, c: ACCENT });
  p.push(txt(lx + 200, yy, '← 打开就能对话', { size: 17, anchor: 'start', fill: ACCENT, font: SERIF }));

  p.push(txt(W / 2, 528, 'API Key 在 DeepSeek 开放平台领取 · 配好后每次只需进项目敲 deepcode', { size: 16, fill: MUTED }));
  return wrap(W, H, p.join(''));
}

// ============================================================
// 图：用 VS Code 一眼看改动（手绘仿 IDE 界面）
// ============================================================
export function diagVscode() {
  const W = 1080, H = 660, p = [];
  const MONO = "'Cascadia Mono','JetBrains Mono','Noto Sans SC',monospace";
  const YELLOW = '#c79a3a', GREEN = '#6a9a5a';
  p.push(txt(W / 2, 42, '用 VS Code：看改动、管版本、跑 agent，一个窗口搞定', { size: 23, weight: '700', font: HAND, fill: INK }));

  // 窗口外框
  const wx = 40, wy = 70, ww = 1000, wh = 500, tb = 32;
  p.push(toSvg(gen.path(rrPath(wx, wy, ww, wh, 12), { ...base, fill: '#fbfaf5', fillStyle: 'solid', roughness: 1 })));
  p.push(toSvg(gen.line(wx, wy + tb, wx + ww, wy + tb, { ...thin, stroke: '#d8d2c2' })));
  p.push(txt(wx + ww / 2, wy + 21, 'wechat-mp-automated-publisher — VS Code', { size: 14, fill: MUTED, font: MONO }));

  const top = wy + tb;
  // 活动栏（左窄条）
  const abx = wx, abw = 34;
  p.push(toSvg(gen.rectangle(abx, top, abw, wh - tb, { ...thin, stroke: '#d8d2c2', fill: '#efece3', fillStyle: 'solid' })));
  const icons = ['files', 'git', 'ext', 'run'];
  icons.forEach((ic, i) => {
    const iy = top + 24 + i * 38;
    p.push(toSvg(gen.rectangle(abx + 8, iy, 18, 18, { ...thin, stroke: ic === 'git' ? ACCENT : '#9a958a' })));
  });

  // 资源管理器
  const ex = abx + abw, exw = 250;
  p.push(toSvg(gen.line(ex + exw, top, ex + exw, wy + wh, { ...thin, stroke: '#d8d2c2' })));
  p.push(txt(ex + 14, top + 26, 'EXPLORER', { size: 13, anchor: 'start', fill: MUTED, font: MONO }));
  const files = [
    ['📁 .claude', null, 0],
    ['settings.json', 'M', 1],
    ['📁 docs', null, 0],
    ['ROUGHJS…md', 'U', 1],
    ['📁 output', null, 0],
    ['article.html', 'U', 1],
    ['📁 skill / output', null, 0],
    ['essay.html', 'M', 1],
  ];
  files.forEach((f, i) => {
    const fy = top + 56 + i * 30;
    const fx = ex + 16 + f[2] * 18;
    const mark = f[1];
    const color = mark === 'M' ? YELLOW : mark === 'U' ? GREEN : INK;
    p.push(txt(fx, fy, f[0].replace('📁 ', ''), { size: 14.5, anchor: 'start', fill: color, weight: mark ? '700' : 'normal', font: SERIF }));
    if (mark) p.push(txt(ex + exw - 18, fy, mark, { size: 14.5, anchor: 'middle', fill: color, weight: '700', font: MONO }));
  });

  // 编辑器
  const edx = ex + exw, edw = 360, edTop = top;
  // 标签
  p.push(toSvg(gen.line(edx, edTop + 30, edx + edw, edTop + 30, { ...thin, stroke: '#d8d2c2' })));
  p.push(txt(edx + 16, edTop + 20, 'ROUGHJS_HANDDRAWN.md', { size: 13, anchor: 'start', fill: INK, font: MONO }));
  // 代码行（含 diff 高亮）
  const codeTop = edTop + 50, lh = 24, gut = edx + 14, codeX = edx + 44;
  const lines = [
    ['43', '## 优势', null],
    ['44', '', null],
    ['45', '逻辑/数值 100% 正确', 'add'],
    ['46', '确定性、可复现', 'add'],
    ['47', '旧：观感死板', 'del'],
    ['48', '零成本、可离线', null],
    ['49', '手绘观感但不死板', null],
    ['50', '', null],
    ['51', '## 方法', null],
  ];
  lines.forEach((ln, i) => {
    const y = codeTop + i * lh;
    if (ln[2] === 'add') p.push(toSvg(gen.rectangle(edx + 32, y - 16, edw - 36, lh, { stroke: 'none', fill: '#e3efdd', fillStyle: 'solid', roughness: 0.6 })));
    if (ln[2] === 'del') p.push(toSvg(gen.rectangle(edx + 32, y - 16, edw - 36, lh, { stroke: 'none', fill: '#f5dcd6', fillStyle: 'solid', roughness: 0.6 })));
    p.push(txt(gut, y, ln[0], { size: 12.5, anchor: 'start', fill: '#b9b3a4', font: MONO }));
    const sign = ln[2] === 'add' ? '+ ' : ln[2] === 'del' ? '- ' : '';
    const c = ln[2] === 'add' ? GREEN : ln[2] === 'del' ? ACCENT : '#4a4a44';
    if (ln[1]) p.push(txt(codeX, y, sign + ln[1], { size: 13.5, anchor: 'start', fill: c, font: SERIF }));
  });
  // 终端
  const tmY = edTop + wh - tb - 96;
  p.push(toSvg(gen.rectangle(edx, tmY, edw, 96, { stroke: 'none', fill: '#2b2b28', fillStyle: 'solid', roughness: 0.6 })));
  p.push(txt(edx + 16, tmY + 22, 'TERMINAL', { size: 12, anchor: 'start', fill: '#cfcabd', font: MONO }));
  p.push(txt(edx + 16, tmY + 56, 'PS C:\\...\\publisher>', { size: 13, anchor: 'start', fill: '#9fd08a', font: MONO }));

  // agent 面板
  const apx = edx + edw, apw = wx + ww - apx;
  p.push(txt(apx + 16, top + 24, 'CLAUDE CODE', { size: 13, anchor: 'start', fill: ACCENT, weight: '700', font: MONO }));
  p.push(toSvg(gen.line(apx, top + 36, wx + ww, top + 36, { ...thin, stroke: '#d8d2c2' })));
  const chat = ['好的，本次改动：', '· settings.json 加了权限', '· 新增 article.html', '· essay.html 更新文案', '都已帮你存为一个版本。'];
  chat.forEach((c, i) => p.push(txt(apx + 16, top + 66 + i * 28, c, { size: 14, anchor: 'start', fill: '#4a4a44', font: SERIF })));
  // 用户输入框
  const ibY = top + wh - tb - 70;
  p.push(toSvg(gen.path(rrPath(apx + 12, ibY, apw - 28, 50, 8), { ...thin, stroke: ACCENT })));
  p.push(txt(apx + 26, ibY + 31, '把这次改动讲给我听', { size: 14, anchor: 'start', fill: MUTED, font: SERIF }));

  // 数字徽标
  const badge = (x, y, n) => {
    p.push(toSvg(gen.circle(x, y, 30, { ...base, stroke: ACCENT, fill: '#fff', fillStyle: 'solid', roughness: 1 })));
    p.push(txt(x, y + 6, String(n), { size: 17, weight: '800', fill: ACCENT, font: SERIF }));
  };
  badge(ex + exw - 18, top + 56 + 30, 1);            // 资源管理器改动标记
  badge(abx + 17, top + 24 + 38 + 9, 2);             // git 图标
  badge(wx + ww - 24, top + 22, 3);                  // agent 面板（右上角）
  badge(edx + edw - 26, tmY + 22, 4);                // 终端（右侧）

  // 图例
  const leg = [
    ['①', '改动一眼可见：黄=改过(M)，绿=新增(U)'],
    ['②', 'Git 面板：看历史、一键回退任意版本'],
    ['③', '同一个窗口里直接跟 agent 对话'],
    ['④', '要敲命令？内置终端就在下面'],
  ];
  leg.forEach((l, i) => {
    const lx = i % 2 ? W / 2 + 20 : 70, ly = 600 + Math.floor(i / 2) * 32;
    p.push(txt(lx, ly, l[0], { size: 18, anchor: 'start', fill: ACCENT, weight: '800' }));
    p.push(txt(lx + 30, ly, l[1], { size: 16, anchor: 'start', fill: '#4a4a44' }));
  });

  return wrap(W, H, p.join(''));
}

export const ALL = { cover: diagCover, compare: diagCompare, table: diagTable, flow: diagFlow, deepcode: diagDeepcode, habits: diagHabits, vscode: diagVscode, pipeline: diagPipeline };
