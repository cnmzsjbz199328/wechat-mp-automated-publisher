import { BaseRssProvider } from './base-rss';
import { RSS_SOURCES } from '../../config/constants';
import { NewsItem } from '../../types';

export class NasaProvider extends BaseRssProvider {
    constructor() { super(RSS_SOURCES.NASA, 'NASA'); }

    protected override parseItem(content: string): NewsItem | null {
        const item = super.parseItem(content);
        if (!item) return null;

        // Problem: BaseRssProvider picks whichever is longer (description vs content:encoded).
        // NASA's content:encoded is the entire rendered HTML page (nav bars, image captions,
        // "Keep Exploring", "Related Terms", etc.) — always much longer than the clean teaser.
        // Solution: directly extract the short <description> CDATA NASA writes for each item,
        // which is a clean 1-2 sentence summary without any boilerplate.
        const teaser = this.extractNasaTeaser(content);
        if (teaser) item.description = teaser;

        return item;
    }

    private extractNasaTeaser(content: string): string {
        const m = content.match(/<description>[\s\S]*?<!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);
        if (!m?.[1]) return '';
        return m[1]
            .replace(/&#8230;/g, '...')   // ellipsis entity used in truncated excerpts
            .replace(/\[&#8230;\]/g, '.')  // "[…]" → "."
            .replace(/&#\d+;/g, ' ')      // other numbered entities
            .replace(/<[^>]*>/gm, '')     // any stray HTML tags
            .replace(/\s+/g, ' ')
            .trim();
    }
}
