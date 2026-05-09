#!/usr/bin/env node
// Usage:
//   node .claude/skills/wechat-draft/scripts/wechat-publish.mjs --file skill/output/article.html --title "标题" [--summary "摘要"] [--thumb <url>]
//   node .claude/skills/wechat-draft/scripts/wechat-publish.mjs --html "<div>...</div>" --title "标题"
//
// Reads APPID and APPSECRET from .dev.vars

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

const DEFAULT_THUMB  = 'https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?w=900&h=500&fit=crop&fm=jpg';
const TOKEN_URL      = 'https://api.weixin.qq.com/cgi-bin/token';
const MEDIA_URL      = 'https://api.weixin.qq.com/cgi-bin/material/add_material';
const DRAFT_URL      = 'https://api.weixin.qq.com/cgi-bin/draft/add';
const UA             = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function getToken(APPID, APPSECRET) {
  const res  = await fetch(`${TOKEN_URL}?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`);
  const data = await res.json();
  if (data.errcode) {
    const ip = data.errmsg?.match(/invalid ip ([^\s,]+)/i)?.[1];
    if (ip) throw new Error(`[IP_WHITELIST_BLOCKED] 出口IP "${ip}" 未在微信白名单。前往 公众平台→设置与开发→基本配置→IP白名单 添加。`);
    throw new Error(`获取Token失败: ${data.errmsg}`);
  }
  return data.access_token;
}

async function uploadThumb(token, customUrl) {
  let url    = customUrl || DEFAULT_THUMB;
  let imgRes = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA } });

  if (!imgRes.ok && customUrl) {
    process.stderr.write(`[WARN] 自定义封面下载失败 (${imgRes.status})，回退至默认图片\n`);
    url    = DEFAULT_THUMB;
    imgRes = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA } });
  }
  if (!imgRes.ok) throw new Error(`封面图下载失败: ${url}`);

  const ct  = imgRes.headers.get('content-type') || 'image/jpeg';
  const ext = ct.includes('png') ? 'png' : ct.includes('gif') ? 'gif' : 'jpg';
  const ab  = await imgRes.arrayBuffer();
  const fd  = new FormData();
  fd.append('media', new Blob([ab], { type: ct }), `thumb.${ext}`);

  const up   = await fetch(`${MEDIA_URL}?access_token=${token}&type=image`, { method: 'POST', body: fd });
  const data = await up.json();
  if (data.errcode) throw new Error(`封面上传失败: ${data.errmsg}`);
  return data.thumb_media_id || data.media_id;
}

async function createDraft(token, title, html, thumbId, summary) {
  const res  = await fetch(`${DRAFT_URL}?access_token=${token}`, {
    method: 'POST',
    body: JSON.stringify({
      articles: [{
        title,
        author:          'AI Daily',
        content:         html,
        thumb_media_id:  thumbId,
        show_cover_pic:  1,
        ...(summary ? { digest: summary.substring(0, 120) } : {}),
      }],
    }),
  });
  const data = await res.json();
  if (data.errcode) throw new Error(`草稿创建失败: ${data.errmsg}`);
  return data;
}

// ── main ──────────────────────────────────────────────────
loadEnv();
const { APPID, APPSECRET } = process.env;
if (!APPID || !APPSECRET) {
  console.error('Error: APPID 或 APPSECRET 未配置。请检查 .dev.vars 文件。');
  process.exit(1);
}

const args    = process.argv.slice(2);
const get     = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const htmlStr = get('--html');
const htmlFile= get('--file');
const title   = get('--title')   || '今日资讯';
const summary = get('--summary') || '';
const thumb   = get('--thumb')   || null;

let html = htmlStr;
if (!html && htmlFile) html = readFileSync(htmlFile, 'utf8');
if (!html) {
  console.error('Usage: node wechat-publish.mjs --file article.html --title "标题" [--summary "摘要"] [--thumb <url>]');
  process.exit(1);
}

(async () => {
  process.stdout.write('⏳ 获取微信 Access Token...\n');
  const token = await getToken(APPID, APPSECRET);
  process.stdout.write('✅ Token 获取成功\n');

  process.stdout.write('⏳ 上传封面图...\n');
  const thumbId = await uploadThumb(token, thumb);
  process.stdout.write(`✅ 封面上传成功: ${thumbId}\n`);

  process.stdout.write('⏳ 创建草稿...\n');
  const draft = await createDraft(token, title, html, thumbId, summary);
  process.stdout.write(`✅ 草稿创建成功！media_id: ${draft.media_id}\n`);
  process.stdout.write('📋 请登录微信公众平台 → 草稿箱 查看并发布。\n');
})().catch(err => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
