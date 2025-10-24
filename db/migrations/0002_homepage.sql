-- Homepage enhancements: posts, sponsors, and hero settings

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_posts_published ON posts (published, published_at, created_at);

CREATE TABLE IF NOT EXISTS sponsors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logo_key TEXT,
  website_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sponsors_published_sort ON sponsors (published, sort_order, name);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('hero_headline', 'Welcome to the Club'),
  ('hero_subheadline', 'Get the latest updates, stories, and exclusive content straight from the team.'),
  ('hero_background_key', '');

INSERT OR IGNORE INTO posts (slug, title, excerpt, body, published, published_at) VALUES
  ('season-opener', 'Season Opener Victory', 'A big win to start the season.', '<p>The team dominated the court in a thrilling opener with highlight plays from the starting five.</p>', 1, strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('community-day', 'Community Day Announced', 'Join us for a day with the fans!', '<p>Meet the players, get autographs, and enjoy a fun-filled fan experience.</p>', 1, strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('behind-the-scenes', 'Behind the Scenes Training', 'Go inside practice with exclusive notes from the coaching staff.', '<p>Coaches shared the weekly training plan and how rookies are adapting to the pro game.</p>', 1, strftime('%Y-%m-%dT%H:%M:%SZ','now'));

INSERT OR IGNORE INTO sponsors (name, logo_key, website_url, sort_order, published) VALUES
  ('Acme Corp', '', 'https://example.com', 1, 1),
  ('Globex', '', 'https://example.com', 2, 1),
  ('Initech', '', 'https://example.com', 3, 1);
