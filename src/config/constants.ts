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
  newsBadge: 'background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:bold;margin-right:8px;',
  vocabContainer: 'margin:30px 0;padding:20px;border-top:1px solid #eee;',
  vocabTitle: 'font-size:13px;color:#999;font-weight:bold;margin-bottom:25px;letter-spacing:1px;text-transform:uppercase;',
  vocabItem: 'margin-bottom:24px;',
  vocabWord: 'font-size:18px;font-weight:bold;color:#1a1a1a;margin-right:8px;',
  vocabMeta: 'font-size:13px;color:#888;',
  vocabEx: 'font-size:14px;color:#555;line-height:1.6;font-style:normal;'
};

export const API_URLS = {
  WECHAT_TOKEN: 'https://api.weixin.qq.com/cgi-bin/token',
  WECHAT_MEDIA_UPLOAD: 'https://api.weixin.qq.com/cgi-bin/material/add_material',
  WECHAT_DRAFT_ADD: 'https://api.weixin.qq.com/cgi-bin/draft/add',
  DEFAULT_THUMB_IMAGE: 'https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?w=900&h=500&fit=crop&fm=jpg', // Sydney view
  DEFAULT_IMMIGRATION_THUMBS: [
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=900&h=500&fit=crop&fm=jpg', // Sydney Opera House Aerial
    'https://images.unsplash.com/photo-1493362841630-d11ea609c1b4?w=900&h=500&fit=crop&fm=jpg', // Australian Outback/Nature
    'https://images.unsplash.com/photo-1510526084045-814cb9bfaf4b?w=900&h=500&fit=crop&fm=jpg', // Melbourne Skyline
    'https://images.unsplash.com/photo-1528072164453-61a7a1fb5f0c?w=900&h=500&fit=crop&fm=jpg', // Australian Flag overlay
    'https://images.unsplash.com/photo-1624138784614-87fd1b65d66c?w=900&h=500&fit=crop&fm=jpg', // Australian Passport mockup vibe
    'https://images.unsplash.com/photo-1529108190281-9a4f620bc2d8?w=900&h=500&fit=crop&fm=jpg'  // Clean office/document signing
  ]
};

export const RSS_SOURCES: Record<string, string> = {
  FINANCE: 'http://feeds.marketwatch.com/marketwatch/topstories',
  NASA: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
  ARS: 'https://feeds.arstechnica.com/arstechnica/index'
};

