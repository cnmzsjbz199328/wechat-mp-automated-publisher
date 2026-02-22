import { NewsItem } from '../types';
import { STYLES } from '../config/constants';

/**
 * Very basic markdown to HTML formatter for WeChat's limited environment.
 */
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#111;background-color:#fff3cd;padding:0 4px;border-radius:4px;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<li style="margin-bottom:12px;list-style:none;padding-left:0;border-left:4px solid #137fec;padding:8px 12px;background:#f9fafb;border-radius:0 8px 8px 0;">$1</li>')
    .replace(/\n/g, '<br/>');
}

export function generateArticleHtml(aiSummary: string, news: NewsItem[]): string {
  const newsHtml = news.map(n => `
    <div style="${STYLES.newsItem}">
      <div style="${STYLES.newsTitle}">${n.title}</div>
      ${n.description ? `
      <div style="font-size:14px;color:#4b5563;line-height:1.7;margin:12px 0;text-align:justify;">
        ${n.description}
      </div>` : ''}
      <div style="${STYLES.newsMeta}">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="${STYLES.newsBadge}">${n.source || 'Market News'}</span>
          <span style="opacity:0.6;font-size:11px;">${new Date(n.pubDate).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div style="${STYLES.container}">
      <!-- Header Section -->
      <div style="${STYLES.header}">
        <h1 style="${STYLES.title}">聚合资讯 · 深度阅读</h1>
        <p style="${STYLES.subtitle}">Global Insights & Language Study</p>
      </div>

      <!-- Feed Section (Moved to top) -->
      <div style="${STYLES.sectionCard}">
        <div style="${STYLES.sectionTitle}">
          <span style="margin-right:8px;">⚡</span> 核心简报
        </div>
        ${newsHtml}
      </div>

      <!-- AI Vocabulary Card (Moved to bottom) -->
      <div style="${STYLES.sectionCard};border:1px solid #e5e7eb;background:#fff;">
        <div style="${STYLES.sectionTitle};color:#137fec;">
          <span style="margin-right:8px;">📚</span> 英语难词释义
        </div>
        <div style="font-size:15px;line-height:1.6;color:#374151;">
          <ul style="padding:0;margin:0;">
            ${formatMarkdown(aiSummary)}
          </ul>
        </div>
        <div style="margin-top:16px;font-size:12px;color:#9ca3af;font-style:italic;">
          * 以上例句由 AI 结合今日新闻语境生成
        </div>
      </div>

      <!-- Footer Info -->
      <div style="text-align:center;padding:20px 0;opacity:0.4;font-size:11px;">
        数据源: ${news[0]?.source || 'Global Feeds'} · 由 Cloudflare AI 提供语言支持<br/>
        © 2026 大侠的读书笔记
      </div>
    </div>
  `;
}
