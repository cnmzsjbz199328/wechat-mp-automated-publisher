export interface Env {
  APPID: string;
  APPSECRET: string;
  AI: any; // Cloudflare AI binding type
}

export interface NewsItem {
  title: string;
  pubDate: string;
}

export interface WeChatTokenResponse {
  access_token: string;
  expires_in: number;
  errcode?: number;
  errmsg?: string;
}

export interface WeChatMediaResponse {
  type: string;
  media_id: string;
  thumb_media_id?: string;
  created_at: number;
  errcode?: number;
  errmsg?: string;
}

export interface WeChatDraftResponse {
  media_id: string;
  errcode?: number;
  errmsg?: string;
}
