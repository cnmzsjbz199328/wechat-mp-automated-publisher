import { Env } from './types';
import { WeChatService } from './services/wechat';
import { NewsService } from './services/news';
import { AIService } from './services/ai';
import { generateArticleHtml } from './templates/article';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    // TEMP: get Worker egress IP for WeChat whitelist — remove after use
    if (pathname === '/check-ip') {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json() as { ip: string };
      return Response.json({ workerEgressIp: ipData.ip, note: 'Add this IP to WeChat whitelist, then delete this route' });
    }

    if (pathname !== '/finance-live' && pathname !== '/preview') {
      return Response.json({ status: 'ready' });
    }


    // Phase 1 preview: news + AI + HTML only (no WeChat)
    if (pathname === '/preview') {
      const newsService = new NewsService();
      const aiService = new AIService(env);

      const news = await newsService.fetchYahooFinanceNews();
      const aiSummary = await aiService.processWithAI(news);
      const htmlContent = generateArticleHtml(aiSummary, news);

      return Response.json({
        phase: 'Phase 1 - RSS + AI Validation',
        newsCount: news.length,
        news,
        aiSummary,
        htmlLength: htmlContent.length,
        htmlPreview: htmlContent.substring(0, 300) + '...',
      });
    }


    try {
      // Initialize services
      const wechatService = new WeChatService(env);
      const newsService = new NewsService();
      const aiService = new AIService(env);

      // 1. Fetch news
      const news = await newsService.fetchYahooFinanceNews();

      // 2. Process with AI
      const aiSummary = await aiService.processWithAI(news);

      // 3. Generate HTML content
      const htmlContent = generateArticleHtml(aiSummary, news);

      // 4. Get WeChat access token
      const token = await wechatService.getAccessToken();

      // 5. Upload thumbnail
      const thumbMediaId = await wechatService.uploadThumb(token);

      // 6. Create draft
      const draftRes = await wechatService.createDraft(
        token,
        '【实时追踪】美股动态 & AI解读',
        '大侠',
        htmlContent,
        thumbMediaId
      );

      return Response.json(draftRes);
    } catch (error: any) {
      console.error('Error processing request:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  }
};
