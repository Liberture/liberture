import { verifiedTrackerUserId } from "@/lib/habits/app-auth"
import { getDb } from "@/lib/habits/db"
import { body, fail, json, memberSchema, serve } from "@/lib/challenges/server"

export function POST(request: Request) {
  return serve(request, async () => {
    const user = await verifiedTrackerUserId(request)
    if (!user) fail("unauthorized", 401)
    const payload = await body(request)
    const member = memberSchema.parse(payload)
    const db = getDb()
    const [owner] = await db`SELECT nostr_pubkey FROM habit_users WHERE id=${user}`
    if (!owner?.nostr_pubkey) fail("nostrRequired", 403)
    if (payload.identity !== undefined && payload.identity !== owner.nostr_pubkey) fail("wrongAccount", 403)
    const rows = await db`INSERT INTO tracker_challenge_moderators(user_id,pubkey,name)
      VALUES (${user},${member.pubkey},${member.name}) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name
      WHERE tracker_challenge_moderators.pubkey=excluded.pubkey RETURNING user_id`
    if (!rows.length) fail("existingModeratorKey", 409)
    return json({ registered: true })
  })
}
