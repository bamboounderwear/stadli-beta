import type { Content, Fan, Setting, User } from "../types";

export const Q = {
  getSettings: "SELECT key, value FROM settings",
  getContentBySlug: "SELECT * FROM content WHERE slug = ? AND published = 1",
  upsertSetting: "INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
  listFans: "SELECT * FROM fans ORDER BY created_at DESC LIMIT 200",
  insertFan: "INSERT INTO fans(name, email, favorite_team) VALUES(?, ?, ?)",
  listContent: "SELECT * FROM content ORDER BY created_at DESC",
  insertContent: "INSERT INTO content(slug, title, body, published) VALUES(?, ?, ?, ?)",
  getUserByEmail: "SELECT * FROM users WHERE email = ?",
  insertMedia: "INSERT INTO media(key, filename, content_type, size) VALUES(?, ?, ?, ?)",
  listMedia: "SELECT * FROM media ORDER BY uploaded_at DESC LIMIT 100"
} as const;

export type Row<T> = T & Record<string, unknown>;

export async function settingsMap(db: D1Database): Promise<Record<string,string>> {
  try {
    const rs = await db.prepare(Q.getSettings).all<Row<Setting>>();
    const map: Record<string,string> = {};
    for (const r of rs.results ?? []) map[r.key] = r.value;
    return map;
  } catch {
    return {};
  }
}
