export function generatePreviewShell(articleHtml: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>文章预览 — 微信公众号效果</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a1a2e;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .top-bar {
      width: 100%;
      max-width: 420px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .badge {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: #fff;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .live-dot {
      width: 8px; height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: blink 1.2s ease-in-out infinite;
    }
    .live-label {
      color: #22c55e;
      font-size: 12px;
      font-weight: 600;
    }
    .ts { color: #6b7280; font-size: 11px; margin-left: auto; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

    /* Phone shell */
    .phone {
      width: 390px;
      background: #fff;
      border-radius: 40px;
      box-shadow:
        0 0 0 10px #2d2d2d,
        0 0 0 12px #444,
        0 30px 80px rgba(0,0,0,0.6);
      overflow: hidden;
    }
    .phone-notch {
      background: #111;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .notch-pill {
      width: 120px; height: 10px;
      background: #000;
      border-radius: 999px;
      border: 2px solid #333;
    }

    /* WeChat top bar */
    .wx-bar {
      background: #ededed;
      padding: 10px 16px 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      border-bottom: 1px solid #ddd;
    }
    .wx-back { font-size: 20px; color: #333; }
    .wx-title { font-size: 15px; color: #111; font-weight: 500; flex: 1; }
    .wx-dots { color: #666; font-size: 20px; letter-spacing: -2px; }

    /* Article scroll area */
    .article-viewport {
      height: 680px;
      overflow-y: auto;
      background: #fff;
      -webkit-overflow-scrolling: touch;
    }
    .article-viewport::-webkit-scrollbar { width: 3px; }
    .article-viewport::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }

    /* Author bar */
    .wx-author-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
    }
    .wx-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg,#0052D9,#00bcd4);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 14px; font-weight: bold; flex-shrink:0;
    }
    .wx-author-info { flex: 1; }
    .wx-author-name { font-size: 13px; color: #353535; font-weight: 600; }
    .wx-pub-date { font-size: 11px; color: #999; margin-top: 2px; }
    .wx-follow-btn {
      font-size: 12px; color: #0052D9;
      border: 1px solid #0052D9;
      padding: 3px 10px; border-radius: 12px;
    }

    /* Article body */
    .article-body { padding: 0 0 24px; }

    .phone-home-bar {
      background: #111;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .home-pill {
      width: 100px; height: 4px;
      background: #555;
      border-radius: 999px;
    }

    /* Info below phone */
    .info {
      margin-top: 24px;
      color: #6b7280;
      font-size: 12px;
      text-align: center;
      line-height: 1.8;
    }
    .info a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="top-bar">
    <span class="badge">📱 微信公众号预览</span>
    <span class="live-dot"></span>
    <span class="live-label">实时数据</span>
    <span class="ts" id="ts"></span>
  </div>

  <div class="phone">
    <div class="phone-notch"><div class="notch-pill"></div></div>

    <div class="wx-bar">
      <span class="wx-back">‹</span>
      <span class="wx-title">大侠的读书笔记</span>
      <span class="wx-dots">···</span>
    </div>

    <div class="article-viewport">
      <div class="wx-author-bar">
        <div class="wx-avatar">侠</div>
        <div class="wx-author-info">
          <div class="wx-author-name">大侠</div>
          <div class="wx-pub-date" id="pub-date"></div>
        </div>
        <span class="wx-follow-btn">关注</span>
      </div>
      <div class="article-body">
        ${articleHtml}
      </div>
    </div>

    <div class="phone-home-bar"><div class="home-pill"></div></div>
  </div>

  <div class="info">
    数据实时从 Yahoo Finance RSS 抓取 · AI 分析由 Cloudflare Llama-3 生成<br>
    此预览与微信草稿箱效果一致 · 刷新页面获取最新数据
  </div>

  <script>
    const now = new Date();
    document.getElementById('ts').textContent = now.toLocaleTimeString('zh-CN');
    document.getElementById('pub-date').textContent =
      now.toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric'}) + ' ' +
      now.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
  </script>
</body>
</html>`;
}
