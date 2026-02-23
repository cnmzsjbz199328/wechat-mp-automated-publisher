import { Env } from './types';
import { WeChatService } from './services/wechat';
import { NewsFactory } from './services/news';
import { AIService } from './services/ai';
import { generateArticleHtml } from './templates/article';
import { generatePreviewShell } from './templates/preview';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    // Dynamic Route Detection: matches /{domain}-preview-html, /{domain}-live, /{domain}-preview
    const match = pathname.match(/^\/([A-Za-z]+)-(preview-html|live|preview)$/);

    // Legacy mapping and defaults
    let domain = match ? match[1].toUpperCase() : 'FINANCE';
    let action = match ? match[2] : '';

    if (!match) {
      if (pathname === '/finance-live') { domain = 'FINANCE'; action = 'live'; }
      else if (pathname === '/preview-html') { domain = 'FINANCE'; action = 'preview-html'; }
      else if (pathname === '/preview') { domain = 'FINANCE'; action = 'preview'; }
      else {
        return Response.json({ status: 'ready', domains: ['FINANCE', 'NASA', 'ARS'] });
      }
    }

    const newsProvider = NewsFactory.getProvider(domain);
    const aiService = new AIService(env);
    const wechatService = new WeChatService(env);

    try {
      // 1. Fetch news for the specific domain
      const news = await newsProvider.fetchNews();

      // 2. Process with AI for vocabulary + digest (single call)
      const aiOutput = await aiService.processWithAI(news);

      // 3. Action: Browser Preview (HTML)
      if (action === 'preview-html') {
        const html = generatePreviewShell(news, aiOutput.vocab, aiOutput.digest);
        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }

      // 4. Action: JSON Preview
      if (action === 'preview') {
        const htmlContent = generateArticleHtml(aiOutput.vocab, news);
        return Response.json({
          domain,
          newsCount: news.length,
          news,
          digest: aiOutput.digest,
          vocab: aiOutput.vocab,
          htmlLength: htmlContent.length,
          htmlPreview: htmlContent.substring(0, 300) + '...',
        });
      }

      // 5. Action: Live Publish to WeChat
      if (action === 'live') {
        const token = await wechatService.getAccessToken();

        // Upload cover thumb + all article images concurrently
        const [thumbMediaId, ...uploadedUrls] = await Promise.all([
          wechatService.uploadThumb(token),
          ...news.map(n =>
            n.imageUrl ? wechatService.uploadImage(token, n.imageUrl) : Promise.resolve(null)
          )
        ]);

        // Replace original image URLs with WeChat CDN URLs
        news.forEach((n, i) => {
          if (uploadedUrls[i]) n.imageUrl = uploadedUrls[i]!;
        });

        // Domain-specific titles
        const titles: Record<string, string> = {
          FINANCE: '【实时追踪】美股动态 & AI解读',
          NASA: '【星际探索】NASA 航天前沿速递',
          ARS: '【科技深思考】Ars Technica 技术洞察'
        };

        const htmlContent = generateArticleHtml(aiOutput.vocab, news);
        const draftRes = await wechatService.createDraft(
          token,
          titles[domain] || `【${domain}】今日动态预览`,
          '大侠',
          htmlContent,
          thumbMediaId,
          aiOutput.digest
        );

        return Response.json({ domain, result: draftRes });
      }

      return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
      console.error(`Error processing ${domain} ${action}:`, error);
      return Response.json({ domain, error: error.message }, { status: 500 });
    }
  }
};
