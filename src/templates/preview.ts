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
    <div class="block group mb-10">
      ${hero.imageUrl ? `
      <div class="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 shadow-2xl ring-1 ring-white/10">
        <img src="${hero.imageUrl}" alt="${hero.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-6">
          <span class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-bold text-primary uppercase tracking-widest mb-3">${hero.source || 'Breaking'}</span>
          <h2 class="text-2xl font-black text-white leading-tight">${hero.title}</h2>
          <p class="text-sm text-slate-300 mt-3 leading-relaxed opacity-90">${hero.description || ''}</p>
        </div>
      </div>` : `
      <div class="mb-10 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <span class="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">${hero.source || 'News'}</span>
        <h2 class="text-3xl font-black text-white leading-snug">${hero.title}</h2>
        <p class="text-base text-slate-400 mt-4 leading-relaxed">${hero.description || ''}</p>
        <p class="text-xs text-slate-500 mt-4 font-medium italic">${formatDate(hero.pubDate)}</p>
      </div>`}
    </div>` : '';

  const restCards = rest.map(n => `
    <div class="flex gap-6 group py-8 border-t border-slate-800/50 items-start transition-all">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-2">
           <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">${n.source || 'News'}</span>
           <span class="h-px w-4 bg-slate-800"></span>
           <span class="text-[10px] text-slate-600 font-medium">${formatDate(n.pubDate)}</span>
        </div>
        <h3 class="text-lg font-bold text-slate-100 leading-snug group-hover:text-primary transition-colors">${n.title}</h3>
        <p class="text-[13px] text-slate-400 mt-3 leading-relaxed">${n.description || ''}</p>
      </div>
      ${n.imageUrl ? `
      <div class="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 shadow-xl ring-1 ring-white/5">
        <img src="${n.imageUrl}" alt="${n.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
      </div>` : ''}
    </div>`).join('');

  return heroCard + restCards;
}

export function generatePreviewShell(articleHtml: string, news: NewsItem[], aiSummary: string): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  // Parse Vocabulary into study cards
  const vocabItems = aiSummary
    .split(/\n+/)
    .map(l => l.trim())
    .filter(l => l.includes('**'))
    .map(l => {
      const wordMatch = l.match(/\*\*(.*?)\*\*(.*?): (.*)/);
      if (wordMatch) {
        return `
            <div class="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-primary/30 transition-all hover:bg-slate-800/50">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-primary font-bold text-lg">${wordMatch[1]}</span>
                <span class="text-xs text-slate-500 font-medium">${wordMatch[2]}</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed italic border-l-2 border-slate-700 pl-3">${wordMatch[3]}</p>
            </div>`;
      }
      return '';
    }).join('');

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
    .glass { background:rgba(255,255,255,0.02); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.05); }
    /* Remove strict line clamping to show full abstract */
  </style>
</head>
<body class="dark bg-[#0a0f14] text-slate-100 min-h-screen pb-28">

<!-- Brand Header -->
<div class="bg-primary/10 text-primary text-[10px] font-black text-center py-1.5 uppercase tracking-[0.3em] border-b border-primary/20">
  ${news[0]?.source || 'Intelligence'} · Cross-Domain Studio
</div>

<header class="sticky top-0 z-50 bg-[#0a0f14]/80 backdrop-blur-xl border-b border-slate-800/30">
  <div class="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
        <span class="material-symbols-outlined text-2xl">auto_stories</span>
      </div>
      <div>
        <p class="text-base font-black text-slate-100 tracking-tight">Deep Reading</p>
        <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest">${dateStr}</p>
      </div>
    </div>
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
      <span class="text-[11px] font-black text-slate-300 tracking-tighter">${timeStr}</span>
    </div>
  </div>
</header>

<main class="max-w-2xl mx-auto px-6 py-8">

  <!-- Main Feed Section (At Top) -->
  <section class="mb-16">
    <div class="flex items-center gap-4 mb-8">
      <h2 class="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">Latest Reports</h2>
      <div class="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent"></div>
    </div>
    ${newsCards(news)}
  </section>

  <!-- AI Vocabulary Section (At Bottom) -->
  <section id="ai-study" class="relative">
    <div class="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
    <div class="p-8 rounded-3xl border border-white/5 bg-slate-900/50 glass relative overflow-hidden">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <span class="material-symbols-outlined text-3xl">school</span>
          </div>
          <div>
            <h3 class="text-[10px] font-black text-primary uppercase tracking-[0.15em] mb-1">Language Arts</h3>
            <p class="text-xl font-black text-white">今日阅读难词汇总</p>
          </div>
        </div>
        <div class="text-[10px] font-bold text-slate-600 border border-slate-800 px-2 py-1 rounded">5 UNITS</div>
      </div>
      
      <div class="grid gap-4">
        ${vocabItems || `<p class="text-sm text-slate-500 italic py-4">正在从今日资讯中归纳难点词汇...</p>`}
      </div>
    </div>
  </section>

  <!-- RAW HTML Section -->
  <section class="mt-20 pb-12">
    <details class="group">
      <summary class="flex items-center justify-between cursor-pointer py-4 border-t border-slate-800/40 text-[10px] font-black text-slate-600 hover:text-slate-400 transition-colors list-none uppercase tracking-widest">
        <span class="flex items-center gap-2">
          <span class="material-symbols-outlined text-base">code</span>
          Raw Source Template
        </span>
        <span class="material-symbols-outlined text-base group-open:rotate-180 transition-transform">keyboard_arrow_down</span>
      </summary>
      <div class="mt-6 rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-white">
        ${articleHtml}
      </div>
    </details>
  </section>
</main>

<!-- Navigation -->
<nav class="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0f14]/80 backdrop-blur-2xl border-t border-white/5">
  <div class="flex justify-around items-center px-6 py-6 max-w-2xl mx-auto">
    <a href="#" class="flex flex-col items-center gap-1.5 text-primary">
      <span class="material-symbols-outlined text-2xl font-variation-fill">explore</span>
      <span class="text-[10px] font-black uppercase tracking-tight">Discover</span>
    </a>
    <a href="#ai-study" class="flex flex-col items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors">
      <span class="material-symbols-outlined text-2xl">book</span>
      <span class="text-[10px] font-black uppercase tracking-tight">Learn</span>
    </a>
    <a href="#" class="flex flex-col items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors">
      <span class="material-symbols-outlined text-2xl">person</span>
      <span class="text-[10px] font-black uppercase tracking-tight">Account</span>
    </a>
  </div>
  <div class="h-6"></div>
</nav>

</body>
</html>`;
}
