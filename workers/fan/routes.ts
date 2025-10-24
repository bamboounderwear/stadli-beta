// workers/fan/routes.ts
import type { Env } from "../types";
import { layout } from "../utils/html";
import { FanViews } from "./templates";
import { settingsMap } from "../db/queries";

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
    return layout({ title: "Home", siteName: env.SITE_NAME, user, settings, body: FanViews.home({ content: content ?? null }) });
  },
};
