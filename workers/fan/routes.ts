// workers/fan/routes.ts
import type { Env } from "../types";
import { layout, redirect, parseFlash } from "../utils/html";
import { FanViews } from "./templates";
import { settingsMap, insertFan } from "../db/queries";
import type { Post, Sponsor } from "../types";

export const FanRoutes = {
  async home(env: Env, user: any, request: Request): Promise<Response> {
    let content: any = null;
    let settings: Record<string, string> = {};
    try {
      content = await env.DB.prepare("SELECT * FROM content WHERE slug = ? AND published = 1")
        .bind("home")
        .first();
    } catch {
      // D1 not initialized yet — render with default content.
      content = null;
    }
    try {
      settings = await settingsMap(env.DB);
    } catch {
      settings = {};
    }
    let posts: Post[] = [];
    try {
      const rs = await env.DB.prepare("SELECT * FROM posts WHERE published = 1 ORDER BY COALESCE(published_at, created_at) DESC LIMIT 3").all<Post>();
      posts = (rs.results as Post[] | undefined) ?? [];
    } catch {
      posts = [];
    }
    let sponsors: Sponsor[] = [];
    try {
      const rs = await env.DB.prepare("SELECT * FROM sponsors WHERE published = 1 ORDER BY sort_order ASC, name ASC LIMIT 4").all<Sponsor>();
      sponsors = (rs.results as Sponsor[] | undefined) ?? [];
    } catch {
      sponsors = [];
    }
    const hero = {
      headline: settings.hero_headline ?? (content?.title ?? "Welcome"),
      subheadline: settings.hero_subheadline ?? "Catch up on the latest news and highlights from the team.",
      backgroundUrl: settings.hero_background_key ? `/media/${settings.hero_background_key}` : null,
    };
    const flash = parseFlash(request);
    return layout({
      title: "Home",
      siteName: env.SITE_NAME,
      user,
      settings,
      body: FanViews.home({ content: content ?? null, posts, sponsors, hero, flash })
    });
  },
  async signup(env: Env, request: Request, _ctx: ExecutionContext): Promise<Response> {
    void _ctx;
    await sleep(300 + Math.random() * 300);
    const fd = await request.formData();
    const name = String(fd.get("name") ?? "").trim();
    const emailRaw = String(fd.get("email") ?? "").trim();
    const favorite = String(fd.get("favorite_team") ?? "").trim() || null;

    if (!name || !emailRaw) {
      return redirect("/", "Please provide both your name and email address.");
    }

    if (name.length > 120) {
      return redirect("/", "Please use a shorter name (120 characters max).");
    }

    if (favorite && favorite.length > 120) {
      return redirect("/", "Favorite team is too long (120 characters max).");
    }

    const email = emailRaw.toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return redirect("/", "Please enter a valid email address.");
    }

    try {
      const existing = await env.DB.prepare("SELECT id FROM fans WHERE email = ? LIMIT 1").bind(email).first();
      if (existing) {
        return redirect("/", "You're already on the list!");
      }

      await insertFan(env.DB, { name, email, favoriteTeam: favorite });
      return redirect("/", "Thanks for joining the fan list!");
    } catch (err) {
      console.error("fan signup failed", err);
      return redirect("/", "We couldn't save your sign-up. Please try again soon.");
    }
  }
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
