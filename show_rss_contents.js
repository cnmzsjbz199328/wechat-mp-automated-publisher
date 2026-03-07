const FEEDS = [
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml' },
    { name: 'MIT Research News', url: 'https://news.mit.edu/rss/research' },
    { name: 'APA Blog', url: 'https://blog.apaonline.org/feed/' },
    { name: 'Nature Methods', url: 'https://www.nature.com/nmeth/rss/current' }
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

async function showContent(f) {
    console.log(`\n================================================================`);
    console.log(`SOURCE: ${f.name}`);
    console.log(`URL: ${f.url}`);
    console.log(`================================================================`);

    try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const res = await fetch(f.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
            }
        });
        const xml = await res.text();

        // Find the first item or entry
        const itemMatch = xml.match(/<(item|entry)[^>]*>([\s\S]*?)<\/\1>/i);
        if (!itemMatch) {
            console.log("Status: NO ITEMS FOUND IN XML FEED.");
            // Log a bit of the XML for debugging if needed
            // console.log("Partial XML:", xml.substring(0, 500));
            return;
        }

        const content = itemMatch[2];
        const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = clean(titleMatch?.[1] || "");

        // Try multiple description tags
        const descMatch =
            content.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i) ||
            content.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
            content.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
            content.match(/<content[^>]*>([\s\S]*?)<\/content>/i);

        const desc = clean(descMatch?.[1] || "");
        const link = content.match(/<link[^>]*>(?:([\s\S]*?)<\/link>|)/i)?.[1] ||
            content.match(/<link\s+href="([^"]+)"/i)?.[1] || "";

        console.log(`\n[TITLE]:\n${title}`);
        console.log(`\n[LINK]:\n${link}`);
        console.log(`\n[DESCRIPTION/CONTENT]:\n${desc.length > 500 ? desc.substring(0, 500) + "..." : desc}`);
        console.log(`\n(Raw Length: ${desc.length} characters)`);

    } catch (e) {
        console.log(`ERROR: ${e.message}`);
    }
}

async function run() {
    for (const f of FEEDS) {
        await showContent(f);
    }
}

run();
