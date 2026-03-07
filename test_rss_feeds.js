const FEEDS = [
    { name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/all.xml' },
    { name: 'APA Blog', url: 'https://blog.apaonline.org/feed/' },
    { name: 'Nature Methods', url: 'https://www.nature.com/nmeth/rss/current' },
    { name: 'MIT Research News', url: 'https://news.mit.edu/rss/research' }
];

const clean = (str) => {
    if (!str) return "";
    return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
        .replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
};

async function test(f) {
    try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const res = await fetch(f.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const xml = await res.text();
        const items = xml.split(/<item|<entry/i).slice(1);
        if (items.length === 0) return { name: f.name, status: 'No items' };

        const i = items[0];
        const title = clean(i.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
        const dMatch = i.match(/<(description|summary|content|encoded)[^>]*>([\s\S]*?)<\/\1>/i);
        const desc = clean(dMatch?.[2] || "");
        const img = /url="([^"]+\.(?:jpg|png|jpeg))"|<img[^>]+src="([^"]+)"/i.exec(i);

        return { name: f.name, title, descLen: desc.length, hasImg: !!img };
    } catch (e) { return { name: f.name, status: 'Error: ' + e.message }; }
}

async function run() {
    console.log("RSS QUALITY REPORT FOR TOP 4 SOURCES");
    for (const f of FEEDS) {
        const r = await test(f);
        console.log(`\nSOURCE: ${r.name}`);
        if (r.status) { console.log(`  STATUS: ${r.status}`); }
        else {
            console.log(`  TITLE: ${r.title}`);
            console.log(`  DESC LENGTH: ${r.descLen} chars`);
            console.log(`  IMAGE DETECTION: ${r.hasImg ? 'SUCCESS' : 'NONE'}`);
        }
    }
}
run();
