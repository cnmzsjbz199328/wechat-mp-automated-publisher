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

  async uploadThumb(token: string): Promise<string> {
    const imgRes = await fetch(API_URLS.DEFAULT_THUMB_IMAGE, { redirect: 'follow' });
    const arrayBuffer = await imgRes.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('media', blob, 'thumb.jpg');

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

  async createDraft(token: string, title: string, author: string, content: string, thumbMediaId: string): Promise<WeChatDraftResponse> {
    const url = `${API_URLS.WECHAT_DRAFT_ADD}?access_token=${token}`;
    const draftRes = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        articles: [{
          title,
          author,
          content,
          thumb_media_id: thumbMediaId,
          show_cover_pic: 1
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
