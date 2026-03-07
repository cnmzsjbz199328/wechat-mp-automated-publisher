import { NewsItem } from '../../types';
import { NewsProvider } from './types';
import { RSS_SOURCES } from '../../config/constants';
import { BaseRssProvider } from './base-rss';
import { NvidiaService } from '../nvidia';
import { pickByDate } from '../../utils';

/**
 * MITProvider — fetches one MIT Research News article per day (date-seeded),
 * decomposes it into 5 parts via Nemotron, and returns them as 5 NewsItem objects.
 *
 * The caller (NewsFactory / handleDomainLive) sees a standard NewsItem[]
 * and is unaware of the internal Nemotron call — consistent with how
 * GrokNewsProvider uses the xAI API internally.
 */
export class MITProvider implements NewsProvider {
    private readonly rss: BaseRssProvider;
    private readonly nvidia = new NvidiaService();
    private readonly MAX_ITEMS = 8; // candidate pool for date-based rotation

    constructor() {
        // We subclass via composition so we can override the parse limit
        this.rss = new MITRssHelper();
    }

    async fetchNews(): Promise<NewsItem[]> {
        // 1. Fetch candidate pool (up to MAX_ITEMS)
        let candidates: NewsItem[];
        try {
            candidates = await this.rss.fetchNews();
        } catch (err) {
            throw new Error(`MITProvider: RSS fetch failed — ${err}`);
        }

        // 2. Date-seeded pick
        const chosen = pickByDate(candidates);

        // 3. Build clean plain text (BaseRssProvider already strips HTML via clean())
        //    description at this point is already HTML-stripped by BaseRssProvider
        const rawText = chosen.description || chosen.title || '';
        if (!rawText) throw new Error('MITProvider: chosen article has no text content');

        // 4. Decompose with Nemotron
        const parts = await this.nvidia.decomposeArticle(rawText, 'science');

        // 5. Map parts → NewsItem[]
        return parts.map((p, idx) => ({
            title: p.title,
            description: p.body,
            link: chosen.link,
            source: 'MIT Research News',
            pubDate: chosen.pubDate,
            imageUrl: idx === 0 ? (chosen.imageUrl ?? undefined) : undefined,
        }));
    }
}

/**
 * Internal RSS helper — extends BaseRssProvider to raise the item cap to 8.
 */
class MITRssHelper extends BaseRssProvider {
    constructor() { super(RSS_SOURCES.MIT, 'MIT Research News'); }

    // Override to collect up to 8 items instead of the default 5
    override async fetchNews(): Promise<NewsItem[]> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12_000);

        let xml: string;
        try {
            const res = await fetch(this.url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                },
            });
            xml = await res.text();
        } finally {
            clearTimeout(timeout);
        }

        const items: NewsItem[] = [];
        const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
        for (const match of matches) {
            const item = this.parseItem(match[1]);
            if (item) items.push(item);
            if (items.length >= 8) break;
        }

        if (items.length === 0) throw new Error('MITProvider: no items from RSS');
        return items;
    }
}
