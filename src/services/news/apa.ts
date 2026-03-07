import { NewsItem } from '../../types';
import { NewsProvider } from './types';
import { RSS_SOURCES } from '../../config/constants';
import { BaseRssProvider } from './base-rss';
import { NvidiaService } from '../nvidia';
import { pickByDate } from '../../utils';

/**
 * APAProvider — fetches one APA Blog article per day (date-seeded),
 * decomposes it into 5 engagement-friendly parts via Nemotron (philosophy mode),
 * and returns them as 5 NewsItem objects.
 *
 * APA descriptions are plain text (no HTML stripping needed).
 * A trailing attribution line is removed before sending to the model.
 */
export class APAProvider implements NewsProvider {
    private readonly rss: BaseRssProvider;
    private readonly nvidia = new NvidiaService();
    private readonly MAX_ITEMS = 8;

    constructor() {
        this.rss = new APARssHelper();
    }

    async fetchNews(): Promise<NewsItem[]> {
        // 1. Fetch candidate pool
        let candidates: NewsItem[];
        try {
            candidates = await this.rss.fetchNews();
        } catch (err) {
            throw new Error(`APAProvider: RSS fetch failed — ${err}`);
        }

        // 2. Date-seeded pick
        const chosen = pickByDate(candidates);

        // 3. Clean: remove the standard APA blog attribution footer
        const rawText = (chosen.description || chosen.title || '')
            .replace(/The post .+ first appeared on Blog of the APA\.\s*$/, '')
            .trim();

        if (!rawText) throw new Error('APAProvider: chosen article has no text content');

        // 4. Decompose with Nemotron (philosophy mode)
        const parts = await this.nvidia.decomposeArticle(rawText, 'philosophy');

        // 5. Map parts → NewsItem[]
        return parts.map((p, idx) => ({
            title: p.title,
            description: p.body,
            link: chosen.link,
            source: 'APA Blog',
            pubDate: chosen.pubDate,
            imageUrl: idx === 0 ? (chosen.imageUrl ?? undefined) : undefined,
        }));
    }
}

/**
 * Internal RSS helper — extends BaseRssProvider to raise the item cap to 8.
 */
class APARssHelper extends BaseRssProvider {
    constructor() { super(RSS_SOURCES.APA, 'APA Blog'); }

    override async fetchNews(): Promise<NewsItem[]> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);

        let xml: string;
        try {
            const res = await fetch(this.url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml,application/rss+xml,application/atom+xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                },
            });

            if (!res.ok) {
                throw new Error(`APA RSS returned HTTP ${res.status}`);
            }
            xml = await res.text();
        } finally {
            clearTimeout(timeout);
        }

        // Support both RSS <item> and Atom <entry> formats (WordPress can serve either)
        const rssMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
        const atomMatches = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
        const rawMatches = rssMatches.length >= atomMatches.length ? rssMatches : atomMatches;

        const items: NewsItem[] = [];
        for (const match of rawMatches) {
            const item = this.parseItem(match[1]);
            if (item) items.push(item);
            if (items.length >= 8) break;
        }

        if (items.length === 0) {
            // Log a snippet for debugging
            console.error(`APARssHelper: parsed 0 items. XML preview: ${xml.slice(0, 500)}`);
            throw new Error('APAProvider: no items from RSS');
        }
        return items;
    }
}
