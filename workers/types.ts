export interface Env {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  ASSETS: Fetcher;
  SESSION_SECRET: string;
  SITE_NAME: string;
  BASE_URL: string;
}

export type User = {
  id: number;
  email: string;
  role: string;
};

export type Fan = {
  id: number;
  name: string;
  email: string;
  favorite_team?: string | null;
  created_at: string;
};

export type Content = {
  id: number;
  slug: string;
  title: string;
  body: string;
  published: number;
  created_at: string;
  updated_at?: string | null;
};

export type Setting = { key: string; value: string; };

export type Media = {
  id: number;
  key: string;
  filename: string;
  content_type: string | null;
  size: number | null;
  uploaded_at: string;
};

export type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt?: string | null;
  body: string;
  published: number;
  published_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type Sponsor = {
  id: number;
  name: string;
  logo_key?: string | null;
  website_url?: string | null;
  sort_order: number;
  published: number;
  created_at: string;
  updated_at?: string | null;
};
