import { NewsItem } from '../../types';

/**
 * Interface for all news providers.
 */
export interface NewsProvider {
    fetchNews(): Promise<NewsItem[]>;
}
