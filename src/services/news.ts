import { NewsItem } from '../types';
import { RSS_SOURCES } from '../config/constants';

/**
 * Interface for all news providers.
 */
export interface NewsProvider {
  fetchNews(): Promise<NewsItem[]>;
}

/**
 * Base class for RSS-based news providers.
 * Handles common fetch and regex parsing logic.
 */
abstract class BaseRssProvider implements NewsProvider {
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
    const title = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
      content.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
    const link = content.match(/<link>([\s\S]*?)<\/link>/)?.[1];

    // Extract description (prefer CDATA if exists)
    let description = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
      content.match(/<description>([\s\S]*?)<\/description>/)?.[1];

    // Clean description: remove HTML tags
    if (description) {
      description = description.replace(/<[^>]*>?/gm, '').trim();
    }

    // Extract image URL
    const imageUrl = content.match(/<media:content[^>]+url="([^"]+)"/)?.[1] ||
      content.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] ||
      content.match(/<enclosure[^>]+url="([^"]+)"/)?.[1];

    if (!title || !pubDate) return null;

    return {
      title,
      pubDate,
      link,
      source: this.sourceName,
      imageUrl,
      description
    };
  }
}

/**
 * Concrete Providers for different domains
 */
class FinanceProvider extends BaseRssProvider {
  constructor() { super(RSS_SOURCES.FINANCE, 'CNBC'); }
}

class NasaProvider extends BaseRssProvider {
  constructor() { super(RSS_SOURCES.NASA, 'NASA'); }
}

class LitHubProvider extends BaseRssProvider {
  constructor() { super(RSS_SOURCES.LITHUB, 'LitHub'); }
}

class ArsProvider extends BaseRssProvider {
  constructor() { super(RSS_SOURCES.ARS, 'Ars Technica'); }
}

/**
 * Factory class to create providers
 */
export class NewsFactory {
  static getProvider(domain?: string): NewsProvider {
    const d = domain?.toUpperCase();
    switch (d) {
      case 'NASA': return new NasaProvider();
      case 'LITHUB': return new LitHubProvider();
      case 'ARS': return new ArsProvider();
      case 'FINANCE':
      default: return new FinanceProvider();
    }
  }
}

/**
 * Legacy support for NewsService (defaulting to Finance/CNBC)
 */
export class NewsService {
  async fetchYahooFinanceNews(): Promise<NewsItem[]> {
    return NewsFactory.getProvider('FINANCE').fetchNews();
  }
}
