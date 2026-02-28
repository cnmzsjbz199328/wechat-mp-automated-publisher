import { Env } from '../../types';
import { NewsProvider } from './types';

import { FinanceProvider } from './finance';
import { NasaProvider } from './nasa';
import { ArsProvider } from './ars';
import { GrokNewsProvider } from './grok';

export * from './types';

/**
 * Factory class to create providers
 */
export class NewsFactory {
    static getProvider(domain: string, env: Env): NewsProvider {
        const d = domain?.toUpperCase();
        switch (d) {
            case 'IMMIGRATION': return new GrokNewsProvider(env);
            case 'NASA': return new NasaProvider();
            case 'ARS': return new ArsProvider();
            case 'FINANCE':
            default: return new FinanceProvider();
        }
    }
}
