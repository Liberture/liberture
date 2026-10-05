import { NextResponse } from "next/server"

import { buildBrief } from "@/lib/habits/agent/brief"
import { buildCatalogExport } from "@/lib/habits/agent/catalog-export"
import { SidecarError, sidecarConfigured, startRun } from "@/lib/habits/agent/sidecar"
import { getAuthFromRequest, userKeyFor, type AuthInfo } from "@/lib/habits/app-auth"
import { getDb } from "@/lib/habits/db"
import { getLocalUser, isLocalStorageMode } from "@/lib/habits/local-storage"
import type { StorageData } from "@/lib/habits/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_PROMPT = 4000

async function loadUserData(auth: AuthInfo): Promise<StorageData | null> {
  if (isLocalStorageMode()) {
    if (auth.type === "nostr") return null
    return (await getLocalUser(auth.apiKey!)) ?? null
  }

  const sql = getDb()
  let result
  if (auth.type === "nostr" && auth.pubkey) {
    result = await sql`SELECT data FROM habit_users WHERE nostr_pubkey = ${auth.pubkey.toLowerCase()}`
  } else if (auth.apiKey) {
    result = await sql`SELECT data FROM habit_users WHERE api_key = ${auth.apiKey}`
  } else {
    return null
  }

  return result.length > 0 ? ((result[0].data as StorageData) ?? null) : null
}

/**
 * Ask the coach a question.
 *
 * Reads the user's data, digests it, and hands the digest to the sidecar, which
 * runs codex against it. Nothing here writes: the agent can only recommend, and
 * the user adds what they want through the normal marketplace path.
 */
export async function POST(request: Request) {
  if (!sidecarConfigured()) {
    return NextResponse.json({ error: "The coach is not enabled on this instance." }, { status: 503 })
  }

  try {
    const auth = await getAuthFromRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Valid API key or Nostr session required." }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as
      | { prompt?: unknown; conversationId?: unknown }
      | null
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : ""
    if (!prompt) {
      return NextResponse.json({ error: "Ask a question first." }, { status: 400 })
    }
    if (prompt.length > MAX_PROMPT) {
      return NextResponse.json({ error: `Keep it under ${MAX_PROMPT} characters.` }, { status: 400 })
    }
    const conversationId =
      typeof body?.conversationId === "string" && /^[0-9a-f]{32}$/.test(body.conversationId)
        ? body.conversationId
        : undefined

    const data = await loadUserData(auth)
    if (!data) {
      return NextResponse.json({ error: "No data found for this account." }, { status: 404 })
    }

    const brief = buildBrief(data)

    const result = await startRun(
      {
        userKey: userKeyFor(auth),
        conversationId,
        prompt,
        // Cheap: the same hash the exporter computes, so the sidecar can tell
        // whether the copy it already has is current.
        catalogVersion: buildCatalogExport(brief.adoptedHabitSlugs, brief.adoptedProtocolSlugs).version,
        brief: { habitsMarkdown: brief.habitsMarkdown, completionsCsv: brief.completionsCsv },
      },
      // Only built when the sidecar says it needs one.
      () => {
        const exported = buildCatalogExport(brief.adoptedHabitSlugs, brief.adoptedProtocolSlugs)
        return { indexMarkdown: exported.indexMarkdown, protocols: exported.protocols }
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof SidecarError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("[agent/chat] failed to start a run:", error)
    return NextResponse.json({ error: "Could not reach the coach." }, { status: 500 })
  }
}
