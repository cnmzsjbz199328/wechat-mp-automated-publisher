import { NewsItem } from '../types';
import { STYLES } from '../config/constants';

/**
 * Very basic markdown to HTML formatter for WeChat's limited environment.
 */
function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#111;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export function generateArticleHtml(aiSummary: string, news: NewsItem[]): string {
  const newsHtml = news.map(n => `
    <div style="${STYLES.newsItem}">
      <div style="${STYLES.newsTitle}">${n.title}</div>
      ${n.description ? `
      <div style="font-size:14px;color:#666;line-height:1.6;margin-bottom:8px;text-align:justify;">
        ${n.description}
      </div>` : ''}
      <div style="${STYLES.newsMeta}">
        <div>
          <span style="${STYLES.newsBadge}">${n.source || 'Market News'}</span>
          <span style="opacity:0.6;">${new Date(n.pubDate).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div style="${STYLES.container}">
      <!-- Header Section -->
      <div style="${STYLES.header}">
        <h1 style="${STYLES.title}">聚合资讯 · AI解读</h1>
        <p style="${STYLES.subtitle}">Cross-Domain Insights & AI Analysis</p>
      </div>

      <!-- AI Analysis Card -->
      <div style="${STYLES.sectionCard}">
        <div style="${STYLES.sectionTitle}">
          <span style="margin-right:8px;">🤖</span> AI 智能解读
        </div>
        <div style="${STYLES.aiSummary}">
          ${formatMarkdown(aiSummary)}
        </div>
      </div>

      <!-- Feed Section -->
      <div style="${STYLES.sectionCard}">
        <div style="${STYLES.sectionTitle}">
          <span style="margin-right:8px;">⚡</span> 核心简报
        </div>
        ${newsHtml}
      </div>

      <!-- Footer Info -->
      <div style="text-align:center;padding:20px 0;opacity:0.4;font-size:11px;">
        数据源: ${news[0]?.source || 'Global Feeds'} · 由 Cloudflare AI 提供分析<br/>
        © 2026 大侠的读书笔记
      </div>
    </div>
  `;
}
