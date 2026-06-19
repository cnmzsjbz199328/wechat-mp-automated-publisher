#!/usr/bin/env node
// 个人感想文章 HTML 生成器（单作者图文，与 wechat-draft 的 news 布局分离）
// Usage:
//   node .claude/skills/wechat-essay/scripts/generate-essay-html.mjs --file skill/output/essay.json
//   node .claude/skills/wechat-essay/scripts/generate-essay-html.mjs --input '{"title":"...","sections":[...]}'
//
// Input JSON shape:
//   {
//     title:   string,          // 文章标题（也用作微信草稿标题）
//     author?: string,          // 署名，默认 "随笔"
//     lead?:   string,          // 题记 / 导语（可选，渲染为引导框）
//     sections: [
//       { heading?: string, paragraphs: string[], imageUrl?: string }
//     ]
//   }

import { readFileSync } from 'fs';

// 复用 wechat-draft/generate-html.mjs 的配色基调，保持视觉一致
const C = {
  text:   '#3a3a3a',
  muted:  '#888888',
  accent: '#2980b9',
  border: '#e5e5e5',
  bgCode: '#f5f7fa',
};

function esc(s) {
  return String(s ?? '');
}

function leadBlock(lead) {
  if (!lead) return '';
  return `<p style="font-size:15px;line-height:1.9;color:${C.text};margin:0 0 24px;text-align:left;word-break:break-word;background:${C.bgCode};padding:14px 16px;border-left:4px solid ${C.accent};border-radius:0 4px 4px 0;font-style:italic;">${esc(lead)}</p>`;
}

function sectionImage(url) {
  if (!url) return '';
  return `<p style="margin:6px 0 18px;"><img src="${esc(url)}" alt="" style="width:100%;display:block;border-radius:6px;"/></p>`;
}

function sectionHeading(h) {
  if (!h) return '';
  return `<p style="font-size:18px;font-weight:700;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;line-height:1.45;margin:30px 0 14px;text-align:left;word-break:break-word;">${esc(h)}</p>`;
}

function paragraph(p) {
  return `<p style="font-size:16px;line-height:1.9;color:${C.text};margin:0 0 18px;text-align:left;word-break:break-word;">${esc(p)}</p>`;
}

function renderSection(sec) {
  const heading = sectionHeading(sec.heading);
  const img     = sectionImage(sec.imageUrl);
  const paras   = (Array.isArray(sec.paragraphs) ? sec.paragraphs : [])
    .filter(Boolean).map(paragraph).join('');
  return heading + img + paras;
}

function generateHtml({ title, author, lead, sections }) {
  const by = author || '随笔';
  const secs = (Array.isArray(sections) ? sections : []).map(renderSection).join('');
  return `<div style="font-family:Georgia,'SF Pro Text','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;color:${C.text};line-height:1.9;padding:8px 0;max-width:680px;margin:0 auto;background:#fff;text-align:left;word-break:break-word;">

<p style="font-size:22px;font-weight:800;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;line-height:1.4;margin:0 0 6px;text-align:left;word-break:break-word;">${esc(title)}</p>
<p style="font-size:12px;color:${C.muted};letter-spacing:0.08em;margin:0 0 24px;text-align:left;">${esc(by)}</p>

${leadBlock(lead)}

${secs}

</div>`;
}

// ── main ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const get  = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };

let data;
const inputStr  = get('--input');
const inputFile = get('--file');

if (inputStr)  data = JSON.parse(inputStr);
else if (inputFile) data = JSON.parse(readFileSync(inputFile, 'utf8'));
else {
  console.error('Usage: node generate-essay-html.mjs --file <path.json>');
  console.error('  or:  node generate-essay-html.mjs --input \'{"title":"...","sections":[...]}\'');
  process.exit(1);
}

if (!data.title || !Array.isArray(data.sections) || !data.sections.length) {
  console.error('Input must have a "title" and a non-empty "sections" array.');
  process.exit(1);
}

process.stdout.write(generateHtml(data));
