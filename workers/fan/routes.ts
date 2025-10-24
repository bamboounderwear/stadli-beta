// workers/fan/routes.ts
import type { Env } from "../types";
import { layout } from "../utils/html";
import { FanViews } from "./templates";
import { settingsMap } from "../db/queries";
import type { Post, Sponsor } from "../types";

export const FanRoutes = {
  async home(env: Env, user: any): Promise<Response> {
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
    return layout({
      title: "Home",
      siteName: env.SITE_NAME,
      user,
      settings,
      body: FanViews.home({ content: content ?? null, posts, sponsors, hero })
    });
  },
};
