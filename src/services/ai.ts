import { Env, NewsItem } from '../types';

export class AIService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async processWithAI(news: NewsItem[]): Promise<string> {
    const newsContent = news.map((item, index) => {
      const desc = (item.description || '').substring(0, 800);
      return `${index + 1}. ${item.title}\n${desc}`;
    }).join('\n\n');

    const prompt = `你是一位专业的英语学习助手。请针对以下新闻内容，挑选出 5 个读者最值得学习的高级英语词汇或词组。
    
    新闻内容:
    ${newsContent}

    要求:
    1. 选词标准：学术词汇、职场地道表达或专业术语。
    2. 输出格式（严格按照以下格式，每行一个词，不要有任何 Markdown 加粗符号）:
    [单词] | [词性] | [中文意思] | [体现该词用法的英文例句]
    
    示例输出:
    Tailwinds | n. | 有利因素 | Global subsidy renewals provide strong tailwinds for solar developers.
    
    3. 总共输出 5 个词。
    4. 不要输出任何前言和后记。`;

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

