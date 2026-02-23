import { NewsItem } from '../types';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return iso; }
}

/** Shorten a URL to a readable display string */
function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '');
    const display = u.hostname + path;
    return display.length > 52 ? display.substring(0, 50) + '…' : display;
  } catch { return url; }
}

function heroCard(item: NewsItem): string {
  return `
    <article class="hero-article">
      ${item.imageUrl ? `
      <div class="hero-image">
        <img src="${item.imageUrl}" alt="${item.title}">
      </div>` : ''}
      <div class="source-badge">${item.source || 'News'}</div>
      <h2 class="hero-title">${item.title}</h2>
      <p class="hero-body">${item.aiAbstract || item.description || ''}</p>
      <div class="article-meta">
        <time>${formatDate(item.pubDate)}</time>
        ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener">${shortUrl(item.link)}</a>` : ''}
      </div>
    </article>`;
}

function secondaryCard(item: NewsItem): string {
  return `
    <article class="secondary-article">
      ${item.imageUrl ? `
      <div class="secondary-image">
        <img src="${item.imageUrl}" alt="${item.title}">
      </div>` : ''}
      <div class="secondary-content">
        <div class="secondary-header">
          <span class="secondary-source">${item.source || 'News'}</span>
          <span class="dot"></span>
          <time>${formatDate(item.pubDate)}</time>
        </div>
        <h3 class="secondary-title">${item.title}</h3>
        <p class="secondary-body">${item.aiAbstract || item.description || ''}</p>
        ${item.link ? `<a class="secondary-link" href="${item.link}" target="_blank" rel="noopener">${shortUrl(item.link)}</a>` : ''}
      </div>
    </article>`;
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
      const cleanExample = example.replace(/^["""''']+|["""''']+$/g, '').trim();
      // Highlight the vocab word (and simple inflections) in the example
      const highlighted = cleanExample.replace(
        new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*)`, 'gi'),
        '<span class="highlight">$1</span>'
      );
      return `
      <div class="vocab-item">
        <div class="vocab-header">
          <span class="vocab-word">${word}</span>
          <span class="vocab-pos">${pos}. ${def}</span>
        </div>
        <p class="vocab-sentence">"${highlighted}"</p>
      </div>`;
    })
    .filter(Boolean)
    .join('');

  return items || `<p class="vocab-empty">正在从今日资讯中归纳难点词汇...</p>`;
}

export function generatePreviewShell(news: NewsItem[], aiSummary: string): string {
  const [hero, ...rest] = news;
  const source = news[0]?.source || 'News';
  const dateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>聚合资讯 · 深度阅读 · ${source}</title>
  <meta name="description" content="${source} 最新资讯 · AI 词汇精选 · 深度阅读"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg:             #0b0f15;
      --surface:        #111720;
      --border:         rgba(255,255,255,0.06);
      --text-primary:   #f0f2f5;
      --text-secondary: #7a8494;
      --text-muted:     #3d4553;
      --accent:         #4e8ef7;
      --accent-dim:     rgba(78,142,247,0.12);
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--text-primary);
      font-family: 'DM Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
    }

    main {
      max-width: 680px;
      margin: 0 auto;
      padding: 48px 24px 80px;
    }

    /* ── Section Label ── */
    .section-label {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 36px;
    }
    .section-label span {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .section-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, var(--border), transparent);
    }

    /* ── Hero Article ── */
    .hero-article { margin-bottom: 48px; }

    .hero-image {
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 20px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.4);
      border: 1px solid var(--border);
    }
    .hero-image img {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
      transition: transform 0.6s ease;
    }
    .hero-article:hover .hero-image img { transform: scale(1.03); }

    .source-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 99px;
      background: var(--accent-dim);
      border: 1px solid rgba(78,142,247,0.2);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 12px;
    }

    .hero-title {
      font-family: 'DM Serif Display', serif;
      font-size: clamp(20px, 4vw, 26px);
      line-height: 1.35;
      color: var(--text-primary);
      margin-bottom: 14px;
    }

    .hero-body {
      font-size: 14px;
      line-height: 1.85;
      color: var(--text-secondary);
    }

    .article-meta {
      margin-top: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .article-meta time {
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 500;
      white-space: nowrap;
    }
    .article-meta a {
      font-size: 10px;
      color: var(--text-muted);
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      transition: color 0.2s;
    }
    .article-meta a:hover { color: var(--text-secondary); }

    /* ── Secondary Articles ── */
    .secondary-list { display: flex; flex-direction: column; }

    .secondary-article {
      padding: 28px 0;
      border-top: 1px solid var(--border);
      transition: opacity 0.2s;
    }
    .secondary-article:hover { opacity: 0.9; }

    .secondary-image {
      width: 100%;
      aspect-ratio: 3 / 1;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 16px;
      border: 1px solid var(--border);
    }
    .secondary-image img {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
      transition: transform 0.5s ease;
    }
    .secondary-article:hover .secondary-image img { transform: scale(1.04); }

    .secondary-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .secondary-source {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--text-muted);
    }
    .secondary-header .dot {
      width: 3px; height: 3px;
      border-radius: 50%;
      background: var(--text-muted);
      opacity: 0.4;
    }
    .secondary-header time {
      font-size: 9px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .secondary-title {
      font-family: 'DM Serif Display', serif;
      font-size: clamp(15px, 3vw, 18px);
      line-height: 1.4;
      color: var(--text-primary);
      margin-bottom: 10px;
      transition: color 0.2s;
    }
    .secondary-article:hover .secondary-title { color: var(--accent); }

    .secondary-body {
      font-size: 13px;
      line-height: 1.8;
      color: var(--text-secondary);
    }

    .secondary-link {
      display: block;
      margin-top: 10px;
      font-size: 10px;
      color: var(--text-muted);
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.2s;
    }
    .secondary-link:hover { color: var(--text-secondary); }

    /* ── Vocabulary Section ── */
    .vocab-section {
      margin-top: 64px;
      padding-top: 40px;
      border-top: 1px solid var(--border);
    }

    .vocab-item {
      padding: 22px 0;
      border-bottom: 1px solid var(--border);
    }
    .vocab-item:first-of-type { border-top: 1px solid var(--border); }

    .vocab-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 6px;
    }
    .vocab-word {
      font-family: 'DM Serif Display', serif;
      font-size: 22px;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }
    .vocab-pos {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }
    .vocab-sentence {
      font-size: 13px;
      line-height: 1.75;
      color: var(--text-secondary);
      font-style: italic;
    }
    .vocab-sentence .highlight {
      color: var(--accent);
      font-style: normal;
      font-weight: 600;
    }

    .vocab-empty {
      font-size: 13px;
      color: var(--text-muted);
      font-style: italic;
      padding: 12px 0;
    }

    /* ── Footer ── */
    .page-footer {
      margin-top: 56px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 10px;
      color: var(--text-muted);
      line-height: 1.9;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
<main>

  <!-- Latest Reports -->
  <section>
    <div class="section-label"><span>Latest Reports</span></div>

    ${hero ? heroCard(hero) : ''}

    <div class="secondary-list">
      ${rest.map(secondaryCard).join('')}
    </div>
  </section>

  <!-- Vocabulary Section -->
  <section class="vocab-section" id="ai-study">
    <div class="section-label"><span>今日阅读难词汇总</span></div>
    <div class="vocab-list">
      ${vocabSection(aiSummary)}
    </div>
  </section>

  <footer class="page-footer">
    数据源: ${source} · 由 AI 提供语言支持<br>
    © ${new Date().getFullYear()} 大侠的读书笔记 · ${dateStr}
  </footer>

</main>
</body>
</html>`;
}
