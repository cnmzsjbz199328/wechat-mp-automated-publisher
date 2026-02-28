import { BaseRssProvider } from './base-rss';
import { RSS_SOURCES } from '../../config/constants';
import { NewsItem } from '../../types';

export class ArsProvider extends BaseRssProvider {
    constructor() { super(RSS_SOURCES.ARS, 'Ars Technica'); }

    protected override parseItem(content: string): NewsItem | null {
        const item = super.parseItem(content);
        if (item && item.description) {
            // Robustly strip common Ars RSS footers and residual markers
            // Use while loop or multiple replaces since they appear in sequence
            let desc = item.description;
            const patterns = [
                /\s*\]\]>\s*$/g,
                /\s*Comments\s*$/i,
                /\s*Read full article\s*$/i
            ];

            let changed = true;
            while (changed) {
                changed = false;
                for (const p of patterns) {
                    const newDesc = desc.replace(p, '');
                    if (newDesc !== desc) {
                        desc = newDesc;
                        changed = true;
                    }
                }
            }
            item.description = desc.trim();
        }
        return item;
    }
}
