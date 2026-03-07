import { Env } from '../../types';
import { NewsProvider } from './types';

import { FinanceProvider } from './finance';
import { NasaProvider } from './nasa';
import { ArsProvider } from './ars';
import { GrokNewsProvider } from './grok';
import { ScienceDailyProvider } from './sciencedaily';
import { MITProvider } from './mit';
import { APAProvider } from './apa';

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
            case 'SCIENCEDAILY': return new ScienceDailyProvider();
            case 'MIT': return new MITProvider();
            case 'APA': return new APAProvider();
            case 'FINANCE':
            default: return new FinanceProvider();
        }
    }
}
