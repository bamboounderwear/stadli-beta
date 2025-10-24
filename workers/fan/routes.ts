import type { Env } from "../types";
import { layout } from "../utils/html";
import { FanViews } from "./templates";
import { settingsMap } from "../db/queries";

export const FanRoutes = {
  async home(env: Env, user: any): Promise<Response> {
    const content = await env.DB.prepare("SELECT * FROM content WHERE slug = ? AND published = 1").bind("home").first();
    const settings = await settingsMap(env.DB);
    return layout({ title: "Home", siteName: env.SITE_NAME, user, settings, body: FanViews.home({ content: content as any ?? null }) });
  },
};
