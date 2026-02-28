import { NewsItem } from '../types';

export class TranslationService {
    private endpoint = 'https://unified-ai-backend.tj15982183241.workers.dev/v1/models/medium';

    /**
     * Translates a batch of news items into Simplified Chinese using the unified AI backend.
     * Mutates the news items in-place by adding the aiTranslation property.
     */
    async translateBatch(news: NewsItem[]): Promise<void> {
        if (!news || news.length === 0) return;

        const newsData = news.map((item, index) => ({
            id: index + 1,
            title: item.title,
            content: (item.description || item.title || '').substring(0, 1000)
        }));

        const prompt = `You are an expert translator. Translate the following news items into natural, professional Simplified Chinese (简体中文). 
Output ONLY a JSON array of objects, where each object has "id", "title", and "content" fields matching the input. Do not include any intro, outro, or markdown code blocks.

Input Data:
${JSON.stringify(newsData, null, 2)}`;

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) {
                console.error(`Translation API error: ${response.status}`);
                return;
            }

            const data = await response.json() as { success: boolean; content: string };
            if (!data.success || !data.content) return;

            // The backend returns a string content, we need to parse it as JSON
            let translatedItems;
            try {
                // Remove potential markdown wrappers if the model adds them despite instructions
                const cleanContent = data.content.replace(/```json|```/g, '').trim();
                translatedItems = JSON.parse(cleanContent);
            } catch (e) {
                console.error("Failed to parse translation JSON:", e);
                return;
            }

            if (Array.isArray(translatedItems)) {
                translatedItems.forEach((tItem: any) => {
                    const originalIndex = tItem.id - 1;
                    if (news[originalIndex]) {
                        news[originalIndex].aiTranslation = {
                            title: tItem.title,
                            content: tItem.content
                        };
                    }
                });
            }
        } catch (error) {
            console.error("Translation Service error:", error);
        }
    }
}
