import { NewsItem } from '../types';
import { STYLES } from '../config/constants';

export function generateArticleHtml(aiSummary: string, news: NewsItem[]): string {
  const newsHtml = news.map(n => `
    <div style="${STYLES.newsItem}">
      <span style="${STYLES.newsTitle}">${n.title}</span>
      <p style="font-size:12px;color:#999;">${n.pubDate}</p>
    </div>
  `).join('');

  return `
    <div style="${STYLES.container}">
      <div style="${STYLES.header}">
        <div style="${STYLES.title}">美股实战内参</div>
      </div>
      <div style="${STYLES.sectionTitle}">AI解读</div>
      <div style="${STYLES.aiSummary}">${aiSummary}</div>
      <div style="${STYLES.sectionTitle}">核心简讯</div>
      ${newsHtml}
    </div>
  `;
}
