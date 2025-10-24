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
