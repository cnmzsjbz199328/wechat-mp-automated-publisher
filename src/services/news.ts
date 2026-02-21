import { NewsItem } from '../types';
import { API_URLS } from '../config/constants';

export class NewsService {
  async fetchYahooFinanceNews(): Promise<NewsItem[]> {
    const res = await fetch(API_URLS.YAHOO_FINANCE_RSS);
    const xml = await res.text();
    
    const items: NewsItem[] = [];
    const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    for (const match of matches) {
      const c = match[1];
      const t = c.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] || c.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const d = c.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
      
      if (t && d) {
        items.push({ title: t, pubDate: d });
      }
      
      if (items.length >= 5) break;
    }
    
    return items;
  }
}
