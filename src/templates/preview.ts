import { NewsItem } from '../types';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return iso; }
}

function newsCards(news: NewsItem[]): string {
  const [hero, ...rest] = news;

  const heroCard = hero ? `
    <a href="${hero.link || '#'}" target="_blank" class="block group mb-6">
      ${hero.imageUrl ? `
      <div class="relative w-full aspect-video rounded-xl overflow-hidden mb-4 shadow-2xl">
        <img src="${hero.imageUrl}" alt="${hero.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-4">
          <span class="text-[10px] font-bold text-white/70 uppercase tracking-widest">${hero.source || 'News'}</span>
          <h2 class="text-lg font-extrabold text-white leading-snug mt-1">${hero.title}</h2>
          <p class="text-[11px] text-white/70 mt-2 line-clamp-2 italic">${hero.description || ''}</p>
        </div>
      </div>` : `
      <div class="mb-4">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">${hero.source || 'News'}</span>
        <h2 class="text-2xl font-extrabold text-white leading-snug mt-1 group-hover:text-primary transition-colors">${hero.title}</h2>
        <p class="text-sm text-slate-400 mt-2 line-clamp-3">${hero.description || ''}</p>
        <p class="text-xs text-slate-500 mt-2">${formatDate(hero.pubDate)}</p>
      </div>`}
    </a>` : '';

  const restCards = rest.map(n => `
    <a href="${n.link || '#'}" target="_blank" class="flex gap-4 group py-5 border-t border-slate-800 items-start">
      <div class="flex-1 min-w-0">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">${n.source || 'News'}</span>
        <h3 class="text-base font-bold text-slate-100 leading-snug mt-1 group-hover:text-primary transition-colors">${n.title}</h3>
        <p class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">${n.description || ''}</p>
        <p class="text-[10px] text-slate-600 mt-2 uppercase font-medium">${formatDate(n.pubDate)}</p>
      </div>
      ${n.imageUrl ? `
      <div class="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
        <img src="${n.imageUrl}" alt="${n.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
      </div>` : ''}
    </a>`).join('');

  return heroCard + restCards;
}

export function generatePreviewShell(articleHtml: string, news: NewsItem[], aiSummary: string): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Parse AI summary into bullet points
  const bullets = aiSummary
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.length > 5)
    .slice(0, 5)
    .map(l => `
      <li class="flex gap-3 text-sm leading-relaxed text-slate-300">
        <span class="material-symbols-outlined text-primary text-base mt-0.5 flex-shrink-0">auto_awesome</span>
        <p>${l.replace(/^\*+\s*/, '').replace(/\*\*/g, '')}</p>
      </li>`).join('');

  return `<!DOCTYPE html>
<html class="dark" lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>聚合预览 · ${news[0]?.source || 'News'}</title>
  <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
  <script>tailwind.config = { darkMode:'class', theme:{ extend:{ colors:{ primary:'#137fec' }, fontFamily:{ sans:['Inter','sans-serif'] } } } }</script>
  <style>
    body { font-family:'Inter',sans-serif; -webkit-font-smoothing:antialiased; }
    .glass { background:rgba(255,255,255,0.04); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.08); }
    .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .line-clamp-3 { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  </style>
</head>
<body class="dark bg-[#0c1219] text-slate-100 min-h-screen pb-28">

<!-- Top Brand Bar -->
<div class="bg-primary/10 text-primary text-[10px] font-bold text-center py-1 uppercase tracking-[0.2em]">
  Domain: ${news[0]?.source || 'General'} · Multi-Strategy Engine
</div>

<header class="sticky top-0 z-50 bg-[#0c1219]/80 backdrop-blur-md border-b border-slate-800/50">
  <div class="flex items-center justify-between px-4 py-4">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
        <span class="material-symbols-outlined text-xl">newsmode</span>
      </div>
      <div>
        <p class="text-sm font-bold text-slate-100 italic tracking-tight">Intelligence</p>
        <p class="text-[9px] text-slate-500 uppercase font-bold tracking-widest">${dateStr}</p>
      </div>
    </div>
    <div class="flex gap-3">
      <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-[10px] font-bold text-slate-300">${timeStr}</span>
      </div>
    </div>
  </div>
</header>

<main class="max-w-2xl mx-auto px-4 pt-6">

  <!-- AI Summary Insight -->
  <section class="mb-10 relative">
    <div class="absolute -top-3 -right-3 w-16 h-16 bg-primary/20 blur-3xl rounded-full"></div>
    <div class="p-6 rounded-2xl border border-primary/20 bg-primary/5 glass relative overflow-hidden">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
          <span class="material-symbols-outlined">psychology</span>
        </div>
        <div>
          <h3 class="text-xs font-black text-primary uppercase tracking-[0.1em]">AI Collective Input</h3>
          <p class="text-lg font-bold text-white">今日核心简报</p>
        </div>
      </div>
      <ul class="space-y-4 relative z-10">${bullets || `<li class="text-sm text-slate-300 italic">正在深度解析中...</li>`}</ul>
    </div>
  </section>

  <!-- News List Section -->
  <section>
    <div class="flex items-center gap-3 mb-6">
      <h2 class="text-xl font-black tracking-tight text-white uppercase italic">Flash Feed</h2>
      <div class="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
    </div>
    ${newsCards(news)}
  </section>

  <!-- Original WeChat Preview (collapsible) -->
  <section class="mt-16 pb-10">
    <details class="group">
      <summary class="flex items-center justify-between cursor-pointer py-4 border-t border-slate-800 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors list-none">
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-sm">terminal</span>
          VIEW RAW WECHAT ARTICLE HTML
        </span>
        <span class="material-symbols-outlined text-sm group-open:rotate-180 transition-transform">expand_more</span>
      </summary>
      <div class="mt-4 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
        <div class="bg-white">${articleHtml}</div>
      </div>
    </details>
  </section>
</main>

<!-- Bottom Navigation Mimic -->
<nav class="fixed bottom-0 left-0 right-0 z-50 bg-[#0c1219]/90 backdrop-blur-xl border-t border-white/5">
  <div class="flex justify-around items-center px-4 py-4 max-w-2xl mx-auto">
    <a href="#" class="flex flex-col items-center gap-1.5 text-primary">
      <span class="material-symbols-outlined text-2xl">dashboard</span>
      <span class="text-[9px] font-black uppercase tracking-tighter">Overview</span>
    </a>
    <a href="#" class="flex flex-col items-center gap-1.5 text-slate-500">
      <span class="material-symbols-outlined text-2xl">auto_graph</span>
      <span class="text-[9px] font-black uppercase tracking-tighter">Insights</span>
    </a>
    <a href="#" class="flex flex-col items-center gap-1.5 text-slate-500">
      <span class="material-symbols-outlined text-2xl">settings</span>
      <span class="text-[9px] font-black uppercase tracking-tighter">System</span>
    </a>
  </div>
  <div class="h-4"></div>
</nav>

</body>
</html>`;
}
