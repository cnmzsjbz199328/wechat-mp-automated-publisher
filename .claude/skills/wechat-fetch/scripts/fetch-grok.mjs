#!/usr/bin/env node
// Usage: node .claude/skills/wechat-fetch/scripts/fetch-grok.mjs [--niche <index 0-9>]
// Reads XAI_API_KEY from .dev.vars. Output: JSON array to stdout.

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

const SUB_NICHES = [
  'Skilled migration (subclass 189/190/491) state nomination and points test updates',
  'Employer sponsored visas (subclass 482/186) and occupation list/salary threshold changes',
  'Student (500) and Graduate (485) visa policy and migration strategy updates',
  'Partner, child, and parent migration program developments',
  'Australian Migration Strategy, annual planning levels, and cap updates',
  'Regional migration initiatives, DAMA agreements, and rural visa programs',
  'Business innovation and investment (BIIP) visa reforms',
  'Visa processing times, statistics, and citizenship residence requirements',
  'Skills assessment and occupational licensing for international workers',
  'Working Holiday Maker (417/462) and short-term visa policy changes',
];

async function fetchGrok(nicheIndex) {
  const XAI_API_KEY = process.env.XAI_API_KEY;
  if (!XAI_API_KEY) throw new Error('XAI_API_KEY not found. Add it to .dev.vars: XAI_API_KEY=<your key>');

  const idx = nicheIndex ?? Math.floor(Math.random() * SUB_NICHES.length);
  const niche = SUB_NICHES[idx];
  process.stderr.write(`Selected niche [${idx}]: ${niche}\n`);

  const systemPrompt = `You are a professional Australian immigration policy researcher specializing in ${niche}.

Your task is to perform a targeted search on Australian government websites (primarily homeaffairs.gov.au) and authoritative migration sources for CURRENT active policy information, official guidelines, or significant recent changes regarding [${niche}].

Use the web_search tool to find exactly 5 key policy points or updates.
Focus on:
- Core eligibility requirements
- Current visa conditions and criteria
- Official guidelines and recent policy trends
- Latest invitation data or quota information if applicable

Output the result strictly as a JSON object with the following structure:
{
  "items": [
    {
      "title": "Policy point or update headline",
      "source": "Government department or official source name",
      "link": "Direct URL to the official policy page or news article",
      "pubDate": "Current date or date of last policy update (RFC 2822 string)",
      "description": "80-100 word English explanation of the policy or change."
    }
  ]
}
Ensure the response is valid JSON format. Do not use markdown blocks.`;

  const res = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-non-reasoning',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Search for current active policies regarding [${niche}] in Australia and output as structured JSON.` },
      ],
      tools: [{ type: 'web_search' }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) throw new Error(`XAI API error: ${res.status} ${await res.text()}`);

  const response = await res.json();
  const output   = response.output;
  let text = '';

  if (Array.isArray(output)) {
    const msg = output.find(o => o.type === 'message');
    if (msg?.content) {
      const part = msg.content.find(p => p.type === 'output_text');
      text = part?.text || '';
    }
  } else if (output?.content) {
    text = output.content;
  }

  if (!text) throw new Error('No content in XAI response');

  const parsed = JSON.parse(text);
  return (parsed.items ?? []).map(item => ({
    title:       item.title,
    pubDate:     item.pubDate,
    link:        item.link   || null,
    source:      item.source || 'Australian Government',
    imageUrl:    null,
    description: item.description,
  }));
}

// ── main ──────────────────────────────────────────────────
loadEnv();
const args = process.argv.slice(2);
const nicheFlag = args.indexOf('--niche');
const nicheIndex = nicheFlag >= 0 ? parseInt(args[nicheFlag + 1], 10) : undefined;

fetchGrok(nicheIndex)
  .then(items => process.stdout.write(JSON.stringify(items, null, 2) + '\n'))
  .catch(err  => { console.error(`Error: ${err.message}`); process.exit(1); });
