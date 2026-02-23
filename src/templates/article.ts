import { NewsItem } from '../types';

/* ── Color tokens  (light/clean, mirrors mdnice style) ── */
const C = {
  text: '#3a3a3a',
  muted: '#888888',
  accent: '#2980b9',
  border: '#e5e5e5',
  bgCode: '#f5f7fa',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + u.pathname.replace(/\/$/, '');
  } catch { return url; }
}

/* ── Section sub-label (small-caps divider) ── */
function sectionDivider(text: string): string {
  return `<p style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${C.muted};margin:32px 0 18px;padding-bottom:8px;border-bottom:1px solid ${C.border};text-align:left;word-break:break-word;">${text}</p>`;
}

/* ── Source + date meta line ── */
function metaLine(item: NewsItem): string {
  return `<p style="font-size:13px;color:${C.muted};margin:6px 0 12px;line-height:1.6;text-align:left;word-break:break-word;"><span style="color:${C.accent};font-weight:600;">${item.source || 'News'}</span>&nbsp;&nbsp;·&nbsp;&nbsp;${formatDate(item.pubDate)}</p>`;
}

/* ── Hero article (first item, full-height image) ── */
function heroCard(item: NewsItem): string {
  return `
${item.imageUrl ? `<p style="margin:0 0 16px;"><img src="${item.imageUrl}" alt="" style="width:100%;display:block;border-radius:6px;"/></p>` : ''}
${metaLine(item)}
<p style="font-size:20px;font-weight:800;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;line-height:1.45;margin:0 0 12px;text-align:left;word-break:break-word;">${item.title}</p>
<p style="font-size:15px;line-height:1.85;color:${C.text};margin:0 0 10px;text-align:left;word-break:break-word;">${item.aiAbstract || item.description || ''}</p>
${item.link ? `<p style="margin:0 0 4px;font-size:12px;color:${C.muted};text-align:left;word-break:break-all;">${shortUrl(item.link)}</p>` : ''}`;
}

/* ── Secondary card (cropped 3:1 banner image) ── */
function secondaryCard(item: NewsItem): string {
  return `
<p style="margin:22px 0 0;border-top:1px solid ${C.border};padding-top:22px;"></p>
${item.imageUrl ? `<p style="margin:0 0 14px;overflow:hidden;border-radius:6px;"><img src="${item.imageUrl}" alt="" style="width:100%;display:block;aspect-ratio:3/1;object-fit:cover;"/></p>` : ''}
${metaLine(item)}
<p style="font-size:17px;font-weight:700;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;line-height:1.45;margin:0 0 10px;text-align:left;word-break:break-word;">${item.title}</p>
<p style="font-size:14px;line-height:1.8;color:${C.text};margin:0 0 8px;text-align:left;word-break:break-word;">${item.aiAbstract || item.description || ''}</p>
${item.link ? `<p style="margin:0;font-size:12px;color:${C.muted};text-align:left;word-break:break-all;">${shortUrl(item.link)}</p>` : ''}`;
}

/* ── Vocabulary section ── */
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
        `<strong style="color:${C.accent};font-style:normal;">$1</strong>`
      );
      return `
<p style="margin:20px 0 4px;text-align:left;word-break:break-word;">
  <span style="font-size:18px;font-weight:800;color:#1a1a1a;font-family:Georgia,'Times New Roman',serif;">${word}</span>
  <span style="font-size:12px;color:${C.muted};margin-left:8px;">${pos}. ${def}</span>
</p>
<p style="font-size:13px;line-height:1.8;color:#666;font-style:italic;margin:4px 0 0;text-align:left;word-break:break-word;">${highlighted}</p>`;
    })
    .filter(Boolean)
    .join('');

  return items || `<p style="font-size:14px;color:${C.muted};font-style:italic;text-align:left;">AI 词汇正在生成中...</p>`;
}

/* ── Main export ── */
export function generateArticleHtml(aiSummary: string, news: NewsItem[]): string {
  const [hero, ...rest] = news;
  const source = news[0]?.source || 'News';

  return `<div style="font-family:Georgia,'SF Pro Text','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;color:${C.text};line-height:1.8;padding:8px 0;max-width:680px;margin:0 auto;background:#fff;text-align:left;word-break:break-word;">

${sectionDivider('Latest Reports')}

${hero ? heroCard(hero) : ''}

${rest.map(secondaryCard).join('')}

<p style="margin:40px 0 0;border-top:1px solid ${C.border};"></p>
${sectionDivider('今日阅读词汇')}

${vocabSection(aiSummary)}

<p style="margin-top:36px;text-align:center;font-size:11px;color:${C.muted};letter-spacing:0.04em;">数据源: ${source}</p>

</div>`;
}
