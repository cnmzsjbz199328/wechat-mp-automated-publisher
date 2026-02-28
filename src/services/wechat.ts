import { Env, WeChatTokenResponse, WeChatMediaResponse, WeChatDraftResponse } from '../types';
import { API_URLS } from '../config/constants';

export class WeChatService {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async getAccessToken(): Promise<string> {
    const url = `${API_URLS.WECHAT_TOKEN}?grant_type=client_credential&appid=${this.env.APPID}&secret=${this.env.APPSECRET}`;
    const res = await fetch(url);
    const data = await res.json() as WeChatTokenResponse;

    if (data.errcode) {
      const errmsg = data.errmsg || '';
      // Extract blocked IP from WeChat error for easy whitelist diagnosis
      const ipMatch = errmsg.match(/invalid ip ([^\s,]+)/i);
      if (ipMatch) {
        throw new Error(
          `[IP_WHITELIST_BLOCKED] Worker出口IP "${ipMatch[1]}" 未在微信白名单。` +
          `请前往 微信公众平台 → 设置与开发 → 基本配置 → IP白名单 添加此IP。` +
          `原始错误: ${errmsg}`
        );
      }
      throw new Error(`Failed to get access token: ${errmsg}`);
    }

    return data.access_token;
  }

  async uploadThumb(token: string, customUrl?: string): Promise<string> {
    const urlToFetch = customUrl || API_URLS.DEFAULT_THUMB_IMAGE;
    const imgRes = await fetch(urlToFetch, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!imgRes.ok) {
      throw new Error(`Failed to fetch thumb image from ${urlToFetch}: ${imgRes.status} ${imgRes.statusText}`);
    }

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : 'jpg';

    const arrayBuffer = await imgRes.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: contentType });

    const formData = new FormData();
    formData.append('media', blob, `thumb.${ext}`);

    const url = `${API_URLS.WECHAT_MEDIA_UPLOAD}?access_token=${token}&type=image`;
    const uploadRes = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const data = await uploadRes.json() as WeChatMediaResponse;

    if (data.errcode) {
      throw new Error(`Failed to upload thumb: ${data.errmsg}`);
    }

    return data.thumb_media_id || data.media_id;
  }

  /**
   * Uploads an external image URL to WeChat's permanent material library.
   * Returns the WeChat CDN URL (mmbiz.qpic.cn) for use in article content,
   * or null if the fetch/upload fails (caller should omit the image gracefully).
   */
  async uploadImage(token: string, imageUrl: string): Promise<string | null> {
    try {
      const imgRes = await fetch(imageUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!imgRes.ok) return null;

      const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : 'jpg';
      const arrayBuffer = await imgRes.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: contentType });

      const formData = new FormData();
      formData.append('media', blob, `article_image.${ext}`);

      const uploadRes = await fetch(
        `${API_URLS.WECHAT_MEDIA_UPLOAD}?access_token=${token}&type=image`,
        { method: 'POST', body: formData }
      );

      const data = await uploadRes.json() as WeChatMediaResponse;
      if (data.errcode || !data.url) return null;
      return data.url;         // e.g. https://mmbiz.qpic.cn/...
    } catch {
      return null;
    }
  }

  async createDraft(token: string, title: string, author: string, content: string, thumbMediaId: string, digest?: string): Promise<WeChatDraftResponse> {
    const url = `${API_URLS.WECHAT_DRAFT_ADD}?access_token=${token}`;
    const draftRes = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        articles: [{
          title,
          author,
          content,
          thumb_media_id: thumbMediaId,
          show_cover_pic: 1,
          ...(digest ? { digest: digest.substring(0, 120) } : {})
        }]
      })
    });

    const data = await draftRes.json() as WeChatDraftResponse;

    if (data.errcode) {
      throw new Error(`Failed to create draft: ${data.errmsg}`);
    }

    return data;
  }
}
