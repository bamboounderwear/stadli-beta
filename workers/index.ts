// workers/index.ts
import type { Env } from "./types";
import { html, layout, redirect, parseFlash } from "./utils/html";
import { getUserFromRequest, createSessionCookie, clearSessionCookie, sha256Hex } from "./utils/auth";
import { AdminRoutes } from "./admin/routes";
import { FanRoutes } from "./fan/routes";
import { mockFeatureA } from "./api/mock-feature-a";
import { mockFeatureB } from "./api/mock-feature-b";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    try {
      const user = await getUserFromRequest(env, request);

      // Static assets served by Assets binding (files in ui/public/*)
      if (url.pathname.startsWith("/assets/")) {
        return await env.ASSETS.fetch(request);
      }

      // Health
      if (url.pathname === "/health") {
        return new Response("ok", { headers: secHeaders() });
      }

      // Public home
      if (url.pathname === "/" && request.method === "GET") {
        return await FanRoutes.home(env, user, request);
      }

      if (url.pathname === "/fans/join" && request.method === "POST") {
        return await FanRoutes.signup(env, request, ctx);
      }

      // Public media proxy (R2)
      if (url.pathname.startsWith("/media/") && request.method === "GET") {
        const key = url.pathname.replace(/^\/media\//, "");
        const obj = await env.MEDIA_BUCKET.get(key);
        if (!obj) return new Response("Not found", { status: 404, headers: secHeaders() });
        return new Response(obj.body, {
          headers: {
            "content-type": obj.httpMetadata?.contentType || "application/octet-stream",
            ...secHeaders()
          }
        });
      }

      // Auth
      if (url.pathname === "/login") {
        if (request.method === "GET") {
          const body = (await import("./admin/templates")).AdminViews.login();
          return layout({
            title: "Login",
            siteName: env.SITE_NAME,
            user,
            flash: parseFlash(request),
            body
          });
        }
        if (request.method === "POST") {
          const fd = await request.formData();
          const email = String(fd.get("email") ?? "").trim().toLowerCase();
          const password = String(fd.get("password") ?? "");

          try {
            const row = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
            if (!row) return redirect("/login", "Invalid credentials");
            const hash = await sha256Hex(password + row.salt);
            if (hash !== row.password_hash) return redirect("/login", "Invalid credentials");
            const cookie = await createSessionCookie(row.id, env.SESSION_SECRET, 12);
            return new Response(null, {
              status: 302,
              headers: { location: "/admin", "set-cookie": cookie, ...secHeaders() }
            });
          } catch {
            return redirect("/login", "Auth unavailable. Run D1 migrations.");
          }
        }
      }

      if (url.pathname === "/logout") {
        return new Response(null, {
          status: 302,
          headers: { location: "/", "set-cookie": clearSessionCookie(), ...secHeaders() }
        });
      }

      // Admin (protected)
      if (url.pathname === "/admin" && request.method === "GET") return await AdminRoutes.dashboard(env, user);
      if (url.pathname === "/admin/fans" && request.method === "GET") return await AdminRoutes.fansList(env, user);
      if (url.pathname === "/admin/fans" && request.method === "POST") return await AdminRoutes.fansCreate(env, user, request);
      if (url.pathname === "/admin/content" && request.method === "GET") return await AdminRoutes.contentList(env, user);
      if (url.pathname === "/admin/content" && request.method === "POST") return await AdminRoutes.contentCreate(env, user, request);
      if (url.pathname === "/admin/posts" && request.method === "GET") return await AdminRoutes.postsList(env, user);
      if (url.pathname === "/admin/posts" && request.method === "POST") return await AdminRoutes.postsSave(env, user, request);
      if (url.pathname === "/admin/sponsors" && request.method === "GET") return await AdminRoutes.sponsorsList(env, user);
      if (url.pathname === "/admin/sponsors" && request.method === "POST") return await AdminRoutes.sponsorsSave(env, user, request);
      if (url.pathname === "/admin/settings" && request.method === "GET") return await AdminRoutes.settings(env, user);
      if (url.pathname === "/admin/settings" && request.method === "POST") return await AdminRoutes.settingsSave(env, user, request);
      if (url.pathname === "/admin/media" && request.method === "GET") return await AdminRoutes.media(env, user);
      if (url.pathname === "/admin/media" && request.method === "POST") return await AdminRoutes.mediaUpload(env, user, request);

      // API scaffold
      if (url.pathname === "/api/mock-a") return await mockFeatureA(env, request);
      if (url.pathname === "/api/mock-b") return await mockFeatureB(env, request);

      return notFound();
    } catch (err: unknown) {
      // If a route threw a Response (e.g., redirect from auth), pass it through
      const isResponseLike =
        typeof err === "object" &&
        err !== null &&
        "status" in (err as any) &&
        "headers" in (err as any) &&
        typeof (err as any).status === "number";

      if (err instanceof Response || isResponseLike) {
        return err as Response;
      }

      console.error("Error", err);
      const msg =
        err && typeof err === "object" && "message" in (err as any)
          ? String((err as any).message)
          : String(err);
      return html(`<h1>Server Error</h1><p>${escapeHtml(msg)}</p>`, 500);
    }
  }
} satisfies ExportedHandler<Env>;

function notFound(): Response {
  return html("<h1>Not Found</h1>", 404);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>
    )[c]
  );
}

function secHeaders(): Record<string, string> {
  return {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "same-origin",
    "cross-origin-opener-policy": "same-origin"
  };
}
