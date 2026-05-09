#!/usr/bin/env node
// Usage: node .claude/skills/wechat-draft/scripts/generate-html.mjs --file skill/output/article.json
//   or:  node .claude/skills/wechat-draft/scripts/generate-html.mjs --input '{"news":[...],"vocab":"..."}'
//
// Input JSON shape:
//   { news: NewsItem[], vocab: string }
//
// NewsItem shape:
//   { title, pubDate, link?, source?, imageUrl?, description?,
//     aiTranslation?: { title: string, content: string } }

import { readFileSync } from 'fs';

const C = {
  text:   '#3a3a3a',
  muted:  '#888888',
  accent: '#2980b9',
  border: '#e5e5e5',
  bgCode: '#f5f7fa',
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return iso; }
}

function shortUrl(url) {
  try { const u = new URL(url); return u.hostname + u.pathname.replace(/\/$/, ''); }
  catch { return url; }
}

function divider(text) {
  return `<p style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${C.muted};margin:32px 0 18px;padding-bottom:8px;border-bottom:1px solid ${C.border};text-align:left;word-break:break-word;">${text}</p>`;
}

function meta(item) {
  return `<p style="font-size:13px;color:${C.muted};margin:6px 0 12px;line-height:1.6;text-align:left;word-break:break-word;"><span style="color:${C.accent};font-weight:600;">${item.source || 'News'}</span>&nbsp;&nbsp;·&nbsp;&nbsp;${formatDate(item.pubDate)}</p>`;
}

function heroCard(item) {
  const t = item.aiTranslation;
  return `
${item.imageUrl ? `<p style="margin:0 0 16px;"><img src="${item.imageUrl}" alt="" style="width:100%;display:block;border-radius:6px;"/></p>` : ''}
${meta(item)}
${t ? `
<p style="font-size:20px;font-weight:800;color:#1a1a1a;margin:0 0 12px;text-align:left;word-break:break-word;">${t.title}</p>
<p style="font-size:15px;line-height:1.85;color:${C.text};margin:0 0 16px;text-align:left;word-break:break-word;background:${C.bgCode};padding:12px;border-left:4px solid ${C.accent};border-radius:0 4px 4px 0;">${t.content}</p>
<p style="font-size:16px;font-weight:700;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;margin:0 0 8px;text-align:left;word-break:break-word;">${item.title}</p>
<p style="font-size:14px;color:${C.muted};line-height:1.7;margin:0 0 10px;text-align:left;word-break:break-word;">${item.description || ''}</p>
` : `
<p style="font-size:20px;font-weight:800;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;line-height:1.45;margin:0 0 12px;text-align:left;word-break:break-word;">${item.title}</p>
<p style="font-size:15px;line-height:1.85;color:${C.text};margin:0 0 10px;text-align:left;word-break:break-word;">${item.description || ''}</p>
`}
${item.link ? `<p style="margin:0 0 4px;font-size:12px;color:${C.muted};text-align:left;word-break:break-all;">${shortUrl(item.link)}</p>` : ''}`;
}

function secondaryCard(item) {
  const t = item.aiTranslation;
  return `
<p style="margin:22px 0 0;border-top:1px solid ${C.border};padding-top:22px;"></p>
${item.imageUrl ? `<p style="margin:0 0 14px;overflow:hidden;border-radius:6px;"><img src="${item.imageUrl}" alt="" style="width:100%;display:block;aspect-ratio:3/1;object-fit:cover;"/></p>` : ''}
${meta(item)}
${t ? `
<p style="font-size:17px;font-weight:700;color:#1a1a1a;margin:0 0 10px;text-align:left;word-break:break-word;">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:${C.text};margin:0 0 14px;text-align:left;word-break:break-word;background:${C.bgCode};padding:10px;border-left:3px solid ${C.accent};border-radius:0 4px 4px 0;">${t.content}</p>
<p style="font-size:15px;font-weight:600;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;margin:0 0 6px;text-align:left;word-break:break-word;">${item.title}</p>
<p style="font-size:13px;color:${C.muted};line-height:1.6;margin:0 0 8px;text-align:left;word-break:break-word;">${item.description || ''}</p>
` : `
<p style="font-size:17px;font-weight:700;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;line-height:1.45;margin:0 0 10px;text-align:left;word-break:break-word;">${item.title}</p>
<p style="font-size:14px;line-height:1.8;color:${C.text};margin:0 0 8px;text-align:left;word-break:break-word;">${item.description || ''}</p>
`}
${item.link ? `<p style="margin:0;font-size:12px;color:${C.muted};text-align:left;word-break:break-all;">${shortUrl(item.link)}</p>` : ''}`;
}

function vocabSection(vocab) {
  const rows = vocab.split('\n')
    .map(l => l.trim())
    .filter(l => l.includes('|'))
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length < 4) return '';
      const [word, pos, def, example] = parts;
      const ex = example.replace(/^["""''']+|["""''']+$/g, '').trim();
      const hi = ex.replace(
        new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*)`, 'gi'),
        `<strong style="color:${C.accent};font-style:normal;">$1</strong>`
      );
      return `
<p style="margin:20px 0 4px;text-align:left;word-break:break-word;">
  <span style="font-size:18px;font-weight:800;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">${word}</span>
  <span style="font-size:12px;color:${C.muted};margin-left:8px;">${pos}. ${def}</span>
</p>
<p style="font-size:13px;line-height:1.8;color:#666;font-style:italic;margin:4px 0 0;text-align:left;word-break:break-word;">${hi}</p>`;
    })
    .filter(Boolean)
    .join('');

  return rows || `<p style="font-size:14px;color:${C.muted};font-style:italic;text-align:left;">词汇正在生成中...</p>`;
}

function generateHtml(news, vocab) {
  const [hero, ...rest] = news;
  const source = news[0]?.source || 'News';
  return `<div style="font-family:Georgia,'SF Pro Text','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;color:${C.text};line-height:1.8;padding:8px 0;max-width:680px;margin:0 auto;background:#fff;text-align:left;word-break:break-word;">

${divider('Latest Reports')}

${hero ? heroCard(hero) : ''}

${rest.map(secondaryCard).join('')}

<p style="margin:40px 0 0;border-top:1px solid ${C.border};"></p>
${divider('今日阅读词汇')}

${vocabSection(vocab)}

<p style="margin-top:36px;text-align:center;font-size:11px;color:${C.muted};letter-spacing:0.04em;">数据源: ${source}</p>

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
  console.error('Usage: node generate-html.mjs --file <path.json>');
  console.error('  or:  node generate-html.mjs --input \'{"news":[...],"vocab":"..."}\'');
  process.exit(1);
}

const { news, vocab } = data;
if (!Array.isArray(news) || !news.length) {
  console.error('Input must have a non-empty "news" array.');
  process.exit(1);
}

process.stdout.write(generateHtml(news, vocab || ''));
