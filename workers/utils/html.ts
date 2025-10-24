import type { Setting, User } from "../types";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c] as string));
}

export function layout(opts: {
  title?: string;
  siteName?: string;
  user?: User | null;
  body: string;
  flash?: string | null;
  settings?: Record<string, string>;
}): Response {
  const title = esc(opts.title ?? opts.siteName ?? "Site");
  const flash = opts.flash ? `<div class="alert">${esc(opts.flash)}</div>` : "";
  const primary = opts.settings?.primary_color ?? "#0b5fff";
  const secondary = opts.settings?.secondary_color ?? "#111827";
  return html(`
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <link rel="stylesheet" href="/assets/assets/css/styles.css">
    <style>
      :root { --primary: ${primary}; --secondary: ${secondary}; }
    </style>
  </head>
  <body>
    <header class="header">
      <div class="container" style="display:flex;align-items:center;gap:1rem;">
        <img src="/assets/assets/logo.svg" alt="logo" width="40" height="40"/>
        <div style="flex:1 1 auto; font-weight:600">${esc(opts.siteName ?? "Team")}</div>
        <nav style="display:flex; gap:.8rem;">
          <a href="/">Home</a>
          <a href="/admin">Admin</a>
          ${opts.user ? `<span>Hi, ${esc(opts.user.email)}</span> <a href="/logout">Logout</a>` : `<a href="/login">Login</a>`}
        </nav>
      </div>
    </header>
    <main class="container" style="min-height:60vh;">${flash}${opts.body}</main>
    <footer class="footer"><div class="container">&copy; ${new Date().getFullYear()} ${esc(opts.siteName ?? "Team")}.</div></footer>
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
