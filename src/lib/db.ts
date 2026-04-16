import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || "./data/socialsocial.db";

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(path.resolve(DB_PATH));
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS instagram_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      instagram_id TEXT NOT NULL,
      username TEXT NOT NULL,
      access_token TEXT NOT NULL,
      token_expires_at TEXT,
      profile_picture_url TEXT,
      followers_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, instagram_id)
    );

    CREATE TABLE IF NOT EXISTS content_research (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      topic TEXT NOT NULL,
      research_data TEXT NOT NULL,
      trends TEXT,
      content_angles TEXT,
      hashtags TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS carousels (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT REFERENCES instagram_accounts(id),
      title TEXT NOT NULL,
      slides TEXT NOT NULL,
      caption TEXT,
      hashtags TEXT,
      status TEXT DEFAULT 'draft',
      scheduled_at TEXT,
      published_at TEXT,
      instagram_post_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reels (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT REFERENCES instagram_accounts(id),
      title TEXT NOT NULL,
      hook TEXT,
      script TEXT NOT NULL,
      cta TEXT,
      caption TEXT,
      hashtags TEXT,
      music_suggestion TEXT,
      duration_seconds INTEGER,
      status TEXT DEFAULT 'draft',
      scheduled_at TEXT,
      published_at TEXT,
      instagram_post_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT NOT NULL REFERENCES instagram_accounts(id),
      content_type TEXT NOT NULL,
      content_id TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_calendar (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT REFERENCES instagram_accounts(id),
      date TEXT NOT NULL,
      theme TEXT,
      content_type TEXT,
      content_id TEXT,
      notes TEXT,
      status TEXT DEFAULT 'planned',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
