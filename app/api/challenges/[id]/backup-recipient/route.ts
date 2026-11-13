import { access, fail, json, serve } from "@/lib/challenges/server"
import { getAuthFromRequest } from "@/lib/habits/app-auth"
import { getDb } from "@/lib/habits/db"

export function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return serve(request, async () => {
    const auth = await getAuthFromRequest(request)
    if (auth?.type !== "nostr" || !auth.pubkey) fail("nostrRequired", 403)
    const { row, role } = await access(request, (await params).id)
    // A guest cookie can grant access to a room, but cannot link its key to another account.
    const id = row[`${role}_id`]
    if (!id) fail("forbidden", 403)
    const [owner] = await getDb()`SELECT nostr_pubkey FROM habit_users WHERE id=${id}`
    if (owner?.nostr_pubkey !== auth.pubkey) fail("forbidden", 403)
    return json({ recipient: auth.pubkey, key: row.state.members[role]!.pubkey })
  })
}
