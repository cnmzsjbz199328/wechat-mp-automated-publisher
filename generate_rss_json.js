const fs = require('fs');

const FEEDS = [
    { id: 'sciencedaily', name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml', type: 'science' },
    { id: 'mit-research', name: 'MIT Research News', url: 'https://news.mit.edu/rss/research', type: 'science' },
    { id: 'apa-blog', name: 'APA Blog', url: 'https://blog.apaonline.org/feed/', type: 'philosophy' },
    { id: 'nature-methods', name: 'Nature Methods', url: 'https://www.nature.com/nmeth/rss/current', type: 'science' }
];

const clean = (str) => {
    if (!str) return "";
    return str
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
        .replace(/<[^>]*>?/gm, " ")
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
};

async function fetchFeedData(feed) {
    console.log(`Processing ${feed.name}...`);
    try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const res = await fetch(feed.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const xml = await res.text();

        const items = [];
        const itemMatches = [...xml.matchAll(/<(item|entry)[^>]*>([\s\S]*?)<\/\1>/gi)];

        for (const match of itemMatches) {
            const content = match[2];
            const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const title = clean(titleMatch?.[1] || "");

            const descMatch =
                content.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i) ||
                content.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
                content.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
                content.match(/<content[^>]*>([\s\S]*?)<\/content>/i);

            const desc = clean(descMatch?.[1] || "");
            const link = content.match(/<link[^>]*>(?:([\s\S]*?)<\/link>|)/i)?.[1] ||
                content.match(/<link\s+href="([^"]+)"/i)?.[1] || "";

            const dateMatch = content.match(/<(?:pubDate|updated|published)>([\s\S]*?)<\//i);
            const pubDate = dateMatch?.[1] || "";

            let imageUrl = content.match(/<media:(?:content|thumbnail)[^>]+url="([^"]+)"/i)?.[1] ||
                content.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] ||
                content.match(/<img[^>]+src="([^"]+)"/i)?.[1];

            if (title && (desc || link)) {
                items.push({
                    title,
                    link,
                    pubDate,
                    description: desc,
                    imageUrl
                });
            }
            if (items.length >= 10) break; // Fetch up to 10
        }

        return {
            ...feed,
            items
        };
    } catch (e) {
        console.error(`Error fetching ${feed.name}: ${e.message}`);
        return { ...feed, items: [], error: e.message };
    }
}

async function run() {
    const finalData = [];
    for (const f of FEEDS) {
        const data = await fetchFeedData(f);
        finalData.push(data);
    }

    fs.writeFileSync('rss_data.json', JSON.stringify(finalData, null, 2), 'utf8');
    console.log('\nSuccess! Data saved to rss_data.json');
}

run();
