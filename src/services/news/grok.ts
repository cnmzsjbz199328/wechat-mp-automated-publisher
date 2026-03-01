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
        // Define specific sub-niches to diversify immigration news and avoid repetition
        const subNiches = [
            "Skilled migration (subclass 189/190/491) state nomination and points test updates",
            "Employer sponsored visas (subclass 482/186) and occupation list/salary threshold changes",
            "Student (500) and Graduate (485) visa policy and migration strategy updates",
            "Partner, child, and parent migration program developments",
            "Australian Migration Strategy, annual planning levels, and cap updates",
            "Regional migration initiatives, DAMA agreements, and rural visa programs",
            "Business innovation and investment (BIIP) visa reforms",
            "Visa processing times, statistics, and citizenship residence requirements",
            "Skills assessment and occupational licensing for international workers",
            "Working Holiday Maker (417/462) and short-term visa policy changes"
        ];

        // Randomly pick one niche for this fetch
        const selectedNiche = subNiches[Math.floor(Math.random() * subNiches.length)];

        const SYSTEM_PROMPT = `You are a professional Australian immigration policy researcher specializing in ${selectedNiche}.

Your task is to perform a targeted search on Australian government websites (primarily homeaffairs.gov.au) and authoritative migration sources for CURRENT active policy information, official guidelines, or significant recent changes regarding [${selectedNiche}].

Use the web_search tool to find exactly 5 key policy points or updates.
Focus on:
- Core eligibility requirements
- Current visa conditions and criteria
- Official guidelines and recent policy trends
- Latest invitation data or quota information if applicable

Output the result strictly as a JSON object with the following structure:
{
  "items": [
    {
      "title": "Policy point or update headline",
      "source": "Government department or official source name",
      "link": "Direct URL to the official policy page or news article",
      "pubDate": "Current date or date of last policy update (RFC 2822 string)",
      "description": "80-100 word English explanation of the policy or change."
    }
  ]
}
Ensure the response is valid JSON format. Do not use markdown blocks.`;

        const USER_QUERY = `Search for current active policies, official guidelines, and key requirements specifically regarding [${selectedNiche}] in Australia and output as structured JSON.`;

        const payload = {
            model: "grok-4-1-fast-non-reasoning",
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
            description: item.description
        }));
    }
}
