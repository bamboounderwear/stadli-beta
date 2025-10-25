import type { Env, Media, Post, Sponsor, User } from "../types";
import { layout, redirect } from "../utils/html";
import { AdminViews } from "./templates";
import { settingsMap, insertFan } from "../db/queries";

async function requireUser(env: Env, user: User | null): Promise<User> {
  if (!user) throw redirect("/login", "Please sign in");
  return user;
}

export const AdminRoutes = {
  async dashboard(env: Env, user: User | null): Promise<Response> {
    const me = await requireUser(env, user);
    const [fans, content, media, posts, sponsors] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) AS n FROM fans").first<{n:number}>(),
      env.DB.prepare("SELECT COUNT(*) AS n FROM content").first<{n:number}>(),
      env.DB.prepare("SELECT COUNT(*) AS n FROM media").first<{n:number}>(),
      env.DB.prepare("SELECT COUNT(*) AS n FROM posts").first<{n:number}>().catch(() => ({ n: 0 })),
      env.DB.prepare("SELECT COUNT(*) AS n FROM sponsors").first<{n:number}>().catch(() => ({ n: 0 }))
    ]);
    const settings = await settingsMap(env.DB);
    return layout({
      title: "Admin",
      siteName: env.SITE_NAME,
      user: me,
      settings,
      body: AdminViews.dashboard({
        user: me,
        counts: {
          fans: fans?.n ?? 0,
          content: content?.n ?? 0,
          media: media?.n ?? 0,
          posts: posts?.n ?? 0,
          sponsors: sponsors?.n ?? 0
        }
      })
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
    await insertFan(env.DB, { name, email, favoriteTeam: favorite });
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

  async postsList(env: Env, user: User | null): Promise<Response> {
    const me = await requireUser(env, user);
    let posts: Post[] = [];
    try {
      const rs = await env.DB.prepare("SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC").all<Post>();
      posts = (rs.results as Post[] | undefined) ?? [];
    } catch {
      posts = [];
    }
    const settings = await settingsMap(env.DB);
    return layout({
      title: "Posts",
      siteName: env.SITE_NAME,
      user: me,
      settings,
      body: AdminViews.posts({ posts })
    });
  },

  async postsSave(env: Env, user: User | null, req: Request): Promise<Response> {
    const me = await requireUser(env, user);
    const fd = await req.formData();
    const idValue = String(fd.get("id") ?? "").trim();
    const id = idValue ? Number(idValue) : null;
    const slug = String(fd.get("slug") ?? "").trim();
    const title = String(fd.get("title") ?? "").trim();
    const excerpt = String(fd.get("excerpt") ?? "").trim() || null;
    const body = String(fd.get("body") ?? "").trim();
    const published = Number(fd.get("published") ?? "0") ? 1 : 0;
    if (!slug || !title || !body) return redirect("/admin/posts", "Missing required fields");

    if (id) {
      const existing = await env.DB.prepare("SELECT published_at FROM posts WHERE id = ?").bind(id).first<Post>();
      if (!existing) return redirect("/admin/posts", "Post not found");
      const now = new Date().toISOString();
      const publishedAt = published ? (existing.published_at ?? now) : null;
      await env.DB.prepare(
        "UPDATE posts SET slug = ?, title = ?, excerpt = ?, body = ?, published = ?, published_at = ?, updated_at = ? WHERE id = ?"
      )
        .bind(slug, title, excerpt, body, published, publishedAt, now, id)
        .run();
      return redirect("/admin/posts", "Post updated");
    }

    const publishedAt = published ? new Date().toISOString() : null;
    await env.DB.prepare(
      "INSERT INTO posts(slug, title, excerpt, body, published, published_at) VALUES(?, ?, ?, ?, ?, ?)"
    )
      .bind(slug, title, excerpt, body, published, publishedAt)
      .run();
    return redirect("/admin/posts", "Post saved");
  },

  async sponsorsList(env: Env, user: User | null): Promise<Response> {
    const me = await requireUser(env, user);
    let sponsors: Sponsor[] = [];
    try {
      const rs = await env.DB.prepare("SELECT * FROM sponsors ORDER BY sort_order ASC, name ASC").all<Sponsor>();
      sponsors = (rs.results as Sponsor[] | undefined) ?? [];
    } catch {
      sponsors = [];
    }
    const settings = await settingsMap(env.DB);
    const mediaRs = await env.DB.prepare("SELECT * FROM media ORDER BY uploaded_at DESC LIMIT 100").all<Media>();
    const media = (mediaRs.results as Media[] | undefined) ?? [];
    return layout({
      title: "Sponsors",
      siteName: env.SITE_NAME,
      user: me,
      settings,
      body: AdminViews.sponsors({ sponsors, media })
    });
  },

  async sponsorsSave(env: Env, user: User | null, req: Request): Promise<Response> {
    const me = await requireUser(env, user);
    const fd = await req.formData();
    const idValue = String(fd.get("id") ?? "").trim();
    const id = idValue ? Number(idValue) : null;
    const name = String(fd.get("name") ?? "").trim();
    const logoKey = String(fd.get("logo_key") ?? "").trim() || null;
    const website = String(fd.get("website_url") ?? "").trim() || null;
    let sortOrder = Number(String(fd.get("sort_order") ?? "0").trim() || "0");
    if (Number.isNaN(sortOrder)) sortOrder = 0;
    const published = Number(fd.get("published") ?? "0") ? 1 : 0;
    if (!name) return redirect("/admin/sponsors", "Name is required");

    if (logoKey) {
      const exists = await env.DB.prepare("SELECT 1 FROM media WHERE key = ?").bind(logoKey).first();
      if (!exists) {
        return redirect("/admin/sponsors", "Logo not found. Upload media first.");
      }
    }

    if (id) {
      const existing = await env.DB.prepare("SELECT id FROM sponsors WHERE id = ?").bind(id).first<Sponsor>();
      if (!existing) return redirect("/admin/sponsors", "Sponsor not found");
      const now = new Date().toISOString();
      await env.DB.prepare(
        "UPDATE sponsors SET name = ?, logo_key = ?, website_url = ?, sort_order = ?, published = ?, updated_at = ? WHERE id = ?"
      )
        .bind(name, logoKey, website, sortOrder, published, now, id)
        .run();
      return redirect("/admin/sponsors", "Sponsor updated");
    }

    await env.DB.prepare(
      "INSERT INTO sponsors(name, logo_key, website_url, sort_order, published) VALUES(?, ?, ?, ?, ?)"
    )
      .bind(name, logoKey, website, sortOrder, published)
      .run();
    return redirect("/admin/sponsors", "Sponsor saved");
  },

  async settings(env: Env, user: User | null): Promise<Response> {
    const me = await requireUser(env, user);
    const settings = await settingsMap(env.DB);
    const mediaRs = await env.DB.prepare("SELECT * FROM media ORDER BY uploaded_at DESC LIMIT 100").all();
    const media = (mediaRs.results as Media[] | undefined) ?? [];
    return layout({
      title: "Settings",
      siteName: env.SITE_NAME,
      user: me,
      settings,
      body: AdminViews.settings({ settings, media })
    });
  },

  async settingsSave(env: Env, user: User | null, req: Request): Promise<Response> {
    const me = await requireUser(env, user);
    const fd = await req.formData();
    const primary = String(fd.get("primary_color") ?? "#0b5fff");
    const secondary = String(fd.get("secondary_color") ?? "#111827");
    const logoKey = String(fd.get("logo_key") ?? "").trim();
    const heroHeadline = String(fd.get("hero_headline") ?? "").trim() || "Welcome to the Club";
    const heroSubheadline = String(fd.get("hero_subheadline") ?? "").trim() || "Get the latest updates, stories, and exclusive content straight from the team.";
    const heroBackground = String(fd.get("hero_background_key") ?? "").trim();
    if (logoKey) {
      const exists = await env.DB.prepare("SELECT 1 FROM media WHERE key = ?").bind(logoKey).first();
      if (!exists) {
        return redirect("/admin/settings", "Logo not found. Upload in Media first.");
      }
    }
    if (heroBackground) {
      const exists = await env.DB.prepare("SELECT 1 FROM media WHERE key = ?").bind(heroBackground).first();
      if (!exists) {
        return redirect("/admin/settings", "Hero background not found. Upload in Media first.");
      }
    }
    await env.DB.batch([
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("primary_color", primary),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("secondary_color", secondary),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("logo_key", logoKey),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("hero_headline", heroHeadline),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("hero_subheadline", heroSubheadline),
      env.DB.prepare("INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind("hero_background_key", heroBackground)
    ]);
    return redirect("/admin/settings", "Settings saved");
  },

  async media(env: Env, user: User | null): Promise<Response> {
    const me = await requireUser(env, user);
    const rs = await env.DB.prepare("SELECT * FROM media ORDER BY uploaded_at DESC LIMIT 100").all();
    const settings = await settingsMap(env.DB);
    return layout({ title: "Media", siteName: env.SITE_NAME, user: me, settings, body: AdminViews.media({ media: (rs.results as Media[] | undefined) ?? [] }) });
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
