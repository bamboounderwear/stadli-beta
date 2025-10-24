import type { Content, Fan, User } from "../types";

export const AdminViews = {
  dashboard({ user, counts }: { user: User; counts: { fans: number; content: number; media: number } }) {
    return `
      <h1>Admin Dashboard</h1>
      <div class="card" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;">
        <div class="card"><strong>Fans</strong><div style="font-size:2rem;">${counts.fans}</div></div>
        <div class="card"><strong>Content</strong><div style="font-size:2rem;">${counts.content}</div></div>
        <div class="card"><strong>Media</strong><div style="font-size:2rem;">${counts.media}</div></div>
      </div>
      <div style="margin-top:1rem;">
        <a class="btn btn-primary" href="/admin/content">Manage Content</a>
        <a class="btn" href="/admin/fans">Manage Fans</a>
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

  settings({ settings }: { settings: Record<string,string> }) {
    return `
      <h1>Settings</h1>
      <form method="post" action="/admin/settings" class="card" style="max-width:520px;">
        <div class="form-group"><label>Primary Color</label><input name="primary_color" value="${settings.primary_color ?? "#0b5fff"}"></div>
        <div class="form-group"><label>Secondary Color</label><input name="secondary_color" value="${settings.secondary_color ?? "#111827"}"></div>
        <button class="btn btn-primary" type="submit">Save</button>
      </form>
    `;
  },

  media({ media }: { media: Array<{id:number,key:string,filename:string,content_type:string|null,size:number|null,uploaded_at:string}> }) {
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
