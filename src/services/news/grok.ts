import { NewsItem, Env } from '../../types';
import { API_URLS } from '../../config/constants';
import { NewsProvider } from './types';

/**
 * GrokNewsProvider fetches news from xAI's Grok API with web search.
 */
export class GrokNewsProvider implements NewsProvider {
    private env: Env;

    constructor(env: Env) {
        this.env = env;
    }

    async fetchNews(): Promise<NewsItem[]> {
        const SYSTEM_PROMPT = `You are a professional Australian immigration news researcher.

Your task is to perform a targeted search on Australian government websites and authoritative news outlets for immigration policies, visa changes, or migration statistics from the LAST 7 DAYS.

Use the web_search tool to find exactly 5 news articles.
Focus on official and highly authoritative sources like:
- immi.homeaffairs.gov.au
- homeaffairs.gov.au
- abc.net.au
- sbs.com.au
- theguardian.com/australia-news

Output the result strictly as a JSON object with the following structure:
{
  "items": [
    {
      "title": "Article headline",
      "source": "Media outlet or government department name",
      "link": "Direct URL to the article",
      "pubDate": "RFC 2822 date string e.g. Thu, 20 Feb 2026 21:27:00 +0000",
      "description": "80-100 word English summary."
    }
  ]
}
Ensure the response is valid JSON format. Do not use markdown blocks.`;

        const USER_QUERY = "Search for Australian immigration policy and visa changes in the last 7 days and output structured JSON.";

        const payload = {
            model: "grok-4-1-fast-reasoning",
            input: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: USER_QUERY }
            ],
            tools: [
                { type: "web_search" }
            ],
            response_format: { type: "json_object" }
        };

        const res = await fetch('https://api.x.ai/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.env.XAI_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`XAI API Error: ${res.status} ${errorText}`);
        }

        const response: any = await res.json();
        const output = response.output;
        let content = "";

        if (Array.isArray(output)) {
            const messageItem = output.find((item: any) => item.type === 'message');
            if (messageItem && Array.isArray(messageItem.content)) {
                const textPart = messageItem.content.find((part: any) => part.type === 'output_text');
                content = textPart ? textPart.text : "";
            }
        } else if (output && output.content) {
            content = output.content;
        }

        if (!content) {
            throw new Error('No content in XAI response');
        }

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            throw new Error('Could not parse JSON from Grok output');
        }

        const items = parsed.items ?? [];

        return items.map((item: any) => ({
            title: item.title,
            pubDate: item.pubDate,
            link: item.link,
            source: item.source,
            description: item.description,
            imageUrl: API_URLS.DEFAULT_THUMB_IMAGE
        }));
    }
}
