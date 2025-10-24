# Sports Team CMS + CRM (Cloudflare Workers + D1 + R2)

An end-to-end starter kit for a sports franchise website that now includes a richer
homepage, long-form news posts, and sponsor management alongside the existing fan
CRM tooling. Everything runs on Cloudflare:

- Cloudflare **Workers** (TypeScript, ES modules).
- **Static assets** via the Workers Assets binding.
- **D1** powers auth, content, fans, posts, sponsors, and UI settings.
- **R2** stores uploaded media such as logos and hero imagery.
- Server-rendered **HTML** pages (no client framework or npm deps for the runtime).
- A batteries-included admin UI for content, fans, posts, sponsors, settings, and media.
- Fan-facing site with a configurable hero, latest posts, sponsor grid, and CMS content.

> Designed to be extended heavily; code stays dependency-free and is organized for growth.

## Highlights

- **Homepage refresh** – configurable hero (headline, subheadline, background image),
  featured posts, and sponsor grid sourced from D1/R2.
- **Posts module** – create/update long-form news posts, with published/draft workflow.
- **Sponsor management** – track sponsor logos, sort order, visibility, and outbound links.
- **Settings enhancements** – color palette, branding assets, and hero copy all managed in
  D1 settings.
- **Media library** – upload assets to R2 and reuse them across the site.
- **CRM fundamentals** – manage fan signups and page content in the same interface.

## Repo Structure

```
.
├── wrangler.jsonc
├── README.md
├── .gitignore
├── db/
│   └── migrations/
│       ├── 0001_init.sql          # Core auth/CRM/content schema & seed data
│       └── 0002_homepage.sql      # Homepage posts, sponsors, hero settings
├── ui/
│   └── public/
│       ├── assets/
│       │   ├── css/styles.css
│       │   └── logo.svg
│       └── robots.txt
└── workers/
    ├── index.ts              # Main worker (routes + SSR)
    ├── types.ts              # Env & data types
    ├── db/queries.ts         # D1 query helpers
    ├── utils/html.ts         # SSR helpers
    ├── utils/auth.ts         # Minimal auth (cookie HMAC)
    ├── admin/routes.ts       # Admin routes (fans, content, posts, sponsors, media, settings)
    ├── admin/templates.ts    # Admin SSR templates
    ├── fan/routes.ts         # Fan site routes (homepage)
    ├── fan/templates.ts      # Fan SSR templates (hero/news/sponsors widgets)
    └── api/
        ├── mock-feature-a.ts # Scaffold for future APIs
        └── mock-feature-b.ts # Scaffold for future APIs
```

## Database Schema (D1)

| Table      | Purpose |
|------------|---------|
| `users`    | Admin accounts with salted SHA-256 credentials and roles. |
| `fans`     | Fan CRM records, including favorite team metadata. |
| `content`  | CMS pages (e.g., `home`) with publish toggles. |
| `settings` | Key/value site configuration: colors, hero copy, asset keys. |
| `media`    | Metadata for objects stored in R2. |
| `posts`    | Long-form news updates with excerpt, publish state, timestamps. |
| `sponsors` | Sponsor directory with logo keys, sort order, visibility flags. |

Each migration is idempotent so you can safely re-run it locally while iterating.

## Prerequisites

- Cloudflare account & Workers, D1, R2 enabled.
- `wrangler` CLI installed.

## Setup

1. **Create D1** and **R2**:
   ```bash
   wrangler d1 create teamdb
   wrangler r2 bucket create <R2_BUCKET_NAME>
   ```

2. Update placeholders in **wrangler.jsonc**:
   - `<D1_DATABASE_ID>` from `wrangler d1 list`
   - `<R2_BUCKET_NAME>`
   - `<your-domain.example.com>` and `BASE_URL`
   - Generate a random `SESSION_SECRET` (base64-encoded).

3. Apply the migrations (runs both `0001` and `0002`):
   ```bash
   wrangler d1 migrations apply teamdb --local --remote
   ```

4. **Dev**:
   ```bash
   wrangler dev
   ```
   - Admin: `http://127.0.0.1:8787/admin`
   - Fan site: `http://127.0.0.1:8787/`

5. **Publish**:
   ```bash
   wrangler deploy
   ```

## Admin modules

- **Dashboard** – Snapshot of fans, content, media, posts, and sponsors.
- **Fans** – Capture and list up to 200 most recent fans.
- **Content** – Manage arbitrary CMS pages; seed includes a published `home` record.
- **Posts** – Publish news with excerpts, draft/publish workflow, and automatic timestamps.
- **Sponsors** – Manage sponsor metadata, choose uploaded logos, and control sort order.
- **Settings** – Update color palette, pick logo/hero background from uploaded media, and
  edit hero headline/subheadline copy.
- **Media** – Upload assets to R2 (hero backgrounds, sponsor logos, etc.).

## Homepage experience

The fan-facing homepage renders three core sections:

1. **Hero banner** – Uses `settings.hero_headline`, `settings.hero_subheadline`, and an
   optional `settings.hero_background_key` (must reference an R2 object key). Falls back
   to the `home` content title if no hero copy exists.
2. **Latest News** – Shows the three most recent published posts ordered by
   `published_at` (or creation time when unpublished).
3. **Featured Sponsors** – Displays up to four published sponsors sorted by `sort_order`.

All data and configuration come from D1, so keeping migrations up to date ensures the
homepage stays in sync with admin edits.

## Auth (D1, no deps)

- Users stored in D1 with salted SHA-256 password hashes.
- Sessions use an HMAC-signed cookie (`sid`) with expiry. Rotate `SESSION_SECRET` to invalidate.

## Media (R2)

- Admin uploads via `/admin/media` with a simple `<form>`.
- Uploaded files stored with generated keys under `uploads/YYYY/MM/`.

## Security & Headers

- Basic security headers included.
- Minimal CORS example for API endpoints (locked by default).

## Migrations

- `0001_init.sql` sets up users, fans, content, media, settings, and seeds the default
  admin user plus a `home` page and base color palette.
- `0002_homepage.sql` introduces posts and sponsors tables, default hero copy, and seed
  data for the refreshed homepage.

## Curl Tests

### Health
```bash
curl -i https://<your-domain.example.com>/health
```

### Login (default seeded admin: admin@example.com / admin123 — change after first login)
```bash
curl -i -X POST https://<your-domain.example.com>/login \
  -d "email=admin@example.com&password=admin123" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

### Create Fan
```bash
curl -i -X POST https://<your-domain.example.com>/admin/fans \
  --cookie "sid=<paste-from-login>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Sam Supporter&email=sam@example.com&favorite_team=First Team"
```

### Upload Media (R2)
```bash
curl -i -X POST https://<your-domain.example.com>/admin/media \
  --cookie "sid=<paste-from-login>" \
  -F file=@/path/to/image.jpg
```

## Notes

- This is a base to extend: add DOs, queues, analytics, etc. as needed.
- Keep migrations idempotent and evolve schema in `db/migrations`.
- Uploaded media keys can be referenced directly in settings (logo, hero background) and
  sponsors to surface assets on the public site.
