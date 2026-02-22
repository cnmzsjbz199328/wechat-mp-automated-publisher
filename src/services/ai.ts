import { Env, NewsItem } from '../types';

export class AIService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async processWithAI(news: NewsItem[]): Promise<string> {
    const newsContent = news.map((item, index) => `${index + 1}. ${item.title}\n${item.description || ''}`).join('\n\n');

    const prompt = `你是一位专业的英语学习助手和财经/科技分析师。请针对以下新闻内容，挑选出 5 个读者最值得学习的高级英语词汇（词组）：
    
    新闻内容:
    ${newsContent}

    要求:
    1. 选词标准：学术词汇、职场地道表达或专业术语。
    2. 输出格式（严格按照以下 Markdown 列表格式）:
    * **[单词]** (中文意思): [一段体现该词用法且与新闻背景高度相关的英文例句]
    
    3. 总共输出 5 个词。
    4. 不要输出任何前言和后记，直接开始列表。`;

    try {
      const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [{ role: 'user', content: prompt }]
      });
      return (response as any).response || 'AI 学习助手暂时不可用。';
    } catch (error) {
      console.error('AI Processing Error:', error);
      return 'AI 学习助手暂时不可用，请阅读原文积累词汇。';
    }
  }
}

