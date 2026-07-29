// 手绘风条形图生成器（rough.js + sharp）——数据可视化轨（见 wechat-studio《图像生成双轨策略》）
//
// 用法: node .claude/skills/wechat-studio/scripts/bar-chart.mjs --file <specs.json> [--out=skill/output/images]
// specs.json: 图表数组，每项：
//   { out, title, orient:"h"|"v", w?, h?, data:[{label, value, tag?}], footnote? }
//   - orient h = 横向条（适合长中文类目）；v = 纵向条（适合时间序列）
//   - value 决定条长；tag 是条端/条顶显示的文字（如 "$672 · 45%"），缺省用 value
// 中文标签用 Microsoft YaHei 渲染（sharp/librsvg 走系统字体）。

import rough from 'roughjs';
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const gen = rough.generator();
const INK = '#1a1a1a';
const FONT = "Microsoft YaHei, 'Noto Sans CJK SC', sans-serif";
const axis = { stroke: INK, strokeWidth: 2.2, roughness: 1.3, bowing: 1 };
const barOpt = { stroke: INK, strokeWidth: 2, roughness: 1.4, bowing: 1.2, fill: '#9aa7b1', fillStyle: 'hachure', fillWeight: 1.6, hachureGap: 6, hachureAngle: -41 };

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
const polar = (cx, cy, r, deg) => { const a = deg * Math.PI / 180; return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }; };
const txt = (x, y, s, { size = 22, anchor = 'start', weight = 'normal', fill = INK } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-family="${FONT}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;

function renderChart(spec) {
  const w = spec.w || 1024, h = spec.h || 680;
  const data = spec.data;
  const maxV = Math.max(...data.map(d => d.value));
  const parts = [];
  parts.push(txt(w / 2, 50, spec.title, { size: 30, anchor: 'middle', weight: '700' }));

  if (spec.orient === 'pie') {
    const total = data.reduce((s, d) => s + d.value, 0);
    const topPad = 96, botPad = 48;
    const cx = w / 2, cy = topPad + (h - topPad - botPad) / 2;
    const r = Math.min(w * 0.21, (h - topPad - botPad) / 2 - 50);   // leave room for the label ring
    const fills = ['#8d9aa4', '#bcc6cd', '#a3aeb6', '#d6dde1', '#b0bbc3'];
    const hatch = [-41, 30, 78, -12, 55];
    let ang = -90;
    data.forEach((d, i) => {
      const frac = d.value / total, a0 = ang, a1 = ang + frac * 360; ang = a1;
      const p0 = polar(cx, cy, r, a0), p1 = polar(cx, cy, r, a1), large = (a1 - a0) > 180 ? 1 : 0;
      const wedge = `M${cx},${cy} L${p0.x},${p0.y} A${r},${r} 0 ${large} 1 ${p1.x},${p1.y} Z`;
      parts.push(toSvg(gen.path(wedge, { stroke: INK, strokeWidth: 2, roughness: 1.2, bowing: 0.7, fill: fills[i % fills.length], fillStyle: 'hachure', fillWeight: 1.6, hachureGap: 6, hachureAngle: hatch[i % hatch.length] })));
      const mid = (a0 + a1) / 2, c = Math.cos(mid * Math.PI / 180);
      const anchor = Math.abs(c) < 0.28 ? 'middle' : (c > 0 ? 'start' : 'end');
      const dx = anchor === 'middle' ? 0 : (anchor === 'start' ? 8 : -8);
      const e0 = polar(cx, cy, r, mid), lp = polar(cx, cy, r + 26, mid);
      parts.push(toSvg(gen.line(e0.x, e0.y, lp.x, lp.y, { stroke: '#888', strokeWidth: 1.4, roughness: 1 })));
      parts.push(txt(lp.x + dx, lp.y + 7, `${d.label}  ${d.tag ?? ''}`, { size: 21, anchor, weight: frac >= 0.2 ? '700' : 'normal' }));
    });
  } else if (spec.orient === 'v') {
    // vertical bars (time series)
    const padL = 60, padR = 40, padTop = 90, padBot = 78;
    const aw = w - padL - padR, ah = h - padTop - padBot, baseY = padTop + ah;
    parts.push(toSvg(gen.line(padL, baseY, w - padR, baseY, axis)));
    const n = data.length, slot = aw / n, bw = Math.min(slot * 0.6, 70);
    data.forEach((d, i) => {
      const cx = padL + slot * (i + 0.5), bh = (d.value / maxV) * ah;
      const x = cx - bw / 2, y = baseY - bh;
      parts.push(toSvg(gen.rectangle(x, y, bw, bh, barOpt)));
      parts.push(txt(cx, y - 12, d.tag ?? d.value, { size: 19, anchor: 'middle', weight: '700' }));
      parts.push(txt(cx, baseY + 30, d.label, { size: 20, anchor: 'middle' }));
    });
  } else {
    // horizontal bars (categories)
    const padL = Math.min(spec.labelW || 300, w * 0.34), padR = spec.padR || 150, padTop = 86, padBot = 40;
    const aw = w - padL - padR, ah = h - padTop - padBot;
    const n = data.length, slot = ah / n, bh = Math.min(slot * 0.6, 64);
    data.forEach((d, i) => {
      const cy = padTop + slot * (i + 0.5), y = cy - bh / 2;
      const bwid = Math.max((d.value / maxV) * aw, 2);
      parts.push(txt(padL - 16, cy + 7, d.label, { size: 21, anchor: 'end' }));
      parts.push(toSvg(gen.rectangle(padL, y, bwid, bh, barOpt)));
      parts.push(txt(padL + bwid + 12, cy + 7, d.tag ?? d.value, { size: 21, anchor: 'start', weight: '700' }));
    });
  }
  if (spec.footnote) parts.push(txt(w - 30, h - 16, spec.footnote, { size: 16, anchor: 'end', fill: '#888' }));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#ffffff"/>${parts.join('')}</svg>`;
}

// ---- CLI ----
const argv = process.argv.slice(2);
const fileArg = argv.find(a => a.startsWith('--file='))?.replace('--file=', '') || (() => { const i = argv.indexOf('--file'); return i >= 0 ? argv[i + 1] : null; })();
const outArg = argv.find(a => a.startsWith('--out='));
const outDir = outArg ? outArg.replace('--out=', '') : 'skill/output/images';
if (!fileArg) { console.error('Usage: node bar-chart.mjs --file <specs.json> [--out=dir]'); process.exit(1); }

const specs = JSON.parse(readFileSync(fileArg, 'utf8'));
mkdirSync(outDir, { recursive: true });
for (const spec of specs) {
  const svg = renderChart(spec);
  await sharp(Buffer.from(svg)).png().toFile(join(outDir, spec.out));
  console.log('OK', join(outDir, spec.out));
}
