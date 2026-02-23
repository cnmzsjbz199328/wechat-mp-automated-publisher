import { NewsItem } from '../types';

// ── Inline style tokens (mirrors preview.ts design for WeChat compatibility) ──
const C = {
  bg: '#0b0f15',
  surface: '#111720',
  border: '#1a2030',
  textPri: '#f0f2f5',
  textSec: '#7a8494',
  textMuted: '#3d4553',
  accent: '#4e8ef7',
  accentDim: 'rgba(78,142,247,0.12)',
  accentBorder: 'rgba(78,142,247,0.25)',
};

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    const p = u.hostname + u.pathname.replace(/\/$/, '');
    return p.length > 52 ? p.slice(0, 50) + '…' : p;
  } catch { return url; }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

function sourceBadge(source: string): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:99px;background:${C.accentDim};border:1px solid ${C.accentBorder};font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:${C.accent};margin-bottom:12px;">${source}</span>`;
}

function heroCard(item: NewsItem): string {
  return `
<div style="margin-bottom:48px;">
  ${item.imageUrl ? `
  <div style="width:100%;border-radius:14px;overflow:hidden;margin-bottom:20px;border:1px solid ${C.border};">
    <img src="${item.imageUrl}" alt="${item.title}" style="width:100%;display:block;object-fit:cover;aspect-ratio:16/9;"/>
  </div>` : ''}
  ${sourceBadge(item.source || 'News')}
  <h2 style="font-size:22px;font-weight:800;line-height:1.35;color:${C.textPri};margin:0 0 14px;font-family:Georgia,serif;">${item.title}</h2>
  <p style="font-size:14px;line-height:1.85;color:${C.textSec};margin:0;">${item.aiAbstract || item.description || ''}</p>
  <div style="margin-top:14px;display:flex;align-items:center;gap:10px;">
    <span style="font-size:10px;color:${C.textMuted};font-weight:500;white-space:nowrap;">${formatDate(item.pubDate)}</span>
    ${item.link ? `<a href="${item.link}" style="font-size:10px;color:${C.textMuted};text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;" target="_blank">${shortUrl(item.link)}</a>` : ''}
  </div>
</div>`;
}

function secondaryCard(item: NewsItem): string {
  return `
<div style="padding:28px 0;border-top:1px solid ${C.border};">
  ${item.imageUrl ? `
  <div style="width:100%;border-radius:10px;overflow:hidden;margin-bottom:16px;border:1px solid ${C.border};">
    <img src="${item.imageUrl}" alt="${item.title}" style="width:100%;display:block;object-fit:cover;aspect-ratio:3/1;"/>
  </div>` : ''}
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
    <span style="font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:${C.textMuted};">${item.source || 'News'}</span>
    <span style="width:3px;height:3px;border-radius:50%;background:${C.textMuted};opacity:0.4;display:inline-block;"></span>
    <span style="font-size:9px;color:${C.textMuted};font-weight:500;">${formatDate(item.pubDate)}</span>
  </div>
  <h3 style="font-size:17px;font-weight:700;line-height:1.4;color:${C.textPri};margin:0 0 10px;font-family:Georgia,serif;">${item.title}</h3>
  <p style="font-size:13px;line-height:1.8;color:${C.textSec};margin:0;">${item.aiAbstract || item.description || ''}</p>
  ${item.link ? `<a href="${item.link}" style="display:block;margin-top:10px;font-size:10px;color:${C.textMuted};text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" target="_blank">${shortUrl(item.link)}</a>` : ''}
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
        `<span style="color:${C.accent};font-style:normal;font-weight:600;">$1</span>`
      );
      return `
<div style="padding:20px 0;border-bottom:1px solid ${C.border};">
  <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px;">
    <span style="font-size:21px;font-weight:800;color:${C.textPri};font-family:Georgia,serif;letter-spacing:-0.01em;">${word}</span>
    <span style="font-size:11px;color:${C.textMuted};font-weight:500;">${pos}. ${def}</span>
  </div>
  <p style="font-size:13px;line-height:1.75;color:${C.textSec};font-style:italic;margin:0;">"${highlighted}"</p>
</div>`;
    })
    .filter(Boolean)
    .join('');

  return items || `<p style="font-size:13px;color:${C.textMuted};font-style:italic;padding:12px 0;">AI 词汇正在生成中...</p>`;
}

export function generateArticleHtml(aiSummary: string, news: NewsItem[]): string {
  const [hero, ...rest] = news;
  const source = news[0]?.source || 'News';
  const year = new Date().getFullYear();

  return `
<div style="background:${C.bg};margin:0;padding:0;">
<div style="max-width:680px;margin:0 auto;padding:40px 20px 60px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Section Label -->
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:36px;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${C.textMuted};white-space:nowrap;">Latest Reports</span>
    <div style="flex:1;height:1px;background:linear-gradient(to right,${C.border},transparent);"></div>
  </div>

  <!-- Hero -->
  ${hero ? heroCard(hero) : ''}

  <!-- Secondary Articles -->
  ${rest.map(secondaryCard).join('')}

  <!-- Vocabulary Section -->
  <div style="margin-top:64px;padding-top:40px;border-top:1px solid ${C.border};">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">
      <span style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${C.textMuted};white-space:nowrap;">今日阅读难词汇总</span>
      <div style="flex:1;height:1px;background:linear-gradient(to right,${C.border},transparent);"></div>
    </div>
    <div style="border-top:1px solid ${C.border};">
      ${vocabSection(aiSummary)}
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:56px;padding-top:24px;border-top:1px solid ${C.border};text-align:center;font-size:10px;color:${C.textMuted};line-height:1.9;letter-spacing:0.05em;">
    数据源: ${source} · 由 AI 提供语言支持<br/>
    © ${year} 大侠的读书笔记
  </div>

</div>
</div>`;
}
