import { NewsItem } from '../types';
import { STYLES } from '../config/constants';

/**
 * Formats the structured vocabulary list for WeChat's environment.
 */
function formatVocab(aiSummary: string): string {
  return aiSummary
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.includes('|'))
    .map(line => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 4) {
        const [word, type, def, example] = parts;
        // Clean example (remove possible quotes from AI)
        const cleanExample = example.replace(/^["'“”'"]|["'“”'"]$/g, '').trim();
        // Highlight word in example (case insensitive)
        const highlightedEx = cleanExample.replace(
          new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
          `<span style="color:#137fec;font-weight:bold;">$1</span>`
        );
        return `
          <div style="${STYLES.vocabItem}">
            <div style="display:flex;align-items:baseline;margin-bottom:4px;">
              <span style="${STYLES.vocabWord}">${word}</span>
              <span style="${STYLES.vocabMeta}">${type} ${def}</span>
            </div>
            <div style="${STYLES.vocabEx}">
              "${highlightedEx}"
            </div>
          </div>`;
      }
      return '';
    }).join('');
}

export function generateArticleHtml(aiSummary: string, news: NewsItem[]): string {
  const newsHtml = news.map(n => `
    <div style="${STYLES.newsItem}">
      <div style="${STYLES.newsTitle}">${n.title}</div>
      ${(n.aiAbstract || n.description) ? `
      <div style="font-size:14px;color:#4b5563;line-height:1.7;margin:12px 0;text-align:justify;">
        ${n.aiAbstract || n.description}
      </div>` : ''}
      ${n.link ? `
      <div style="margin-top:4px;">
        <a href="${n.link}" style="font-size:11px;color:#9ca3af;text-decoration:none;word-break:break-all;" target="_blank">${n.link}</a>
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

      <!-- Feed Section -->
      <div style="${STYLES.sectionCard}">
        <div style="${STYLES.sectionTitle}">
          <span style="margin-right:8px;">⚡</span> 核心简报
        </div>
        ${newsHtml}
      </div>

      <!-- Clean Vocabulary Section -->
      <div style="${STYLES.vocabContainer}">
        <div style="${STYLES.vocabTitle}">
          今日阅读难词汇总
        </div>
        ${formatVocab(aiSummary)}
        <div style="margin-top:20px;font-size:11px;color:#bbb;font-style:italic;">
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
