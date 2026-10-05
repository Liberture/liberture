import { getDb } from "@/lib/habits/db"

/**
 * Adds integration token columns to habit_users table.
 * Safe to run multiple times (IF NOT EXISTS).
 */
export async function addIntegrationTokenColumns(): Promise<void> {
  const sql = getDb()
  await sql`
    ALTER TABLE habit_users
    ADD COLUMN IF NOT EXISTS integration_token_hash TEXT,
    ADD COLUMN IF NOT EXISTS integration_token_prefix TEXT
  `
}

/**
 * Creates the nostr_challenges table for serverless-safe challenge storage.
 * Safe to run multiple times (IF NOT EXISTS).
 */
export async function createNostrChallengesTable(): Promise<void> {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS nostr_challenges (
      pubkey TEXT NOT NULL,
      nonce TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (pubkey)
    )
  `
}

/**
 * Creates the nostr_sessions table for persistent auth sessions.
 * Sessions allow users to stay logged in without re-signing on every page load.
 * Safe to run multiple times (IF NOT EXISTS).
 */
export async function createNostrSessionsTable(): Promise<void> {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS nostr_sessions (
      token TEXT PRIMARY KEY,
      pubkey TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_nostr_sessions_pubkey
    ON nostr_sessions(pubkey)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_nostr_sessions_expires
    ON nostr_sessions(expires_at)
  `
}

/**
 * Adds nostr_pubkey column to habit_users table for Nostr authentication.
 * Creates a unique index for efficient lookups.
 * Safe to run multiple times (IF NOT EXISTS).
 */
export async function addNostrPubkeyColumn(): Promise<void> {
  const sql = getDb()

  await sql`
    ALTER TABLE habit_users
    ADD COLUMN IF NOT EXISTS nostr_pubkey TEXT
  `

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_users_nostr_pubkey
    ON habit_users(nostr_pubkey)
    WHERE nostr_pubkey IS NOT NULL
  `
}

/**
 * Creates normalized tables for write-heavy todo/project/completion data.
 * The JSONB user document stays as the import/export compatibility format.
 */
export async function createOptimizedStorageTables(): Promise<void> {
  const sql = getDb()

  await sql`
    CREATE TABLE IF NOT EXISTS habit_projects (
      user_id INTEGER NOT NULL REFERENCES habit_users(id) ON DELETE CASCADE,
      id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT,
      created_at TEXT NOT NULL,
      body JSONB NOT NULL,
      PRIMARY KEY (user_id, id)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_habit_projects_user_name ON habit_projects(user_id, name)`

  await sql`
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
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_habit_todos_user_status ON habit_todos(user_id, status)`
  await sql`CREATE INDEX IF NOT EXISTS idx_habit_todos_user_due_date ON habit_todos(user_id, due_date)`
  await sql`CREATE INDEX IF NOT EXISTS idx_habit_todos_user_project ON habit_todos(user_id, project_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_habit_todos_user_created ON habit_todos(user_id, created_at DESC)`

  await sql`
    CREATE TABLE IF NOT EXISTS habit_completions (
      user_id INTEGER NOT NULL REFERENCES habit_users(id) ON DELETE CASCADE,
      habit_id TEXT NOT NULL,
      date DATE NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      completed_at TEXT,
      entry_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      body JSONB NOT NULL,
      PRIMARY KEY (user_id, habit_id, date)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, date DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_habit_completions_user_habit ON habit_completions(user_id, habit_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_habit_completions_user_completed ON habit_completions(user_id, completed)`
}

/**
 * Backfills normalized tables from the existing habit_users.data JSONB blob.
 */
export async function backfillOptimizedStorageTables(): Promise<void> {
  const sql = getDb()
  await createOptimizedStorageTables()

  await sql`
    INSERT INTO habit_projects (user_id, id, name, color, created_at, body)
    SELECT
      users.id,
      project->>'id',
      COALESCE(NULLIF(project->>'name', ''), 'Untitled'),
      NULLIF(project->>'color', ''),
      COALESCE(NULLIF(project->>'createdAt', ''), NOW()::text),
      project
    FROM habit_users users
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(users.data->'projects', '[]'::jsonb)) AS project
    WHERE project ? 'id'
    ON CONFLICT (user_id, id) DO UPDATE SET
      name = EXCLUDED.name,
      color = EXCLUDED.color,
      created_at = EXCLUDED.created_at,
      body = EXCLUDED.body
  `

  await sql`
    INSERT INTO habit_todos (
      user_id, id, title, description, due_date, due_time, priority, status,
      completed_at, created_at, updated_at, project_id, estimated_minutes,
      energy_level, can_topolino_help, notes, body
    )
    SELECT
      users.id,
      todo->>'id',
      COALESCE(NULLIF(todo->>'title', ''), 'Untitled'),
      NULLIF(todo->>'description', ''),
      CASE WHEN todo->>'dueDate' ~ '^\\d{4}-\\d{2}-\\d{2}$' THEN (todo->>'dueDate')::date ELSE NULL END,
      NULLIF(todo->>'dueTime', ''),
      CASE WHEN todo->>'priority' ~ '^[0-9]+$' THEN LEAST(5, GREATEST(1, (todo->>'priority')::int)) ELSE 3 END,
      CASE WHEN todo->>'status' IN ('incomplete', 'in_progress', 'completed') THEN todo->>'status' ELSE 'incomplete' END,
      NULLIF(todo->>'completedAt', ''),
      COALESCE(NULLIF(todo->>'createdAt', ''), NOW()::text),
      NULLIF(todo->>'updatedAt', ''),
      NULLIF(todo->>'projectId', ''),
      CASE WHEN todo->>'estimatedMinutes' ~ '^[0-9]+$' THEN (todo->>'estimatedMinutes')::int ELSE NULL END,
      NULLIF(todo->>'energyLevel', ''),
      CASE WHEN todo->>'canTopolinoHelp' IN ('true', 'false') THEN (todo->>'canTopolinoHelp')::boolean ELSE false END,
      NULLIF(todo->>'notes', ''),
      todo
    FROM habit_users users
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(users.data->'todos', '[]'::jsonb)) AS todo
    WHERE todo ? 'id'
    ON CONFLICT (user_id, id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      due_date = EXCLUDED.due_date,
      due_time = EXCLUDED.due_time,
      priority = EXCLUDED.priority,
      status = EXCLUDED.status,
      completed_at = EXCLUDED.completed_at,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at,
      project_id = EXCLUDED.project_id,
      estimated_minutes = EXCLUDED.estimated_minutes,
      energy_level = EXCLUDED.energy_level,
      can_topolino_help = EXCLUDED.can_topolino_help,
      notes = EXCLUDED.notes,
      body = EXCLUDED.body
  `

  await sql`
    INSERT INTO habit_completions (user_id, habit_id, date, completed, completed_at, entry_data, body)
    SELECT
      users.id,
      completion->>'habitId',
      (completion->>'date')::date,
      CASE WHEN completion->>'completed' IN ('true', 'false') THEN (completion->>'completed')::boolean ELSE false END,
      NULLIF(completion->>'completedAt', ''),
      CASE WHEN jsonb_typeof(completion->'data') = 'object' THEN completion->'data' ELSE '{}'::jsonb END,
      completion
    FROM habit_users users
    CROSS JOIN LATERAL jsonb_array_elements(COALESCE(users.data->'completions', '[]'::jsonb)) AS completion
    WHERE completion ? 'habitId'
      AND completion->>'date' ~ '^\\d{4}-\\d{2}-\\d{2}$'
    ON CONFLICT (user_id, habit_id, date) DO UPDATE SET
      completed = EXCLUDED.completed,
      completed_at = EXCLUDED.completed_at,
      entry_data = EXCLUDED.entry_data,
      body = EXCLUDED.body
  `
}

/**
 * Run all migrations.
 * Safe to run multiple times.
 */
export async function runAllMigrations(): Promise<void> {
  await addIntegrationTokenColumns()
  await addNostrPubkeyColumn()
  await createNostrChallengesTable()
  await createNostrSessionsTable()
  await backfillOptimizedStorageTables()
}
