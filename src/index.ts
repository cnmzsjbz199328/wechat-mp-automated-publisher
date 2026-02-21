import { Env } from './types';
import { WeChatService } from './services/wechat';
import { NewsService } from './services/news';
import { AIService } from './services/ai';
import { generateArticleHtml } from './templates/article';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    
    if (pathname !== '/finance-live') {
      return Response.json({ status: 'ready' });
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
