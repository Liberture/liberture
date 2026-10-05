-- Habit tracker tables, run by Postgres on a fresh volume (compose.liberture-habits.yaml).
-- prisma/schema.prisma models the same tables; `prisma db push` keeps them in sync.
-- Create habit_users table for storing user data
CREATE TABLE IF NOT EXISTS habit_users (
    id SERIAL PRIMARY KEY,
    api_key TEXT UNIQUE NOT NULL,
    integration_token_hash TEXT,
    integration_token_prefix TEXT,
    nostr_pubkey TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on api_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_habit_users_api_key ON habit_users(api_key);

-- Create index on updated_at for maintenance queries
CREATE INDEX IF NOT EXISTS idx_habit_users_updated_at ON habit_users(updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_users_nostr_pubkey
    ON habit_users(nostr_pubkey)
    WHERE nostr_pubkey IS NOT NULL;

CREATE TABLE IF NOT EXISTS nostr_challenges (
    pubkey TEXT PRIMARY KEY,
    nonce TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS nostr_sessions (
    token TEXT PRIMARY KEY,
    pubkey TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nostr_sessions_pubkey ON nostr_sessions(pubkey);
CREATE INDEX IF NOT EXISTS idx_nostr_sessions_expires ON nostr_sessions(expires_at);

-- Normalized write-heavy data. habit_users.data remains the JSON import/export format.
CREATE TABLE IF NOT EXISTS habit_projects (
    user_id INTEGER NOT NULL REFERENCES habit_users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    created_at TEXT NOT NULL,
    body JSONB NOT NULL,
    PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_habit_projects_user_name ON habit_projects(user_id, name);

CREATE TABLE IF NOT EXISTS habit_todos (
    user_id INTEGER NOT NULL REFERENCES habit_users(id) ON DELETE CASCADE,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    due_time TEXT,
    priority SMALLINT NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'incomplete',
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    project_id TEXT,
    estimated_minutes INTEGER,
    energy_level TEXT,
    can_topolino_help BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    body JSONB NOT NULL,
    PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_habit_todos_user_status ON habit_todos(user_id, status);
CREATE INDEX IF NOT EXISTS idx_habit_todos_user_due_date ON habit_todos(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_habit_todos_user_project ON habit_todos(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_habit_todos_user_created ON habit_todos(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS habit_completions (
    user_id INTEGER NOT NULL REFERENCES habit_users(id) ON DELETE CASCADE,
    habit_id TEXT NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TEXT,
    entry_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    body JSONB NOT NULL,
    PRIMARY KEY (user_id, habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_habit ON habit_completions(user_id, habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_completed ON habit_completions(user_id, completed);

-- Sample query to verify setup
-- SELECT COUNT(*) FROM habit_users;

-- Live updates: notify open trackers when a user's data changes
-- (lib/habits/change-events.ts also installs this at runtime).
CREATE OR REPLACE FUNCTION habit_users_notify_change() RETURNS trigger AS $$
BEGIN
  IF NEW.data->>'lastUpdated' IS DISTINCT FROM OLD.data->>'lastUpdated' THEN
    PERFORM pg_notify(
      'habit_changes',
      json_build_object('userId', NEW.id, 'lastUpdated', NEW.data->>'lastUpdated')::text
    );
  END IF;
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS habit_users_notify_change ON habit_users;
CREATE TRIGGER habit_users_notify_change
  AFTER UPDATE ON habit_users
  FOR EACH ROW EXECUTE FUNCTION habit_users_notify_change();
