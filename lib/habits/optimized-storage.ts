import { createOptimizedStorageTables } from "@/lib/habits/db-migrate"
import { getDb } from "@/lib/habits/db"
import type { HabitCompletion, Project, StorageData, Todo } from "@/lib/habits/types"

type Sql = ReturnType<typeof getDb>
type OptimizedSection = "projects" | "todos" | "completions"

let tablesReady = false

export async function ensureOptimizedStorageTables(): Promise<void> {
  if (tablesReady) return
  await createOptimizedStorageTables()
  tablesReady = true
}

function dateOnly(value?: string): string | null {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function todoPriority(priority: Todo["priority"] | number | undefined): Todo["priority"] {
  return Math.min(5, Math.max(1, Math.floor(priority ?? 3))) as Todo["priority"]
}

function todoStatus(status: Todo["status"] | string | undefined): Todo["status"] {
  return status === "in_progress" || status === "completed" ? status : "incomplete"
}

export async function syncOptimizedStorageTables(
  sql: Sql,
  userId: number,
  data: Pick<StorageData, "projects" | "todos" | "completions">,
): Promise<void> {
  await ensureOptimizedStorageTables()

  const projectsJson = JSON.stringify(data.projects ?? [])
  const todosJson = JSON.stringify(data.todos ?? [])
  const completionsJson = JSON.stringify(data.completions ?? [])

  await sql`DELETE FROM habit_projects WHERE user_id = ${userId}`
  await sql`
    INSERT INTO habit_projects (user_id, id, name, color, created_at, body)
    SELECT
      ${userId},
      project->>'id',
      COALESCE(NULLIF(project->>'name', ''), 'Untitled'),
      NULLIF(project->>'color', ''),
      COALESCE(NULLIF(project->>'createdAt', ''), NOW()::text),
      project
    FROM jsonb_array_elements(${projectsJson}::jsonb) AS project
    WHERE project ? 'id'
  `

  await sql`DELETE FROM habit_todos WHERE user_id = ${userId}`
  await sql`
    INSERT INTO habit_todos (
      user_id, id, title, description, due_date, due_time, priority, status,
      completed_at, created_at, updated_at, project_id, estimated_minutes,
      energy_level, can_topolino_help, notes, body
    )
    SELECT
      ${userId},
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
    FROM jsonb_array_elements(${todosJson}::jsonb) AS todo
    WHERE todo ? 'id'
  `

  await sql`DELETE FROM habit_completions WHERE user_id = ${userId}`
  await sql`
    INSERT INTO habit_completions (user_id, habit_id, date, completed, completed_at, entry_data, body)
    SELECT
      ${userId},
      completion->>'habitId',
      (completion->>'date')::date,
      CASE WHEN completion->>'completed' IN ('true', 'false') THEN (completion->>'completed')::boolean ELSE false END,
      NULLIF(completion->>'completedAt', ''),
      CASE WHEN jsonb_typeof(completion->'data') = 'object' THEN completion->'data' ELSE '{}'::jsonb END,
      completion
    FROM jsonb_array_elements(${completionsJson}::jsonb) AS completion
    WHERE completion ? 'habitId'
      AND completion->>'date' ~ '^\\d{4}-\\d{2}-\\d{2}$'
  `
}

export async function syncOptimizedStorageTablesIfEmpty(
  sql: Sql,
  userId: number,
  data: Pick<StorageData, "projects" | "todos" | "completions">,
): Promise<void> {
  await ensureOptimizedStorageTables()
  const hasRows = await sql`
    SELECT EXISTS (SELECT 1 FROM habit_projects WHERE user_id = ${userId})
      OR EXISTS (SELECT 1 FROM habit_todos WHERE user_id = ${userId})
      OR EXISTS (SELECT 1 FROM habit_completions WHERE user_id = ${userId}) AS has_rows
  `
  if (!hasRows[0]?.has_rows && ((data.projects?.length ?? 0) || (data.todos?.length ?? 0) || (data.completions?.length ?? 0))) {
    await syncOptimizedStorageTables(sql, userId, data)
  }
}

export async function refreshStorageJsonFromOptimizedTables(
  sql: Sql,
  userId: number,
  sections: OptimizedSection[],
  lastUpdated = new Date().toISOString(),
): Promise<void> {
  await ensureOptimizedStorageTables()

  for (const section of sections) {
    if (section === "projects") {
      await sql`
        UPDATE habit_users
        SET data = jsonb_set(
              jsonb_set(COALESCE(data, '{}'::jsonb), '{projects}', COALESCE((
                SELECT jsonb_agg(body ORDER BY created_at, name)
                FROM habit_projects
                WHERE user_id = ${userId}
              ), '[]'::jsonb), true),
              '{lastUpdated}', to_jsonb(${lastUpdated}::text), true
            ),
            updated_at = NOW()
        WHERE id = ${userId}
      `
    } else if (section === "todos") {
      await sql`
        UPDATE habit_users
        SET data = jsonb_set(
              jsonb_set(COALESCE(data, '{}'::jsonb), '{todos}', COALESCE((
                SELECT jsonb_agg(body ORDER BY created_at DESC, id)
                FROM habit_todos
                WHERE user_id = ${userId}
              ), '[]'::jsonb), true),
              '{lastUpdated}', to_jsonb(${lastUpdated}::text), true
            ),
            updated_at = NOW()
        WHERE id = ${userId}
      `
    } else {
      await sql`
        UPDATE habit_users
        SET data = jsonb_set(
              jsonb_set(COALESCE(data, '{}'::jsonb), '{completions}', COALESCE((
                SELECT jsonb_agg(body ORDER BY date DESC, completed_at DESC NULLS LAST, habit_id)
                FROM habit_completions
                WHERE user_id = ${userId}
              ), '[]'::jsonb), true),
              '{lastUpdated}', to_jsonb(${lastUpdated}::text), true
            ),
            updated_at = NOW()
        WHERE id = ${userId}
      `
    }
  }
}

export async function upsertProjectRow(sql: Sql, userId: number, project: Project): Promise<void> {
  await ensureOptimizedStorageTables()
  await sql`
    INSERT INTO habit_projects (user_id, id, name, color, created_at, body)
    VALUES (${userId}, ${project.id}, ${project.name}, ${project.color ?? null}, ${project.createdAt}, ${JSON.stringify(project)}::jsonb)
    ON CONFLICT (user_id, id) DO UPDATE SET
      name = EXCLUDED.name,
      color = EXCLUDED.color,
      created_at = EXCLUDED.created_at,
      body = EXCLUDED.body
  `
}

export async function getProjectRows(sql: Sql, userId: number): Promise<Project[]> {
  await ensureOptimizedStorageTables()
  const rows = await sql`
    SELECT body FROM habit_projects WHERE user_id = ${userId} ORDER BY created_at, name
  `
  return rows.map((row) => row.body as Project)
}

export async function getProjectRow(sql: Sql, userId: number, projectId: string): Promise<Project | null> {
  await ensureOptimizedStorageTables()
  const rows = await sql`SELECT body FROM habit_projects WHERE user_id = ${userId} AND id = ${projectId}`
  return rows[0]?.body as Project ?? null
}

export async function deleteProjectRow(sql: Sql, userId: number, projectId: string): Promise<void> {
  await ensureOptimizedStorageTables()
  await sql`DELETE FROM habit_projects WHERE user_id = ${userId} AND id = ${projectId}`
}

export async function upsertTodoRow(sql: Sql, userId: number, todo: Todo): Promise<void> {
  await ensureOptimizedStorageTables()
  await sql`
    INSERT INTO habit_todos (
      user_id, id, title, description, due_date, due_time, priority, status,
      completed_at, created_at, updated_at, project_id, estimated_minutes,
      energy_level, can_topolino_help, notes, body
    ) VALUES (
      ${userId}, ${todo.id}, ${todo.title}, ${todo.description ?? null}, ${dateOnly(todo.dueDate)}, ${todo.dueTime ?? null},
      ${todoPriority(todo.priority)}, ${todoStatus(todo.status)}, ${todo.completedAt ?? null}, ${todo.createdAt}, ${todo.updatedAt ?? null},
      ${todo.projectId ?? null}, ${todo.estimatedMinutes ?? null}, ${todo.energyLevel ?? null}, ${todo.canTopolinoHelp ?? false},
      ${todo.notes ?? null}, ${JSON.stringify(todo)}::jsonb
    )
    ON CONFLICT (user_id, id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      due_date = EXCLUDED.due_date,
      due_time = EXCLUDED.due_time,
      priority = EXCLUDED.priority,
      status = EXCLUDED.status,
      completed_at = EXCLUDED.completed_at,
      updated_at = EXCLUDED.updated_at,
      project_id = EXCLUDED.project_id,
      estimated_minutes = EXCLUDED.estimated_minutes,
      energy_level = EXCLUDED.energy_level,
      can_topolino_help = EXCLUDED.can_topolino_help,
      notes = EXCLUDED.notes,
      body = EXCLUDED.body
  `
}

export async function deleteTodoRow(sql: Sql, userId: number, todoId: string): Promise<void> {
  await ensureOptimizedStorageTables()
  await sql`DELETE FROM habit_todos WHERE user_id = ${userId} AND id = ${todoId}`
}

export async function getTodoRow(sql: Sql, userId: number, todoId: string): Promise<Todo | null> {
  await ensureOptimizedStorageTables()
  const rows = await sql`SELECT body FROM habit_todos WHERE user_id = ${userId} AND id = ${todoId}`
  return rows[0]?.body as Todo ?? null
}

export async function getCompletionRows(sql: Sql, userId: number, sinceDate?: string): Promise<HabitCompletion[]> {
  await ensureOptimizedStorageTables()
  const rows = sinceDate
    ? await sql`
        SELECT body FROM habit_completions
        WHERE user_id = ${userId} AND completed = true AND date >= ${sinceDate}::date
        ORDER BY date DESC, completed_at DESC NULLS LAST, habit_id
      `
    : await sql`
        SELECT body FROM habit_completions
        WHERE user_id = ${userId}
        ORDER BY date DESC, completed_at DESC NULLS LAST, habit_id
      `
  return rows.map((row) => row.body as HabitCompletion)
}

export async function getCompletionRow(
  sql: Sql,
  userId: number,
  habitId: string,
  completionDate: string,
): Promise<HabitCompletion | null> {
  await ensureOptimizedStorageTables()
  const rows = await sql`
    SELECT body FROM habit_completions
    WHERE user_id = ${userId} AND habit_id = ${habitId} AND date = ${completionDate}::date
  `
  return rows[0]?.body as HabitCompletion ?? null
}

export async function upsertCompletionRow(sql: Sql, userId: number, completion: HabitCompletion): Promise<void> {
  await ensureOptimizedStorageTables()
  const completionDate = dateOnly(completion.date)
  if (!completionDate) return

  await sql`
    INSERT INTO habit_completions (user_id, habit_id, date, completed, completed_at, entry_data, body)
    VALUES (
      ${userId}, ${completion.habitId}, ${completionDate}::date, ${completion.completed},
      ${completion.completedAt ?? null}, ${JSON.stringify(completion.data ?? {})}::jsonb, ${JSON.stringify(completion)}::jsonb
    )
    ON CONFLICT (user_id, habit_id, date) DO UPDATE SET
      completed = EXCLUDED.completed,
      completed_at = EXCLUDED.completed_at,
      entry_data = EXCLUDED.entry_data,
      body = EXCLUDED.body
  `
}

export async function deleteCompletionRow(sql: Sql, userId: number, habitId: string, completionDate: string): Promise<void> {
  await ensureOptimizedStorageTables()
  await sql`
    DELETE FROM habit_completions
    WHERE user_id = ${userId} AND habit_id = ${habitId} AND date = ${completionDate}::date
  `
}
