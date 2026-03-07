import { UNIFIED_AI } from '../config/constants';

export type DecomposeMode = 'science' | 'philosophy';

export interface DecomposedPart {
    index: number;
    title: string;
    body: string;
}

/**
 * NvidiaService — wraps the Nemotron large model endpoint for long-article
 * decomposition. Used internally by MITProvider and APAProvider.
 *
 * Safety:  up to 2 retries on bad output, then falls back to plain text split.
 * Input:   raw article text (pre-cleaned, max 3000 words enforced here).
 * Output:  exactly 5 DecomposedPart objects — never throws.
 */
export class NvidiaService {
    private readonly endpoint = UNIFIED_AI.LARGE_NVIDIA;
    private readonly MAX_WORDS = 3000;
    private readonly MAX_RETRIES = 2;

    async decomposeArticle(text: string, mode: DecomposeMode): Promise<DecomposedPart[]> {
        const truncated = this.truncate(text);
        const messages = this.buildMessages(truncated, mode);

        for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                const resp = await fetch(this.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages,
                        options: { response_format: { type: 'json_object' } },
                    }),
                });

                if (!resp.ok) {
                    console.error(`NvidiaService: HTTP ${resp.status} on attempt ${attempt + 1}`);
                    continue;
                }

                const data = await resp.json() as { success: boolean; content: string };
                if (!data.success || !data.content) continue;

                const parsed = this.extractJson(data.content);
                const parts = parsed?.parts;
                if (this.validate(parts)) return this.normalize(parts);

                console.warn(`NvidiaService: invalid parts on attempt ${attempt + 1}, retrying...`);
            } catch (err) {
                console.error(`NvidiaService: attempt ${attempt + 1} failed:`, err);
            }
        }

        console.warn('NvidiaService: all retries exhausted, using text fallback');
        return this.fallback(truncated);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private buildMessages(text: string, mode: DecomposeMode) {
        const systemMap: Record<DecomposeMode, string> = {
            science: 'You are a professional science communicator transforming academic research into engaging English content for WeChat Official Accounts.',
            philosophy: 'You are a philosophy communicator who makes complex ideas accessible to general readers through vivid analogies and real-world examples.',
        };
        const userMap: Record<DecomposeMode, string> = {
            science: `Split and rewrite the following article into EXACTLY 5 INDEPENDENT ENGLISH SECTIONS.\nRules:\n1. Each section needs a catchy, BuzzFeed/Medium-style English title\n2. Each body should be 150-250 words, vivid and jargon-free\n3. Sections must cover different aspects and each stand alone\n4. DO NOT use markdown, headers, bullet points, or any explanation text\n5. Output ONLY raw JSON — nothing before or after the JSON object\n\nRequired output format:\n{"parts":[{"index":1,"title":"Title One","body":"Body text..."},{"index":2,"title":"Title Two","body":"Body text..."},{"index":3,"title":"Title Three","body":"Body text..."},{"index":4,"title":"Title Four","body":"Body text..."},{"index":5,"title":"Title Five","body":"Body text..."}]}\n\nArticle:\n${text}\n\nRemember: output ONLY the JSON object above.`,
            philosophy: `Split and rewrite the following philosophy article into EXACTLY 5 INDEPENDENT SECTIONS for general readers.\nRules:\n1. Each title must spark curiosity (e.g. "What Chess Teaches Us About Free Will")\n2. Each body should be 150-250 words using everyday examples — zero jargon\n3. If a technical term appears, explain it in one relatable sentence\n4. Tone: conversational, smart, slightly provocative\n5. Output ONLY raw JSON — nothing before or after the JSON object\n\nRequired output format:\n{"parts":[{"index":1,"title":"Title One","body":"Body text..."},{"index":2,"title":"Title Two","body":"Body text..."},{"index":3,"title":"Title Three","body":"Body text..."},{"index":4,"title":"Title Four","body":"Body text..."},{"index":5,"title":"Title Five","body":"Body text..."}]}\n\nArticle:\n${text}\n\nRemember: output ONLY the JSON object above.`,
        };
        return [
            { role: 'system', content: systemMap[mode] },
            { role: 'user', content: userMap[mode] },
        ];
    }

    /** Robust JSON extractor: try full parse first, then scan for largest { } block. */
    private extractJson(raw: string): any {
        try { return JSON.parse(raw.trim()); } catch { /* fall through */ }
        const first = raw.indexOf('{');
        const last = raw.lastIndexOf('}');
        if (first === -1 || last <= first) return null;
        try { return JSON.parse(raw.slice(first, last + 1)); } catch { return null; }
    }

    private validate(parts: any): parts is DecomposedPart[] {
        return Array.isArray(parts) &&
            parts.length === 5 &&
            parts.every(p => p && typeof p.title === 'string' && p.title.length > 0 &&
                typeof p.body === 'string' && p.body.length > 50);
    }

    private normalize(parts: any[]): DecomposedPart[] {
        return parts.map((p, i) => ({
            index: p.index ?? (i + 1),
            title: String(p.title).trim(),
            body: String(p.body).trim(),
        }));
    }

    /** Splits text into 5 even chunks as last-resort fallback. Never throws. */
    private fallback(text: string): DecomposedPart[] {
        const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
        const chunkSize = Math.ceil(sentences.length / 5);
        return Array.from({ length: 5 }, (_, i) => ({
            index: i + 1,
            title: `Part ${i + 1}`,
            body: sentences.slice(i * chunkSize, (i + 1) * chunkSize).join(' ') || text.slice(i * 400, (i + 1) * 400),
        }));
    }

    /** Caps input to MAX_WORDS words to stay within model context limits. */
    private truncate(text: string): string {
        const words = text.split(/\s+/);
        return words.length > this.MAX_WORDS
            ? words.slice(0, this.MAX_WORDS).join(' ')
            : text;
    }
}
