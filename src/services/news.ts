import { NewsItem } from '../types';
import { API_URLS } from '../config/constants';

export class NewsService {
  async fetchYahooFinanceNews(): Promise<NewsItem[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let xml: string;
    try {
      const res = await fetch(API_URLS.YAHOO_FINANCE_RSS, {
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
      const t = c.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || c.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const d = c.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
      const link = c.match(/<link>([\s\S]*?)<\/link>/)?.[1];
      const source = c.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1];
      const imageUrl = c.match(/<media:content[^>]+url="([^"]+)"/)?.[1];

      if (t && d) {
        items.push({ title: t, pubDate: d, link, source, imageUrl });
      }

      if (items.length >= 5) break;
    }


    if (items.length === 0) {
      throw new Error('No news items fetched — RSS source may have changed or is unreachable');
    }

    return items;
  }
}
