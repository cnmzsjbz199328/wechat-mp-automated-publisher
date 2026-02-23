import { NewsItem } from '../types';

// ── Color tokens ──
const C = {
  bg: '#0d1117',
  border: '#21262d',
  textPri: '#e6edf3',
  textSec: '#8b949e',
  textMuted: '#484f58',
  accent: '#4e8ef7',
  accentDim: 'rgba(78,142,247,0.1)',
  accentBorder: 'rgba(78,142,247,0.3)',
};

// ── Section divider (no flex required) ──
function sectionLabel(text: string): string {
  return `
<p style="font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${C.textMuted};margin:0 0 4px;padding-bottom:10px;border-bottom:1px solid ${C.border};">${text}</p>`;
}

function sourceBadge(source: string): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:99px;background:${C.accentDim};border:1px solid ${C.accentBorder};font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.accent};">${source}</span>`;
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    const p = u.hostname + u.pathname.replace(/\/$/, '');
    return p.length > 50 ? p.slice(0, 48) + '…' : p;
  } catch { return url; }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

function heroCard(item: NewsItem): string {
  return `
<div style="margin-bottom:40px;">
  ${item.imageUrl ? `<img src="${item.imageUrl}" alt="" style="width:100%;display:block;border-radius:12px;margin-bottom:16px;"/>` : ''}
  <p style="margin:0 0 10px;">${sourceBadge(item.source || 'News')}</p>
  <h2 style="font-size:20px;font-weight:800;line-height:1.4;color:${C.textPri};margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;">${item.title}</h2>
  <p style="font-size:14px;line-height:1.8;color:${C.textSec};margin:0 0 10px;">${item.aiAbstract || item.description || ''}</p>
  <p style="margin:0;">
    <span style="font-size:10px;color:${C.textMuted};font-weight:500;">${formatDate(item.pubDate)}</span>
    ${item.link ? `&nbsp;&nbsp;<a href="${item.link}" style="font-size:10px;color:${C.textMuted};text-decoration:none;" target="_blank">${shortUrl(item.link)}</a>` : ''}
  </p>
</div>`;
}

function secondaryCard(item: NewsItem): string {
  return `
<div style="padding:24px 0;border-top:1px solid ${C.border};">
  ${item.imageUrl ? `<img src="${item.imageUrl}" alt="" style="width:100%;display:block;border-radius:8px;margin-bottom:14px;"/>` : ''}
  <p style="margin:0 0 8px;">
    <span style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C.textMuted};">${item.source || 'News'}</span>
    <span style="color:${C.textMuted};margin:0 5px;">·</span>
    <span style="font-size:9px;color:${C.textMuted};font-weight:500;">${formatDate(item.pubDate)}</span>
  </p>
  <h3 style="font-size:16px;font-weight:700;line-height:1.4;color:${C.textPri};margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;">${item.title}</h3>
  <p style="font-size:13px;line-height:1.75;color:${C.textSec};margin:0 0 8px;">${item.aiAbstract || item.description || ''}</p>
  ${item.link ? `<p style="margin:0;"><a href="${item.link}" style="font-size:10px;color:${C.textMuted};text-decoration:none;" target="_blank">${shortUrl(item.link)}</a></p>` : ''}
</div>`;
}

function vocabSection(aiSummary: string): string {
  const items = aiSummary
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.includes('|'))
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length < 4) return '';
      const [word, pos, def, example] = parts;
      const clean = example.replace(/^["""''']+|["""''']+$/g, '').trim();
      const highlighted = clean.replace(
        new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*)`, 'gi'),
        `<span style="color:${C.accent};font-style:normal;font-weight:700;">$1</span>`
      );
      return `
<div style="padding:18px 0;border-bottom:1px solid ${C.border};">
  <p style="margin:0 0 5px;">
    <span style="font-size:19px;font-weight:800;color:${C.textPri};font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">${word}</span>
    <span style="font-size:11px;color:${C.textMuted};font-weight:400;margin-left:8px;">${pos}. ${def}</span>
  </p>
  <p style="font-size:13px;line-height:1.75;color:${C.textSec};font-style:italic;margin:0;">"${highlighted}"</p>
</div>`;
    })
    .filter(Boolean)
    .join('');

  return items || `<p style="font-size:13px;color:${C.textMuted};font-style:italic;">AI 词汇正在生成中...</p>`;
}

export function generateArticleHtml(aiSummary: string, news: NewsItem[]): string {
  const [hero, ...rest] = news;
  const source = news[0]?.source || 'News';

  return `<div style="background:${C.bg};padding:32px 16px 48px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;">

${sectionLabel('Latest Reports')}

${hero ? heroCard(hero) : ''}

${rest.map(secondaryCard).join('')}

<div style="margin-top:48px;padding-top:32px;border-top:1px solid ${C.border};">
${sectionLabel('今日阅读难词汇总')}
<div style="border-top:1px solid ${C.border};">
${vocabSection(aiSummary)}
</div>
</div>

<p style="margin-top:40px;text-align:center;font-size:10px;color:${C.textMuted};line-height:1.8;">数据源: ${source}</p>

</div>`;
}
