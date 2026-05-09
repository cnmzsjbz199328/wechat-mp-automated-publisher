#!/usr/bin/env node
// Usage: node .claude/skills/wechat-fetch/scripts/fetch-rss.mjs <DOMAIN>
// Supported: FINANCE, NASA, ARS, SCIENCEDAILY, MIT, APA
// MIT and APA return up to 8 items so the user can pick one for decomposition.
// Output: JSON array to stdout

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

function loadEnv() {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const raw = readFileSync(join(dir, '../../../../.dev.vars'), 'utf8');
    for (const line of raw.split('\n')) {
      const eq = line.indexOf('=');
      if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  } catch { /* env already set or file absent */ }
}

const RSS_SOURCES = {
  FINANCE:     'http://feeds.marketwatch.com/marketwatch/topstories',
  NASA:        'https://www.nasa.gov/rss/dyn/breaking_news.rss',
  ARS:         'https://feeds.arstechnica.com/arstechnica/index',
  SCIENCEDAILY:'https://www.sciencedaily.com/rss/all.xml',
  MIT:         'https://news.mit.edu/rss/research',
  APA:         'https://blog.apaonline.org/feed/',
};

const SOURCE_NAMES = {
  FINANCE:     'MarketWatch',
  NASA:        'NASA',
  ARS:         'Ars Technica',
  SCIENCEDAILY:'ScienceDaily',
  MIT:         'MIT Research',
  APA:         'APA',
};

function clean(str) {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g,             (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&amp;/g,   '&')
    .replace(/&lt;/g,    '<')
    .replace(/&gt;/g,    '>')
    .replace(/&quot;/g,  '"')
    .replace(/&apos;/g,  "'")
    .replace(/&#039;/g,  "'")
    .replace(/&#39;/g,   "'")
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&hellip;/g,'…')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g,  ' ')
    .replace(/<[^>]*>?/gm, '')
    .trim();
}

function parseItem(content, domain, sourceName) {
  const titleM = content.match(/<title>[\s\S]*?(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
  const title  = titleM?.[1] || titleM?.[2];
  const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1];
  const link    = content.match(/<link>([\s\S]*?)<\/link>/i)?.[1];

  const descM    = content.match(/<description>[\s\S]*?(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>/i);
  const encodedM = content.match(/<content:encoded>[\s\S]*?(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/content:encoded>/i);

  const descClean    = clean(descM?.[1]    || descM?.[2]    || '');
  const encodedClean = clean(encodedM?.[1] || encodedM?.[2] || '');
  let description = encodedClean.length > descClean.length ? encodedClean : descClean;

  // NASA: prefer the short <description> CDATA teaser over the full HTML page in content:encoded
  if (domain === 'NASA') {
    const m = content.match(/<description>[\s\S]*?<!\[CDATA\[([\s\S]*?)\]\]><\/description>/i);
    if (m?.[1]) {
      description = m[1]
        .replace(/&#8230;/g,   '...')
        .replace(/\[&#8230;\]/g, '.')
        .replace(/&#\d+;/g,    ' ')
        .replace(/<[^>]*>/gm,  '')
        .replace(/\s+/g, ' ')
        .trim();
    }
  }

  // ARS: strip common RSS footers
  if (domain === 'ARS') {
    const footers = [/\s*\]\]>\s*$/g, /\s*Comments\s*$/i, /\s*Read full article\s*$/i];
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of footers) {
        const next = description.replace(p, '');
        if (next !== description) { description = next; changed = true; }
      }
    }
    description = description.trim();
  }

  let imageUrl =
    content.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ||
    content.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] ||
    content.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] ||
    content.match(/<img[^>]+src="([^"]+)"/i)?.[1] ||
    null;

  if (!title || !pubDate) return null;

  return {
    title:       clean(title),
    pubDate,
    link:        link || null,
    source:      sourceName,
    imageUrl,
    description: description.slice(0, 500),
  };
}

async function fetchRss(domain) {
  const url = RSS_SOURCES[domain];
  if (!url) {
    const supported = Object.keys(RSS_SOURCES).join(', ');
    throw new Error(`Unknown domain "${domain}". Supported: ${supported}`);
  }

  // MIT and APA: fetch more candidates so the user can pick one to decompose
  const limit = (domain === 'MIT' || domain === 'APA') ? 8 : 5;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let xml;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    xml = await res.text();
  } finally {
    clearTimeout(timeout);
  }

  const items = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const item = parseItem(match[1], domain, SOURCE_NAMES[domain]);
    if (item) items.push(item);
    if (items.length >= limit) break;
  }

  if (items.length === 0) throw new Error(`No items fetched from ${domain} — feed may have changed.`);
  return items;
}

// ── main ──────────────────────────────────────────────────
loadEnv();
const domain = process.argv[2]?.toUpperCase();
if (!domain) {
  console.error('Usage: node fetch-rss.mjs <DOMAIN>');
  console.error('Supported: FINANCE, NASA, ARS, SCIENCEDAILY, MIT, APA');
  process.exit(1);
}

fetchRss(domain)
  .then(items => process.stdout.write(JSON.stringify(items, null, 2) + '\n'))
  .catch(err  => { console.error(`Error: ${err.message}`); process.exit(1); });
