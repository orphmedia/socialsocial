import { sql } from "@vercel/postgres";

// All queries go through Vercel Postgres in production
// Tables are created via the init endpoint or migration

export async function query(text: string, params: unknown[] = []) {
  // Replace ? placeholders with $1, $2, etc. for Postgres
  let idx = 0;
  const pgText = text.replace(/\?/g, () => `$${++idx}`);
  const result = await sql.query(pgText, params);
  return result.rows;
}

export async function queryOne(text: string, params: unknown[] = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export async function execute(text: string, params: unknown[] = []) {
  let idx = 0;
  const pgText = text.replace(/\?/g, () => `$${++idx}`);
  return sql.query(pgText, params);
}

export async function initializeDb() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS instagram_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      instagram_id TEXT NOT NULL,
      username TEXT NOT NULL,
      access_token TEXT NOT NULL,
      token_expires_at TIMESTAMPTZ,
      profile_picture_url TEXT,
      followers_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, instagram_id)
    );

    CREATE TABLE IF NOT EXISTS content_research (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      topic TEXT NOT NULL,
      research_data JSONB NOT NULL,
      trends JSONB,
      content_angles JSONB,
      hashtags JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS carousels (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT REFERENCES instagram_accounts(id),
      title TEXT NOT NULL,
      slides JSONB NOT NULL,
      caption TEXT,
      hashtags JSONB,
      status TEXT DEFAULT 'draft',
      scheduled_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      instagram_post_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reels (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT REFERENCES instagram_accounts(id),
      title TEXT NOT NULL,
      hook TEXT,
      script JSONB NOT NULL,
      cta TEXT,
      caption TEXT,
      hashtags JSONB,
      music_suggestion TEXT,
      duration_seconds INTEGER,
      status TEXT DEFAULT 'draft',
      scheduled_at TIMESTAMPTZ,
      published_at TIMESTAMPTZ,
      instagram_post_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS scheduled_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT NOT NULL REFERENCES instagram_accounts(id),
      content_type TEXT NOT NULL,
      content_id TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS content_calendar (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      account_id TEXT REFERENCES instagram_accounts(id),
      date TEXT NOT NULL,
      theme TEXT,
      content_type TEXT,
      content_id TEXT,
      notes JSONB,
      status TEXT DEFAULT 'planned',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}
