export const STYLES = {
  container: 'margin:0 auto;padding:16px;max-width:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background-color:#f8f9fa;',
  header: 'text-align:center;padding:24px 0;margin-bottom:20px;background:linear-gradient(135deg,#137fec,#42a5f5);border-radius:12px;color:#fff;',
  title: 'font-size:24px;font-weight:800;letter-spacing:1px;margin:0;',
  subtitle: 'font-size:12px;opacity:0.8;margin-top:4px;text-transform:uppercase;letter-spacing:2px;',
  sectionCard: 'background:#fff;border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 4px 12px rgba(0,0,0,0.05);border:1px solid #eee;',
  sectionTitle: 'font-size:18px;font-weight:bold;color:#137fec;display:flex;align-items:center;margin-bottom:16px;',
  aiSummary: 'font-size:15px;line-height:1.7;color:#374151;white-space:pre-wrap;',
  newsItem: 'padding:16px 0;border-bottom:1px solid #f0f0f0;display:flex;flex-direction:column;gap:8px;',
  newsTitle: 'font-size:16px;font-weight:700;color:#111827;line-height:1.4;',
  newsMeta: 'font-size:12px;color:#6b7280;display:flex;justify-content:between;',
  newsBadge: 'background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold;margin-right:8px;'
};

export const API_URLS = {
  WECHAT_TOKEN: 'https://api.weixin.qq.com/cgi-bin/token',
  WECHAT_MEDIA_UPLOAD: 'https://api.weixin.qq.com/cgi-bin/material/add_material',
  WECHAT_DRAFT_ADD: 'https://api.weixin.qq.com/cgi-bin/draft/add',
  YAHOO_FINANCE_RSS: 'https://finance.yahoo.com/news/rssindex',
  DEFAULT_THUMB_IMAGE: 'https://picsum.photos/id/1070/900/500.jpg'
};

export const RSS_SOURCES: Record<string, string> = {
  FINANCE: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
  NASA: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
  LITHUB: 'https://lithub.com/feed/',
  ARS: 'https://feeds.arstechnica.com/arstechnica/index'
};

