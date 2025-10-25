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
              headers: { location: "/home", "set-cookie": cookie, ...secHeaders() }
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

      // Workspace (protected)
      if (url.pathname === "/admin" && request.method === "GET") return redirect("/home");
      if (url.pathname === "/home" && request.method === "GET") return await AdminRoutes.home(env, user);
      if (url.pathname === "/search" && request.method === "GET") return await AdminRoutes.search(env, user, request);

      if (url.pathname === "/web" && request.method === "GET") return redirect("/web/pages");
      if (url.pathname === "/web/pages" && request.method === "GET") return await AdminRoutes.webPages(env, user);
      if (url.pathname === "/web/pages" && request.method === "POST") return await AdminRoutes.webPagesCreate(env, user, request);
      if (url.pathname === "/web/blocks" && request.method === "GET") return await AdminRoutes.webBlocks(env, user);
      if (url.pathname === "/web/blocks" && request.method === "POST") return await AdminRoutes.webBlocksSave(env, user, request);
      if (url.pathname === "/web/offers-surfaces" && request.method === "GET") return await AdminRoutes.webOfferSurfaces(env, user);
      if (url.pathname === "/web/sponsor-surfaces" && request.method === "GET") return await AdminRoutes.webSponsorSurfaces(env, user);
      if (url.pathname === "/web/sponsor-surfaces" && request.method === "POST") return await AdminRoutes.webSponsorSurfacesSave(env, user, request);
      if (url.pathname === "/web/push-entrypoints" && request.method === "GET") return await AdminRoutes.webPushEntrypoints(env, user);
      if (url.pathname === "/web/media" && request.method === "GET") return await AdminRoutes.webMedia(env, user);
      if (url.pathname === "/web/media" && request.method === "POST") return await AdminRoutes.webMediaUpload(env, user, request);

      if (url.pathname === "/crm" && request.method === "GET") return redirect("/crm/fans");
      if (url.pathname === "/crm/fans" && request.method === "GET") return await AdminRoutes.crmFans(env, user);
      if (url.pathname === "/crm/fans" && request.method === "POST") return await AdminRoutes.crmFansCreate(env, user, request);
      const fanMatch = url.pathname.match(/^\/crm\/fans\/(\d+)$/);
      if (fanMatch && request.method === "GET") return await AdminRoutes.crmFanDetail(env, user, Number(fanMatch[1]));
      if (url.pathname === "/crm/segments" && request.method === "GET") return await AdminRoutes.crmSegments(env, user);

      if (url.pathname === "/campaigns" && request.method === "GET") return redirect("/campaigns/list");
      if (url.pathname === "/campaigns/list" && request.method === "GET") return await AdminRoutes.campaignsList(env, user);
      if (url.pathname === "/campaigns/calendar" && request.method === "GET") return await AdminRoutes.campaignsCalendar(env, user);
      if (url.pathname === "/campaigns/new" && request.method === "GET") return await AdminRoutes.campaignsBuilder(env, user);
      if (url.pathname === "/campaigns/new" && request.method === "POST") return await AdminRoutes.campaignsCreate(env, user, request);
      if (url.pathname === "/campaigns/playbooks" && request.method === "GET") return await AdminRoutes.campaignsPlaybooks(env, user);
      if (url.pathname === "/campaigns/recommendations" && request.method === "GET") return await AdminRoutes.campaignsRecommendations(env, user);
      if (url.pathname === "/campaigns/automations" && request.method === "GET") return await AdminRoutes.campaignsAutomations(env, user);

      if (url.pathname === "/analytics" && request.method === "GET") return redirect("/analytics/overview");
      if (url.pathname === "/analytics/narratives" && request.method === "GET") return await AdminRoutes.analyticsNarratives(env, user);
      if (url.pathname === "/analytics/overview" && request.method === "GET") return await AdminRoutes.analyticsOverview(env, user);
      if (url.pathname === "/analytics/attribution" && request.method === "GET") return await AdminRoutes.analyticsAttribution(env, user);
      if (url.pathname === "/analytics/funnel" && request.method === "GET") return await AdminRoutes.analyticsFunnel(env, user);
      if (url.pathname === "/analytics/segments" && request.method === "GET") return await AdminRoutes.analyticsSegments(env, user);
      if (url.pathname === "/analytics/web-tag" && request.method === "GET") return await AdminRoutes.analyticsWebTag(env, user);

      if (url.pathname === "/commerce" && request.method === "GET") return redirect("/commerce/catalog/tickets");
      if (url.pathname === "/commerce/catalog/tickets" && request.method === "GET") return await AdminRoutes.commerceCatalogTickets(env, user);
      if (url.pathname === "/commerce/catalog/products" && request.method === "GET") return await AdminRoutes.commerceCatalogProducts(env, user);
      if (url.pathname === "/commerce/catalog/offers" && request.method === "GET") return await AdminRoutes.commerceOffers(env, user);
      if (url.pathname === "/commerce/orders" && request.method === "GET") return await AdminRoutes.commerceOrders(env, user);
      if (url.pathname === "/commerce/promotions" && request.method === "GET") return await AdminRoutes.commercePromotions(env, user);
      if (url.pathname === "/commerce/checkout" && request.method === "GET") return await AdminRoutes.commerceCheckout(env, user);
      if (url.pathname === "/commerce/reconciliation" && request.method === "GET") return await AdminRoutes.commerceReconciliation(env, user);

      if (url.pathname === "/settings" && request.method === "GET") return redirect("/settings/users");
      if (url.pathname === "/settings/users" && request.method === "GET") return await AdminRoutes.settingsUsers(env, user);
      if (url.pathname === "/settings/integrations" && request.method === "GET") return await AdminRoutes.settingsIntegrations(env, user);
      if (url.pathname === "/settings/privacy" && request.method === "GET") return await AdminRoutes.settingsPrivacy(env, user);
      if (url.pathname === "/settings/privacy" && request.method === "POST") return await AdminRoutes.settingsPrivacyToggle(env, user, request);
      if (url.pathname === "/settings/customization" && request.method === "GET") return await AdminRoutes.settingsCustomization(env, user);
      if (url.pathname === "/settings/customization" && request.method === "POST") return await AdminRoutes.settingsCustomizationSave(env, user, request);
      if (url.pathname === "/settings/environments" && request.method === "GET") return await AdminRoutes.settingsEnvironments(env, user);

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
