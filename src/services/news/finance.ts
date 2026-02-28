import { BaseRssProvider } from './base-rss';
import { RSS_SOURCES } from '../../config/constants';

/**
 * Concrete Provider for Finance domain
 */
export class FinanceProvider extends BaseRssProvider {
    constructor() {
        super(RSS_SOURCES.FINANCE, 'MarketWatch');
    }
}
