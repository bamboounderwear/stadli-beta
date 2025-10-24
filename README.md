# Sports Team CMS + CRM (Cloudflare Workers + D1 + R2)

A minimal, extensible boilerplate for a sports team CMS+CRM with:
- Cloudflare **Workers** (TypeScript, ES modules).
- **Static assets** via Assets binding.
- **D1** for auth, content, fan profiles, and styling/config.
- **R2** for media uploads.
- Server-side rendered **HTML** pages (no client framework).
- Admin interface for content, fans, and styles.
- Fan-visible website.

> Designed to be extended heavily; code is dependency-free and organized for growth.

## Repo Structure

```
.
├── wrangler.jsonc
├── README.md
├── .gitignore
├── db/
│   └── migrations/
│       └── 0001_init.sql
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
    ├── admin/routes.ts       # Admin routes
    ├── admin/templates.ts    # Admin SSR templates
    ├── fan/routes.ts         # Fan site routes
    ├── fan/templates.ts      # Fan SSR templates
    └── api/
        ├── mock-feature-a.ts # Scaffold for future APIs
        └── mock-feature-b.ts # Scaffold for future APIs
```

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

3. Apply the initial migration:
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

## Auth (D1, no deps)

- Users stored in D1 with salted SHA-256 password hashes.
- Sessions use an HMAC-signed cookie (`sid`) with expiry. Rotate `SESSION_SECRET` to invalidate.

## Media (R2)

- Admin uploads via `/admin/media` with a simple `<form>`.
- Uploaded files stored with generated keys under `uploads/YYYY/MM/`.

## Security & Headers

- Basic security headers included.
- Minimal CORS example for API endpoints (locked by default).

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
