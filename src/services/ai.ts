import { Env, NewsItem } from '../types';

export class AIService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async processWithAI(news: NewsItem[]): Promise<string> {
    const prompt = '资深美股分析师点评美股新闻：' + news.map(n => n.title).join('; ');
    
    try {
      const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [{ role: 'user', content: prompt }]
      });
      
      return response.response || response.text || 'AI分析中...';
    } catch (error) {
      console.error('AI processing failed:', error);
      return 'AI分析暂时不可用，请稍后再试。';
    }
  }
}
