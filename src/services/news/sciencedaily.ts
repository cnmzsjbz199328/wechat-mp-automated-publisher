import { BaseRssProvider } from './base-rss';
import { RSS_SOURCES } from '../../config/constants';

/**
 * Concrete provider for ScienceDaily.
 * Clean RSS feed with plain-text descriptions (~120 words each).
 * No HTML stripping or special parsing required.
 */
export class ScienceDailyProvider extends BaseRssProvider {
    constructor() {
        super(RSS_SOURCES.SCIENCEDAILY, 'ScienceDaily');
    }
}
