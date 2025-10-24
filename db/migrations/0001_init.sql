-- D1 initial schema

PRAGMA foreign_keys = ON;

-- Users (admin users for CMS)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Fans (CRM)
CREATE TABLE IF NOT EXISTS fans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  favorite_team TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Content (team website)
CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT
);

-- Styles / Config
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Media
CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL, -- R2 object key
  filename TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  uploaded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- Seed admin (email: admin@example.com, password: admin123) — change after deploy
-- Simple salted SHA-256; update via /admin/account to reset.
INSERT OR IGNORE INTO users (email, password_hash, salt, role) VALUES (
  'admin@example.com',
  '8bb145e687f8d6a0f74a3d4f0e6f7a8d4fc34eae8a4a3b8a0a5bca2b76a85f6c', -- sha256('admin123' + 'salt123')
  'salt123',
  'owner'
);

-- Seed homepage content
INSERT OR IGNORE INTO content (slug, title, body, published) VALUES
('home', 'Welcome to The Team', '<p>Game on! This is your new site.</p>', 1);

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
('primary_color', '#0b5fff'),
('secondary_color', '#111827'),
('logo_key', '');
