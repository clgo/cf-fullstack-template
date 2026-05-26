-- ── Schema Migrations Tracker ─────────────────────────────────────────────────
-- Every DDL change must include an INSERT here in the same wrangler command.
-- Version slug format: vX.XX-short-kebab-description
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Example: Items table ───────────────────────────────────────────────────────
-- Replace or extend this with your actual data model.
CREATE TABLE IF NOT EXISTS items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  description TEXT,
  status      TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Settings ──────────────────────────────────────────────────────────────────
-- Key-value store for app configuration (API keys, feature flags).
-- Secrets are stored encrypted; config values are returned in GET /api/settings.
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'config' CHECK (type IN ('secret', 'config')),
  label      TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Seed migration history ────────────────────────────────────────────────────
INSERT OR IGNORE INTO schema_migrations (version, description)
VALUES ('v1.00-initial-schema', 'Initial schema: items + settings tables');
