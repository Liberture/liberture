import { getDb } from "@/lib/habits/db"
import type { CoachRecommendationSet } from "@/lib/habits/types"

/**
 * Read-modify-write of data.coachRecommendations, guarded by lastUpdated like
 * mutateProfile (lib/habits/api/profile.ts): on a race with a tab's save the
 * row is re-read and the change re-applied. `change` returns the next set, or
 * `{ error }` to abort without writing.
 */
export async function mutateCoachRecommendations<E>(
  userId: number,
  change: (current: CoachRecommendationSet | undefined) => CoachRecommendationSet | { error: E }
): Promise<CoachRecommendationSet | { error: E } | null> {
  const sql = getDb()
  for (let attempt = 0; attempt < 4; attempt++) {
    const rows = await sql`
      SELECT data->'coachRecommendations' AS recs, data->>'lastUpdated' AS last
      FROM habit_users WHERE id = ${userId}`
    if (!rows.length) return null
    const next = change((rows[0].recs as CoachRecommendationSet | null) ?? undefined)
    if ("error" in next) return next
    const now = new Date().toISOString()
    const last = (rows[0].last as string | null) ?? ""
    const updated = await sql`
      UPDATE habit_users
      SET data = jsonb_set(
        jsonb_set(data, '{coachRecommendations}', ${JSON.stringify(next)}::jsonb, true),
        '{lastUpdated}', to_jsonb(${now}::text)
      ),
      updated_at = NOW()
      WHERE id = ${userId} AND COALESCE(data->>'lastUpdated', '') = ${last}
      RETURNING id`
    if (updated.length) return next
  }
  throw new Error("Suggestions kept changing; try again")
}
