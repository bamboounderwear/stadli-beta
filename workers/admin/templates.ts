import type { Content, Fan, Media, Post, Sponsor, User } from "../types";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c] as string));

export const AdminViews = {
  dashboard({ user, counts }: { user: User; counts: { fans: number; content: number; media: number; posts: number; sponsors: number } }) {
    return `
      <h1>Admin Dashboard</h1>
      <div class="card" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;">
        <div class="card"><strong>Fans</strong><div style="font-size:2rem;">${counts.fans}</div></div>
        <div class="card"><strong>Content</strong><div style="font-size:2rem;">${counts.content}</div></div>
        <div class="card"><strong>Media</strong><div style="font-size:2rem;">${counts.media}</div></div>
        <div class="card"><strong>Posts</strong><div style="font-size:2rem;">${counts.posts}</div></div>
        <div class="card"><strong>Sponsors</strong><div style="font-size:2rem;">${counts.sponsors}</div></div>
      </div>
      <div style="margin-top:1rem;">
        <a class="btn btn-primary" href="/admin/content">Manage Content</a>
        <a class="btn" href="/admin/fans">Manage Fans</a>
        <a class="btn" href="/admin/posts">Manage Posts</a>
        <a class="btn" href="/admin/sponsors">Manage Sponsors</a>
        <a class="btn" href="/admin/settings">Settings</a>
        <a class="btn" href="/admin/media">Media</a>
      </div>
    `;
  },

  login() {
    return `
      <h1>Admin Login</h1>
      <form method="post" action="/login" class="card" style="max-width:420px;">
        <div class="form-group">
          <label>Email</label>
          <input name="email" type="email" required/>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input name="password" type="password" required/>
        </div>
        <button class="btn btn-primary" type="submit">Sign in</button>
      </form>
    `;
  },

  fansList({ fans }: { fans: Fan[] }) {
    const rows = fans.map(f => `<tr><td>${f.id}</td><td>${f.name}</td><td>${f.email}</td><td>${f.favorite_team ?? ""}</td><td>${f.created_at}</td></tr>`).join("");
    return `
      <h1>Fans</h1>
      <form method="post" action="/admin/fans" class="card">
        <div class="form-group"><label>Name</label><input name="name" required></div>
        <div class="form-group"><label>Email</label><input name="email" type="email" required></div>
        <div class="form-group"><label>Favorite Team</label><input name="favorite_team"></div>
        <button class="btn btn-primary" type="submit">Add Fan</button>
      </form>
      <div class="card" style="margin-top:1rem; overflow-x:auto;">
        <table class="table">
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Fav</th><th>Joined</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  contentList({ items }: { items: Content[] }) {
    const rows = items.map(c => `<tr><td>${c.id}</td><td>${c.slug}</td><td>${c.title}</td><td>${c.published ? "Yes" : "No"}</td><td>${c.created_at}</td></tr>`).join("");
    return `
      <h1>Content</h1>
      <form method="post" action="/admin/content" class="card">
        <div class="form-group"><label>Slug</label><input name="slug" required></div>
        <div class="form-group"><label>Title</label><input name="title" required></div>
        <div class="form-group"><label>Body</label><textarea name="body" rows="6" required></textarea></div>
        <div class="form-group"><label>Published</label><select name="published"><option value="1">Yes</option><option value="0">No</option></select></div>
        <button class="btn btn-primary" type="submit">Create</button>
      </form>
      <div class="card" style="margin-top:1rem; overflow-x:auto;">
        <table class="table">
          <thead><tr><th>ID</th><th>Slug</th><th>Title</th><th>Published</th><th>Created</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  posts({ posts }: { posts: Post[] }) {
    const list = posts
      .map((post) => {
        return `
          <details class="card" style="margin-bottom:1rem;">
            <summary><strong>${esc(post.title)}</strong> <span style="font-size:0.85rem;color:#6b7280;">/${esc(post.slug)}</span></summary>
            <form method="post" action="/admin/posts" style="margin-top:1rem;display:grid;gap:.8rem;">
              <input type="hidden" name="id" value="${post.id}">
              <div class="form-group"><label>Slug</label><input name="slug" value="${esc(post.slug)}" required></div>
              <div class="form-group"><label>Title</label><input name="title" value="${esc(post.title)}" required></div>
              <div class="form-group"><label>Excerpt</label><textarea name="excerpt" rows="2">${esc(post.excerpt ?? "")}</textarea></div>
              <div class="form-group"><label>Body (HTML allowed)</label><textarea name="body" rows="6" required>${esc(post.body)}</textarea></div>
              <div class="form-group"><label>Status</label><select name="published"><option value="1"${post.published ? " selected" : ""}>Published</option><option value="0"${post.published ? "" : " selected"}>Draft</option></select></div>
              <button class="btn btn-primary" type="submit">Update Post</button>
            </form>
          </details>
        `;
      })
      .join("");
    return `
      <h1>Posts</h1>
      <form method="post" action="/admin/posts" class="card" style="margin-bottom:1rem;display:grid;gap:.8rem;">
        <input type="hidden" name="id" value="">
        <div class="form-group"><label>Slug</label><input name="slug" placeholder="slug" required></div>
        <div class="form-group"><label>Title</label><input name="title" required></div>
        <div class="form-group"><label>Excerpt</label><textarea name="excerpt" rows="2"></textarea></div>
        <div class="form-group"><label>Body (HTML allowed)</label><textarea name="body" rows="6" required></textarea></div>
        <div class="form-group"><label>Status</label><select name="published"><option value="1">Published</option><option value="0" selected>Draft</option></select></div>
        <button class="btn btn-primary" type="submit">Create Post</button>
      </form>
      ${list || '<p>No posts yet.</p>'}
    `;
  },

  sponsors({ sponsors, media }: { sponsors: Sponsor[]; media: Media[] }) {
    const mediaOptions = media
      .map((m) => `<option value="${esc(m.key)}">${esc(m.filename)}</option>`)
      .join("");
    const cards = sponsors
      .map((sponsor) => {
        return `
          <details class="card" style="margin-bottom:1rem;">
            <summary><strong>${esc(sponsor.name)}</strong></summary>
            <form method="post" action="/admin/sponsors" style="margin-top:1rem;display:grid;gap:.8rem;">
              <input type="hidden" name="id" value="${sponsor.id}">
              <div class="form-group"><label>Name</label><input name="name" value="${esc(sponsor.name)}" required></div>
              <div class="form-group"><label>Website URL</label><input name="website_url" value="${esc(sponsor.website_url ?? "")}" placeholder="https://"></div>
              <div class="form-group"><label>Sort Order</label><input name="sort_order" type="number" value="${sponsor.sort_order}"></div>
              <div class="form-group"><label>Logo</label><select name="logo_key"><option value=""${sponsor.logo_key ? "" : " selected"}>None</option>${media
                .map((m) => `<option value="${esc(m.key)}"${sponsor.logo_key === m.key ? " selected" : ""}>${esc(m.filename)}</option>`)
                .join("")}</select></div>
              <div class="form-group"><label>Status</label><select name="published"><option value="1"${sponsor.published ? " selected" : ""}>Visible</option><option value="0"${sponsor.published ? "" : " selected"}>Hidden</option></select></div>
              <button class="btn btn-primary" type="submit">Update Sponsor</button>
            </form>
          </details>
        `;
      })
      .join("");
    return `
      <h1>Sponsors</h1>
      <form method="post" action="/admin/sponsors" class="card" style="margin-bottom:1rem;display:grid;gap:.8rem;">
        <input type="hidden" name="id" value="">
        <div class="form-group"><label>Name</label><input name="name" required></div>
        <div class="form-group"><label>Website URL</label><input name="website_url" placeholder="https://"></div>
        <div class="form-group"><label>Sort Order</label><input name="sort_order" type="number" value="0"></div>
        <div class="form-group"><label>Logo</label><select name="logo_key"><option value="" selected>None</option>${mediaOptions}</select><div class="hint">Upload logos in <a href="/admin/media">Media</a></div></div>
        <div class="form-group"><label>Status</label><select name="published"><option value="1">Visible</option><option value="0" selected>Hidden</option></select></div>
        <button class="btn btn-primary" type="submit">Add Sponsor</button>
      </form>
      ${cards || '<p>No sponsors yet.</p>'}
    `;
  },
  settings({ settings, media }: { settings: Record<string,string>; media: Media[] }) {
    const primary = settings.primary_color ?? "#0b5fff";
    const secondary = settings.secondary_color ?? "#111827";
    const logoKey = settings.logo_key ?? "";
    const heroHeadline = settings.hero_headline ?? "Welcome to the Club";
    const heroSubheadline = settings.hero_subheadline ?? "Get the latest updates, stories, and exclusive content straight from the team.";
    const heroBackground = settings.hero_background_key ?? "";
    const logoOptions = media
      .map((m) => {
        const selected = logoKey === m.key ? " selected" : "";
        return `<option value="${esc(m.key)}"${selected}>${esc(m.filename)}</option>`;
      })
      .join("");
    const heroOptions = media
      .map((m) => {
        const selected = heroBackground === m.key ? " selected" : "";
        return `<option value="${esc(m.key)}"${selected}>${esc(m.filename)}</option>`;
      })
      .join("");
    const logoPreview = logoKey
      ? `<div style="margin-top:1rem;"><strong>Current Logo Preview</strong><div class="card" style="max-width:200px;"><img src="/media/${esc(logoKey)}" alt="Team logo" style="width:100%;height:auto;"/></div></div>`
      : "";
    return `
      <h1>Settings</h1>
      <form method="post" action="/admin/settings" class="card" style="max-width:520px;">
        <div class="form-group"><label>Primary Color</label><input name="primary_color" value="${esc(primary)}"></div>
        <div class="form-group"><label>Secondary Color</label><input name="secondary_color" value="${esc(secondary)}"></div>
        <div class="form-group">
          <label>Logo</label>
          <select name="logo_key">
            <option value=""${logoKey ? "" : " selected"}>Default</option>
            ${logoOptions}
          </select>
          <div class="hint">Upload logos in <a href="/admin/media">Media</a> then select one here.</div>
        </div>
        <hr style="margin:1.2rem 0;">
        <h2>Homepage Hero</h2>
        <div class="form-group"><label>Headline</label><input name="hero_headline" value="${esc(heroHeadline)}"></div>
        <div class="form-group"><label>Subheadline</label><textarea name="hero_subheadline" rows="3">${esc(heroSubheadline)}</textarea></div>
        <div class="form-group">
          <label>Background Image</label>
          <select name="hero_background_key">
            <option value=""${heroBackground ? "" : " selected"}>None</option>
            ${heroOptions}
          </select>
          <div class="hint">Select an uploaded media asset to show behind the hero banner.</div>
        </div>
        <button class="btn btn-primary" type="submit">Save</button>
      </form>
      ${logoPreview}
    `;
  },

  media({ media }: { media: Media[] }) {
    const rows = media.map(m => `<tr><td>${m.id}</td><td><a href="/media/${m.key}" target="_blank">${m.filename}</a></td><td>${m.size ?? ""}</td><td>${m.uploaded_at}</td></tr>`).join("");
    return `
      <h1>Media</h1>
      <form method="post" action="/admin/media" enctype="multipart/form-data" class="card" style="max-width:520px;">
        <div class="form-group"><input type="file" name="file" required></div>
        <button class="btn btn-primary" type="submit">Upload</button>
      </form>
      <div class="card" style="margin-top:1rem; overflow-x:auto;">
        <table class="table">
          <thead><tr><th>ID</th><th>Filename</th><th>Size</th><th>Uploaded</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }
};
