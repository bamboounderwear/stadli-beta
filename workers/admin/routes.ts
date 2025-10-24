import type { Env, User } from "../types";
import { layout, redirect } from "../utils/html";
import { AdminViews } from "./templates";
import { settingsMap } from "../db/queries";

async function requireUser(env: Env, user: User | null): Promise<User> {
  if (!user) throw redirect("/login", "Please sign in");
  return user;
}

export const AdminRoutes = {
  async dashboard(env: Env, user: User | null): Promise<Response> {
    const me = await requireUser(env, user);
    const [fans, content, media] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS n FROM fans").first<{n:number}>(),
      env.DB.prepare("SELECT COUNT(*) AS n FROM content").first<{n:number}>(),
      env.DB.prepare("SELECT COUNT(*) AS n FROM media").first<{n:number}>()
    ]);
    const settings = await settingsMap(env.DB);
    return layout({
      title: "Admin",
      siteName: env.SITE_NAME,
      user: me,
      settings,
      body: AdminViews.dashboard({ user: me, counts: { fans: fans?.n ?? 0, content: content?.n ?? 0, media: media?.n ?? 0 } })
    });
  },

  async fansList(env: Env, user: User | null): Promise<Response> {
    const me = await requireUser(env, user);
    const rs = await env.DB.prepare("SELECT * FROM fans ORDER BY created_at DESC LIMIT 200").all();
    const settings = await settingsMap(env.DB);
    return layout({ title: "Fans", siteName: env.SITE_NAME, user: me, settings, body: AdminViews.fansList({ fans: (rs.results as any[]) ?? [] }) });
  },

  async fansCreate(env: Env, user: User | null, req: Request): Promise<Response> {
    const me = await requireUser(env, user);
    const fd = await req.formData();
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const favorite = String(fd.get("favorite_team") ?? "").trim() || null;
    if (!name || !email) return redirect("/admin/fans", "Missing name or email");
    await env.DB.prepare("INSERT INTO fans(name,email,favorite_team) VALUES(?,?,?)").bind(name, email, favorite).run();
    return redirect("/admin/fans", "Fan added");
  },

  async contentList(env: Env, user: User | null): Promise<Response> {
    const me = await requireUser(env, user);
    const rs = await env.DB.prepare("SELECT * FROM content ORDER BY created_at DESC").all();
    const settings = await settingsMap(env.DB);
    return layout({ title: "Content", siteName: env.SITE_NAME, user: me, settings, body: AdminViews.contentList({ items: (rs.results as any[]) ?? [] }) });
  },

  async contentCreate(env: Env, user: User | null, req: Request): Promise<Response> {
    const me = await requireUser(env, user);
    const fd = await req.formData();
    const slug = String(fd.get("slug") ?? "").trim();
    const title = String(fd.get("title") ?? "").trim();
    const body = String(fd.get("body") ?? "").trim();
    const published = Number(fd.get("published") ?? "0") ? 1 : 0;
    if (!slug || !title || !body) return redirect("/admin/content", "Missing fields");
    await env.DB.prepare("INSERT INTO content(slug,title,body,published) VALUES(?,?,?,?)").bind(slug, title, body, published).run();
    return redirect("/admin/content", "Content created");
  },

  async settings(env: Env, user: User | null): Promise<Response> {
    const me = await requireUser(env, user);
    const settings = await settingsMap(env.DB);
    return layout({ title: "Settings", siteName: env.SITE_NAME, user: me, settings, body: AdminViews.settings({ settings }) });
  },

  async settingsSave(env: Env, user: User | null, req: Request): Promise<Response> {
    const me = await requireUser(env, user);
    const fd = await req.formData();
    const primary = String(fd.get("primary_color") ?? "#0b5fff");
    const secondary = String(fd.get("secondary_color") ?? "#111827");
    await env.DB.batch([
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("primary_color", primary),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("secondary_color", secondary)
    ]);
    return redirect("/admin/settings", "Settings saved");
  },

  async media(env: Env, user: User | null): Promise<Response> {
    const me = await requireUser(env, user);
    const rs = await env.DB.prepare("SELECT * FROM media ORDER BY uploaded_at DESC LIMIT 100").all();
    const settings = await settingsMap(env.DB);
    return layout({ title: "Media", siteName: env.SITE_NAME, user: me, settings, body: AdminViews.media({ media: (rs.results as any[]) ?? [] }) });
  },

  async mediaUpload(env: Env, user: User | null, req: Request): Promise<Response> {
    const me = await requireUser(env, user);
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) return redirect("/admin/media", "No file");
    const array = new Uint8Array(await file.arrayBuffer());
    const now = new Date();
    const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth()+1).padStart(2,"0")}/${crypto.randomUUID()}-${file.name}`;
    await env.MEDIA_BUCKET.put(key, array, { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    await env.DB.prepare("INSERT INTO media(key, filename, content_type, size) VALUES(?,?,?,?)").bind(key, file.name, file.type || null, array.byteLength).run();
    return redirect("/admin/media", "Uploaded");
  }
};
