import { NewsItem } from '../../types';
import { NewsProvider } from './types';

/**
 * Base class for RSS-based news providers.
 * Handles common fetch and regex parsing logic.
 */
export abstract class BaseRssProvider implements NewsProvider {
    constructor(protected url: string, protected sourceName: string) { }

    async fetchNews(): Promise<NewsItem[]> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        let xml: string;
        try {
            const res = await fetch(this.url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
            const c = match[1];
            const item = this.parseItem(c);
            if (item) {
                items.push(item);
            }
            if (items.length >= 5) break;
        }

        if (items.length === 0) {
            throw new Error(`No news items fetched from ${this.sourceName} — source may have changed.`);
        }

        return items;
    }

    /**
     * Default parser for standard RSS items. 
     * Specific providers can override this if the XML structure is unique.
     */
    protected parseItem(content: string): NewsItem | null {
        const titleMatch = content.match(/<title>[\s\S]*?(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
        const title = titleMatch?.[1] || titleMatch?.[2];

        const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1];
        const link = content.match(/<link>([\s\S]*?)<\/link>/i)?.[1];

        // 1. Extract potential descriptions from multiple tags
        const descMatch = content.match(/<description>[\s\S]*?(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/i);
        const encodedMatch = content.match(/<content:encoded>[\s\S]*?(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/content:encoded>/i);

        let descRaw = descMatch?.[1] || descMatch?.[2] || "";
        let encodedRaw = encodedMatch?.[1] || encodedMatch?.[2] || "";

        // Helper to clean and decode
        const clean = (str: string) => {
            if (!str) return "";
            return str
                // Decode numeric hex entities first (e.g. &#x2019; → ')
                .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
                // Decode numeric decimal entities (e.g. &#8217; → ')
                .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
                // Named entities
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .replace(/&#039;/g, "'")
                .replace(/&#39;/g, "'")
                .replace(/&lsquo;/g, '\u2018')
                .replace(/&rsquo;/g, '\u2019')
                .replace(/&ldquo;/g, '\u201c')
                .replace(/&rdquo;/g, '\u201d')
                .replace(/&hellip;/g, '…')
                .replace(/&ndash;/g, '–')
                .replace(/&mdash;/g, '—')
                .replace(/&nbsp;/g, ' ')
                .replace(/<[^>]*>?/gm, '') // Strip HTML tags
                .trim();
        };

        const descClean = clean(descRaw);
        const encodedClean = clean(encodedRaw);

        // Choose the most substantial one
        // Some feeds (like NASA/LitHub) truncate <description> and put full text in <content:encoded>
        let description = (encodedClean.length > descClean.length) ? encodedClean : descClean;

        // 2. Extract image URL
        let imageUrl = content.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ||
            content.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] ||
            content.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1];

        if (!imageUrl) {
            const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
            if (imgMatch) imageUrl = imgMatch[1];
        }

        if (!title || !pubDate) return null;

        return {
            title: clean(title),
            pubDate,
            link,
            source: this.sourceName,
            imageUrl,
            description
        };
    }
}
