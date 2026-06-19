#!/usr/bin/env node
// 内文配图上传器：本地图片 → 微信 uploadimg → 打印 mp.weixin.qq.com URL
// Usage:
//   node .claude/skills/wechat-studio/scripts/wechat-image.mjs --file skill/output/images/inline-1.png
//
// 返回的 URL 才能在微信图文正文 <img> 中显示（外站 URL 会被屏蔽）。
// 读取 .dev.vars 中的 APPID / APPSECRET。

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';

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

const TOKEN_URL    = 'https://api.weixin.qq.com/cgi-bin/token';
const UPLOADIMG_URL= 'https://api.weixin.qq.com/cgi-bin/media/uploadimg';

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

function extToMime(file) {
  const f = file.toLowerCase();
  if (f.endsWith('.png')) return 'image/png';
  if (f.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

async function uploadImg(token, file) {
  const buf = readFileSync(file);
  const ct  = extToMime(file);
  const fd  = new FormData();
  fd.append('media', new Blob([buf], { type: ct }), basename(file));

  const up   = await fetch(`${UPLOADIMG_URL}?access_token=${token}`, { method: 'POST', body: fd });
  const data = await up.json();
  if (data.errcode) throw new Error(`内文图上传失败: ${data.errmsg}`);
  if (!data.url) throw new Error(`内文图上传无返回 URL: ${JSON.stringify(data)}`);
  return data.url;
}

// ── main ──────────────────────────────────────────────────
loadEnv();
const { APPID, APPSECRET } = process.env;
if (!APPID || !APPSECRET) {
  console.error('Error: APPID 或 APPSECRET 未配置。请检查 .dev.vars 文件。');
  process.exit(1);
}

const args = process.argv.slice(2);
const get  = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const file = get('--file');
if (!file) {
  console.error('Usage: node wechat-image.mjs --file <本地图片路径>');
  process.exit(1);
}

(async () => {
  const token = await getToken(APPID, APPSECRET);
  const url   = await uploadImg(token, file);
  // stdout 仅输出 URL，便于 Claude 直接捕获写回 imageUrl
  process.stdout.write(url + '\n');
})().catch(err => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
