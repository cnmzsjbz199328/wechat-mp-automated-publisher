import { Env, NewsItem, AIOutput } from '../types';

// Separates AI abstract outputs reliably
const ABSTRACT_SEPARATOR = '---ITEM---';

export class AIService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async processWithAI(news: NewsItem[]): Promise<AIOutput> {
    const newsContent = news.map((item, index) => {
      const desc = (item.description || '').substring(0, 800);
      return `${index + 1}. ${item.title}\n${desc}`;
    }).join('\n\n');

    const prompt = `你是一位专业的英语学习助手。请针对以下新闻内容完成一个任务。

新闻内容:
${newsContent}

任务：挑选出 5 个读者最值学习的高级英语词汇或词组（VOCAB）。
- 选词标准：学术词汇、职场地道表达或专业术语。
- 输出格式（严格按照以下格式，每行一个词，不要有任何 Markdown 加粗符号）:
  [单词] | [词性] | [中文意思] | [体现该词用法的英文例句]

示例输出:
VOCAB:
Tailwinds | n. | 有利因素 | Global subsidy renewals provide strong tailwinds for solar developers.

请严格按照示例格式输出，不要有任何前言和后记。`;

    const fallback: AIOutput = {
      vocab: 'AI 学习助手暂时不可用，请阅读原文积累词汇。',
      digest: '',
    };

    try {
      const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [{ role: 'user', content: prompt }]
      });

      const raw: string = ((response as any).response || '').trim();
      if (!raw) return fallback;

      // Extract vocab block
      const vocabIdx = raw.indexOf('VOCAB:');
      const vocabBlock = vocabIdx !== -1 ? raw.substring(vocabIdx + 6).trim() : raw;

      return { vocab: vocabBlock || fallback.vocab, digest: '' };
    } catch (error) {
      console.error('AI Processing Error:', error);
      return fallback;
    }
  }

  /**
   * Generates a clean ~10-sentence English abstract for each news item.
   * All items are processed in a single AI call.
   */
  async generateAbstracts(news: NewsItem[]): Promise<string[]> {
    const calls = news.map(async (item) => {
      const raw = (item.description || item.title || '').substring(0, 2000);

      const prompt = `You are a professional news editor. Based on the information below, write a clean, well-structured English abstract of approximately 10 sentences.

Requirements:
- Cover the key facts, context, and significance of the story
- Be written in clear, readable English suitable for language learners
- Contain NO press contact details, NO "Share" buttons text, NO metadata labels, NO navigation links, NO "Related Terms", NO "Keep Exploring" sections
- Start directly with the news content, no preamble

Title: ${item.title}
Content: ${raw}

Write the abstract now:`;

      try {
        const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [{ role: 'user', content: prompt }]
        });
        const text: string = ((response as any).response || '').trim();
        return text || item.description || '';
      } catch {
        return item.description || '';
      }
    });

    return Promise.all(calls);
  }
}
