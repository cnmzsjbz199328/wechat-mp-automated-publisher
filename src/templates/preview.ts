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
          <span class="text-[10px] font-bold text-white/70 uppercase tracking-widest">${hero.source || 'Yahoo Finance'}</span>
          <h2 class="text-lg font-extrabold text-white leading-snug mt-1">${hero.title}</h2>
          <p class="text-xs text-white/60 mt-1">${formatDate(hero.pubDate)}</p>
        </div>
      </div>` : `
      <div class="mb-4">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">${hero.source || 'Yahoo Finance'}</span>
        <h2 class="text-2xl font-extrabold text-white leading-snug mt-1 group-hover:text-primary transition-colors">${hero.title}</h2>
        <p class="text-xs text-slate-400 mt-2">${formatDate(hero.pubDate)}</p>
      </div>`}
    </a>` : '';

  const restCards = rest.map(n => `
    <a href="${n.link || '#'}" target="_blank" class="flex gap-3 group py-4 border-t border-slate-800 items-start">
      ${n.imageUrl ? `
      <div class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
        <img src="${n.imageUrl}" alt="${n.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
      </div>` : `
      <div class="w-20 h-20 rounded-lg flex-shrink-0 bg-slate-800 flex items-center justify-center">
        <span class="material-symbols-outlined text-slate-600 text-2xl">article</span>
      </div>`}
      <div class="flex-1 min-w-0">
        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">${n.source || 'Yahoo Finance'}</span>
        <h3 class="text-sm font-bold text-slate-100 leading-snug mt-0.5 group-hover:text-primary transition-colors line-clamp-3">${n.title}</h3>
        <p class="text-[11px] text-slate-500 mt-1">${formatDate(n.pubDate)}</p>
      </div>
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
    .filter(l => l.length > 20)
    .slice(0, 4)
    .map(l => `
      <li class="flex gap-3 text-sm leading-relaxed text-slate-300">
        <span class="material-symbols-outlined text-primary text-base mt-0.5 flex-shrink-0">check_circle</span>
        <p>${l.replace(/^\*+\s*/, '').replace(/\*\*/g, '')}</p>
      </li>`).join('');

  return `<!DOCTYPE html>
<html class="dark" lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>美股实战内参 · 预览</title>
  <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet"/>
  <script>tailwind.config = { darkMode:'class', theme:{ extend:{ colors:{ primary:'#137fec' }, fontFamily:{ sans:['Inter','sans-serif'] } } } }</script>
  <style>
    body { font-family:'Inter',sans-serif; -webkit-font-smoothing:antialiased; }
    .glass { background:rgba(255,255,255,0.04); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.08); }
    .line-clamp-3 { display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  </style>
</head>
<body class="dark bg-[#101922] text-slate-100 min-h-screen pb-28">

<!-- Sticky Header -->
<header class="sticky top-0 z-50 bg-[#101922]/80 backdrop-blur-md border-b border-slate-800">
  <div class="h-0.5 bg-primary/20 w-full"><div class="h-full bg-primary w-1/3"></div></div>
  <div class="flex items-center justify-between px-4 py-3">
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Live Data</span>
    </div>
    <div class="text-center">
      <p class="text-[10px] font-bold text-primary uppercase tracking-widest">美股 AI 内参</p>
      <p class="text-xs font-bold text-slate-100">${dateStr} ${timeStr}</p>
    </div>
    <div class="flex gap-1">
      <button class="p-2 text-slate-400"><span class="material-symbols-outlined text-xl">bookmark</span></button>
      <button class="p-2 text-slate-400"><span class="material-symbols-outlined text-xl">ios_share</span></button>
    </div>
  </div>
</header>

<main class="max-w-2xl mx-auto px-4 pt-6">

  <!-- Page Title -->
  <div class="mb-6">
    <div class="flex items-center gap-2 mb-3">
      <span class="bg-primary/15 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Analyst Pick</span>
      <span class="text-slate-500 text-xs">${news.length} stories · AI解读</span>
    </div>
    <h1 class="text-3xl font-black leading-tight tracking-tight text-white">【实时追踪】美股动态 &amp; AI解读</h1>
    <div class="flex items-center gap-3 mt-4">
      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-black text-base flex-shrink-0">侠</div>
      <div>
        <p class="text-sm font-bold text-slate-100">大侠</p>
        <p class="text-xs text-slate-500">大侠的读书笔记 · ${dateStr}</p>
      </div>
    </div>
  </div>

  <!-- AI Insight Box -->
  <section class="mb-8 p-5 rounded-xl border-2 border-primary/25 bg-primary/8 glass">
    <div class="flex items-center gap-2 mb-4">
      <span class="material-symbols-outlined text-primary text-2xl">smart_toy</span>
      <h3 class="text-sm font-extrabold text-primary uppercase tracking-wider">AI 解读</h3>
    </div>
    <ul class="space-y-3">${bullets || `<li class="text-sm text-slate-300">${aiSummary.substring(0, 400)}...</li>`}</ul>
  </section>

  <!-- News Feed Section -->
  <section>
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-xl font-extrabold tracking-tight">核心简讯</h2>
      <span class="text-[10px] font-bold text-slate-500 uppercase">Yahoo Finance RSS</span>
    </div>
    ${newsCards(news)}
  </section>

  <!-- WeChat Article Preview (collapsible) -->
  <section class="mt-10">
    <details class="group">
      <summary class="flex items-center justify-between cursor-pointer py-3 border-t border-slate-800 text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors list-none">
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-base">article</span>
          微信图文原始预览
        </span>
        <span class="material-symbols-outlined text-base group-open:rotate-180 transition-transform">expand_more</span>
      </summary>
      <div class="mt-4 rounded-xl overflow-hidden border border-slate-700">
        <div class="bg-white">${articleHtml}</div>
      </div>
    </details>
  </section>
</main>

<!-- Bottom Nav -->
<nav class="fixed bottom-0 left-0 right-0 z-50 bg-[#101922]/95 backdrop-blur-md border-t border-slate-800">
  <div class="flex justify-around items-center px-2 py-2 max-w-2xl mx-auto">
    <a href="/" class="flex flex-col items-center gap-1 p-2 text-slate-400">
      <span class="material-symbols-outlined text-2xl">home</span>
      <span class="text-[10px] font-medium">首页</span>
    </a>
    <a href="/preview-html" class="flex flex-col items-center gap-1 p-2 text-primary">
      <span class="material-symbols-outlined text-2xl">article</span>
      <span class="text-[10px] font-bold">预览</span>
    </a>
    <a href="/finance-live" class="flex flex-col items-center gap-1 p-2 text-slate-400">
      <span class="material-symbols-outlined text-2xl">send</span>
      <span class="text-[10px] font-medium">发布</span>
    </a>
  </div>
  <div class="h-5"></div>
</nav>

</body>
</html>`;
}
