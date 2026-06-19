// 规则示意图程序化生成器（rough.js 手绘风 + sharp 转 PNG）
//
// 用途：交通规则 / 逻辑类示意图——这类图需要"规则推理"，扩散模型（agy/nano banana）
//       画不对（会回退到"车贴车""靠右行驶"等训练先验）。改用程序化坐标确定性生成，
//       逻辑 100% 正确，且 rough.js 笔触与 agy 的手绘 doodle 同属一路，风格统一。
//       详见 wechat-studio SKILL.md《图像生成双轨策略》。
//
// 用法：
//   node .claude/skills/wechat-studio/scripts/rule-diagram.mjs [scene...] [--out=<dir>]
//   不传 scene = 生成全部；--out 默认 skill/output/images
// 例：
//   node .claude/skills/wechat-studio/scripts/rule-diagram.mjs                 # 全部
//   node .claude/skills/wechat-studio/scripts/rule-diagram.mjs gap roundabout  # 指定
//
// 约定：俯视示意；澳洲靠左行驶、右舵、环岛顺时针。新增规则图 → 在 SCENES 里加一个场景函数。

import rough from 'roughjs';
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const gen = rough.generator();
const INK = '#1a1a1a';
const base = { stroke: INK, strokeWidth: 2.4, roughness: 1.5, bowing: 1.2, seed: 7 };
const thin = { ...base, strokeWidth: 1.6, roughness: 1.8 };
const carOpt = { ...base, strokeWidth: 2.2, roughness: 1.1, fill: '#ffffff', fillStyle: 'solid' };
const arrowOpt = { ...base, strokeWidth: 2.8, roughness: 1.0 };

// ---- drawable -> svg ----
function toSvg(d) {
  const o = d.options;
  return d.sets.map(set => {
    const path = gen.opsToPath(set);
    if (set.type === 'fillPath')   return `<path d="${path}" fill="${o.fill}" stroke="none"/>`;
    if (set.type === 'fillSketch') { const w = o.fillWeight > 0 ? o.fillWeight : o.strokeWidth / 2; return `<path d="${path}" stroke="${o.fill}" stroke-width="${w}" fill="none"/>`; }
    return `<path d="${path}" stroke="${o.stroke}" stroke-width="${o.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join('');
}
let S = [];
const add = (...ds) => ds.forEach(d => S.push(toSvg(d)));

// ---- shapes ----
const line = (x1, y1, x2, y2, o = base) => gen.line(x1, y1, x2, y2, o);
const dash = (x1, y1, x2, y2, seg = 26, gap = 20) => {
  const out = []; const dx = x2 - x1, dy = y2 - y1; const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len; let t = 0;
  while (t < len) { const e = Math.min(t + seg, len); out.push(line(x1 + ux * t, y1 + uy * t, x1 + ux * e, y1 + uy * e, thin)); t = e + gap; }
  return out;
};
function rrPath(x, y, w, h, r) {
  return `M${x + r},${y} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - 2 * r)} a${r},${r} 0 0 1 ${-r},${-r} v${-(h - 2 * r)} a${r},${r} 0 0 1 ${r},${-r} z`;
}
// top-down car. facing: 'up' | 'down' | 'left' | 'right' (= direction of travel / where the front points)
function car(cx, cy, facing = 'up', L = 78, W = 46) {
  const vert = facing === 'up' || facing === 'down';
  const boxW = vert ? W : L, boxH = vert ? L : W;
  const x = cx - boxW / 2, y = cy - boxH / 2;
  const body = gen.path(rrPath(x, y, boxW, boxH, 14), carOpt);
  let ws;
  if (facing === 'up')    ws = line(x + 6, y + 16, x + boxW - 6, y + 16, thin);
  if (facing === 'down')  ws = line(x + 6, y + boxH - 16, x + boxW - 6, y + boxH - 16, thin);
  if (facing === 'right') ws = line(x + boxW - 16, y + 6, x + boxW - 16, y + boxH - 6, thin);
  if (facing === 'left')  ws = line(x + 16, y + 6, x + 16, y + boxH - 6, thin);
  return [body, ws];
}
function arrow(points, o = arrowOpt, head = 17) {
  const out = [gen.curve(points, o)];
  const [px, py] = points[points.length - 2], [tx, ty] = points[points.length - 1];
  const a = Math.atan2(ty - py, tx - px);
  out.push(line(tx, ty, tx - head * Math.cos(a - 0.4), ty - head * Math.sin(a - 0.4), o));
  out.push(line(tx, ty, tx - head * Math.cos(a + 0.4), ty - head * Math.sin(a + 0.4), o));
  return out;
}
function burst(cx, cy, r = 26) {
  const out = []; const n = 9;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; const r2 = i % 2 ? r : r * 0.5; out.push(line(cx, cy, cx + r2 * Math.cos(a), cy + r2 * Math.sin(a), { ...thin, strokeWidth: 2 })); }
  return out;
}

// ============ 场景目录（每个返回 {w,h}）============
const SCENES = {
  // 支路汇入留空隙：双向道，澳洲靠左——上车道东行(右)、下车道西行(左)排队等左侧红灯并留出空隙，
  // 支路车自下而上、向左拐入空隙汇入西行车流（箭头拐弯）。
  gap() {
    const W = 1024, H = 683;
    const yTop = 235, yMid = 331, yBot = 427;
    add(line(40, yTop, 984, yTop), line(40, yBot, 984, yBot));
    add(...dash(40, yMid, 984, yMid));
    const yEast = (yTop + yMid) / 2, yWest = (yMid + yBot) / 2;
    [180, 430, 880].forEach(cx => add(...car(cx, yEast, 'right')));
    [120, 250, 380, /* gap */ 690, 820, 945].forEach(cx => add(...car(cx, yWest, 'left')));
    add(line(470, yBot, 470, 655), line(574, yBot, 574, 655));
    add(...car(512, 575, 'up'));
    add(...arrow([[512, 548], [512, 445], [495, 405], [445, yWest]]));
    add(gen.rectangle(44, yWest - 48, 38, 96, base));
    add(gen.circle(63, yWest - 24, 22, { ...base, fill: INK, fillStyle: 'solid' }));
    add(gen.circle(63, yWest, 21, thin));
    add(gen.circle(63, yWest + 22, 21, thin));
    return { w: W, h: H };
  },
  // 主动变道腾空间：双车道同向(向上)，变道车在路口下方/后方提前变到右道，腾出左道给支路汇入车。
  lane() {
    const W = 1024, H = 683;
    const L = 430, R = 690;
    add(line(L, 30, L, 653), line(R, 30, R, 653));
    add(...dash(560, 30, 560, 653));
    add(line(120, 378, L, 378), line(120, 478, L, 478));
    const jY = 430;
    add(...car(495, 600, 'up'));
    add(...arrow([[495, 568], [540, 520], [625, 470], [630, 410]]));
    add(...car(210, jY, 'right'));
    add(...arrow([[262, jY], [400, jY - 4], [482, jY - 30], [495, jY - 75]]));
    return { w: W, h: H };
  },
  // 环岛顺时针 + 入口犹豫险情：澳洲环岛顺时针通行，入口车犹豫、环内车来不及避让，险情星爆。
  roundabout() {
    const W = 1024, H = 683;
    const cx = 512, cy = 341, outer = 188, island = 74, rd = 56;
    add(line(cx - rd, 0, cx - rd, cy - outer + 30), line(cx + rd, 0, cx + rd, cy - outer + 30));
    add(line(cx - rd, H, cx - rd, cy + outer - 30), line(cx + rd, H, cx + rd, cy + outer - 30));
    add(line(0, cy - rd, cx - outer + 30, cy - rd), line(0, cy + rd, cx - outer + 30, cy + rd));
    add(line(W, cy - rd, cx + outer - 30, cy - rd), line(W, cy + rd, cx + outer - 30, cy + rd));
    add(gen.circle(cx, cy, outer * 2, base));
    add(gen.circle(cx, cy, island * 2, base));
    const r = (outer + island) / 2;
    add(gen.arc(cx, cy, r * 2, r * 2, -Math.PI * 0.85, Math.PI * 0.15, false, arrowOpt));
    const ea = Math.PI * 0.15, ex = cx + r * Math.cos(ea), ey = cy + r * Math.sin(ea), ta = ea + Math.PI / 2;
    add(line(ex, ey, ex - 17 * Math.cos(ta - 0.4), ey - 17 * Math.sin(ta - 0.4), arrowOpt));
    add(line(ex, ey, ex - 17 * Math.cos(ta + 0.4), ey - 17 * Math.sin(ta + 0.4), arrowOpt));
    add(...car(cx + r, cy - 6, 'down'));
    add(...car(cx + 6, cy + outer + 70, 'up'));
    add(...burst(cx + 30, cy + outer - 18));
    return { w: W, h: H };
  },
};

// ---- CLI ----
const argv = process.argv.slice(2);
const outArg = argv.find(a => a.startsWith('--out='));
const outDir = outArg ? outArg.replace('--out=', '') : 'skill/output/images';
const names = argv.filter(a => !a.startsWith('--'));
const todo = names.length ? names : Object.keys(SCENES);

mkdirSync(outDir, { recursive: true });
for (const name of todo) {
  const fn = SCENES[name];
  if (!fn) { console.error(`未知场景: ${name}（可选: ${Object.keys(SCENES).join(', ')}）`); process.exitCode = 1; continue; }
  S = [];
  const { w, h } = fn();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#ffffff"/>${S.join('')}</svg>`;
  writeFileSync(join(outDir, `${name}.svg`), svg);
  await sharp(Buffer.from(svg)).png().toFile(join(outDir, `${name}.png`));
  console.log('OK', join(outDir, `${name}.png`));
}
