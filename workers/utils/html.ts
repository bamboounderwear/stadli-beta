import type { User } from "../types";

const NAV_ITEMS = [
  { id: "home", label: "Home", path: "/home", accent: "#4CF3D1", glow: "rgba(76,243,209,0.22)" },
  { id: "web", label: "Web App / Website", path: "/web", accent: "#45D7FF", glow: "rgba(69,215,255,0.22)" },
  { id: "crm", label: "CRM / Fan 360", path: "/crm", accent: "#FF87C8", glow: "rgba(255,135,200,0.2)" },
  { id: "campaigns", label: "Campaign Engine", path: "/campaigns", accent: "#FF5A1F", glow: "rgba(255,90,31,0.22)" },
  { id: "analytics", label: "Narratives & Analytics", path: "/analytics", accent: "#99CD64", glow: "rgba(153,205,100,0.24)" },
  { id: "commerce", label: "Commerce & Ticketing", path: "/commerce", accent: "#FFD93B", glow: "rgba(255,217,59,0.25)" },
  { id: "settings", label: "Settings & Admin", path: "/settings", accent: "#9B5CFF", glow: "rgba(155,92,255,0.22)" }
] as const;

type WorkspaceNavItem = typeof NAV_ITEMS[number];

type WorkspaceOptions = {
  module: WorkspaceNavItem["id"];
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: { label: string; href: string; variant?: "primary" | "ghost" | "default" }[];
  sectionNav?: { id: string; label: string; href: string; active?: boolean }[];
  searchQuery?: string;
};

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function layout(opts: {
  title?: string;
  siteName?: string;
  user?: User | null;
  body: string;
  flash?: string | null;
  settings?: Record<string, string>;
  workspace?: WorkspaceOptions;
}): Response {
  const pageTitle = esc(opts.title ?? opts.siteName ?? "Stadli");
  const flash = opts.flash ? `<div class="alert">${esc(opts.flash)}</div>` : "";
  const logoKey = opts.settings?.logo_key?.trim();
  const logoSrc = logoKey ? `/media/${esc(logoKey)}` : "/assets/logo.svg";
  const siteName = esc(opts.siteName ?? "Stadli");
  const fontLinks = `
    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  `;

  if (opts.workspace) {
    const active = NAV_ITEMS.find((item) => item.id === opts.workspace?.module) ?? NAV_ITEMS[0];
    const sidebar = NAV_ITEMS.map((item) => {
      const isActive = item.id === active.id;
      return `
        <a href="${item.path}" class="${isActive ? "is-active" : ""}">
          <span class="sidebar-nav__accent" aria-hidden="true"></span>
          ${esc(item.label)}
        </a>
      `;
    }).join("");

    const breadcrumbs = opts.workspace.breadcrumbs?.length
      ? `<nav class="breadcrumbs">${opts.workspace.breadcrumbs
          .map((crumb, idx, arr) => {
            const content = crumb.href && idx < arr.length - 1 ? `<a href="${esc(crumb.href)}">${esc(crumb.label)}</a>` : esc(crumb.label);
            return content;
          })
          .join('<span aria-hidden="true">/</span>')}</nav>`
      : "";

    const actions = opts.workspace.actions?.length
      ? `<div class="workspace-content__actions">${opts.workspace.actions
          .map((action) => {
            const variant = action.variant ?? "default";
            const cls = variant === "primary" ? "btn btn-primary" : variant === "ghost" ? "btn btn-ghost" : "btn";
            return `<a class="${cls}" href="${esc(action.href)}">${esc(action.label)}</a>`;
          })
          .join("")}</div>`
      : "";

    const sectionNav = opts.workspace.sectionNav?.length
      ? `<div class="section-card" style="padding:0.6rem 0.8rem; display:flex; gap:0.6rem; flex-wrap:wrap;">
          ${opts.workspace.sectionNav
            .map((link) => {
              const activeCls = link.active ? "btn-primary" : "btn-ghost";
              return `<a class="btn ${activeCls}" href="${esc(link.href)}">${esc(link.label)}</a>`;
            })
            .join("")}
        </div>`
      : "";

    const workspaceHeader = `
      <div class="workspace-content__header">
        <div class="workspace-content__title">
          ${opts.workspace.eyebrow ? `<span class="section-eyebrow">${esc(opts.workspace.eyebrow)}</span>` : ""}
          ${breadcrumbs}
          <h1>${esc(opts.workspace.title)}</h1>
          ${opts.workspace.description ? `<p class="section-subcopy">${esc(opts.workspace.description)}</p>` : ""}
        </div>
        ${actions}
      </div>
    `;

    const createMenu = `
      <details class="create-menu">
        <summary class="btn btn-primary">New</summary>
        <div class="create-menu__panel">
          <a href="/campaigns/new">New Campaign</a>
          <a href="/crm/segments/new">New Segment Rule</a>
          <a href="/commerce/catalog/offers/new">Add Product / Offer</a>
        </div>
      </details>
    `;

    const activityButton = `<a class="btn btn-ghost" href="/home#activity">Activity Feed</a>`;
    const workspaceShellStyle = `--module-accent: ${active.accent}; --module-accent-glow: ${active.glow};`;

    return html(`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${pageTitle}</title>
    ${fontLinks}
    <link rel="stylesheet" href="/assets/css/styles.css">
  </head>
  <body>
    <div class="workspace-shell" style="${workspaceShellStyle}">
      <aside class="workspace-sidebar">
        <div class="workspace-brand">
          <img src="${logoSrc}" alt="${siteName} logo" width="42" height="42"/>
          <span class="workspace-brand__name">${siteName}</span>
        </div>
        <nav class="sidebar-nav">${sidebar}</nav>
        <div class="sidebar-footer">
          <div>Global Search <span class="badge">⌘K</span></div>
          <div>Roles: Admin · GM · Marketing · Ops</div>
        </div>
      </aside>
      <div class="workspace-main">
        <header class="workspace-topbar">
          <form class="workspace-topbar__search" method="get" action="/search" role="search">
            <label class="sr-only" for="workspace-global-search">Global search</label>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
              <circle cx="11" cy="11" r="7" opacity="0.5"></circle>
              <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
            </svg>
            <input
              id="workspace-global-search"
              type="search"
              name="q"
              placeholder="Search fans, segments, campaigns, orders…"
              aria-label="Global search"
              value="${esc(opts.workspace.searchQuery ?? "")}" 
            />
          </form>
          <div class="workspace-topbar__actions">
            ${createMenu}
            ${activityButton}
            <div class="workspace-user">
              <span>${opts.user ? esc(opts.user.email) : "Signed out"}</span>
              <strong>${siteName}</strong>
            </div>
          </div>
        </header>
        <main class="workspace-content">
          ${workspaceHeader}
          ${sectionNav}
          ${flash}
          ${opts.body}
        </main>
        <footer class="footer">&copy; ${new Date().getFullYear()} ${siteName}</footer>
      </div>
    </div>
  </body>
</html>
    `, 200, "text/html");
  }

  const navLinks = opts.user
    ? `<a href="/home">Workspace</a><a href="/logout">Sign out</a>`
    : `<a href="/login">Admin</a>`;

  return html(`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${pageTitle}</title>
    ${fontLinks}
    <link rel="stylesheet" href="/assets/css/styles.css">
  </head>
  <body>
    <header class="site-header">
      <div class="container site-header__row">
        <div class="site-header__brand">
          <img src="${logoSrc}" alt="${siteName} logo" width="40" height="40"/>
          <span>${siteName}</span>
        </div>
        <nav class="site-header__nav">
          <a href="/">Home</a>
          ${navLinks}
        </nav>
      </div>
    </header>
    <main>${flash}${opts.body}</main>
    <footer class="footer">&copy; ${new Date().getFullYear()} ${siteName}</footer>
  </body>
</html>
  `, 200, "text/html");
}

export function html(body: string, status = 200, contentType = "text/html"): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": contentType + "; charset=utf-8",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "same-origin",
      "cross-origin-opener-policy": "same-origin",
    }
  });
}

export function redirect(url: string, flash?: string): Response {
  const headers: Record<string, string> = { "location": url };
  if (flash) headers["set-cookie"] = `flash=${encodeURIComponent(flash)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=10`;
  return new Response(null, { status: 302, headers });
}

export function parseFlash(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  const m = /(?:^|; )flash=([^;]+)/.exec(cookie);
  return m ? decodeURIComponent(m[1]) : null;
}
