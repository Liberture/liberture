"use client"

import { useCallback, useEffect, useState } from "react"

export interface AssistantConnection {
  id: string
  name: string
}

/**
 * The assistants connected to this account (GET /api/v1/connections, owner
 * auth: the ht_ key as Bearer, or the Nostr session as ?token=). `null` while
 * loading or when the request fails, so callers can tell "none" from "unknown".
 * With `poll`, it rechecks every 4 s and when the window regains focus — for
 * the connect step, where approving happens in another tab.
 */
export function useAssistantConnections(apiKey: string, isNostrAuth: boolean, poll = false): AssistantConnection[] | null {
  const [connections, setConnections] = useState<AssistantConnection[] | null>(null)

  const check = useCallback(async () => {
    try {
      const session = isNostrAuth ? localStorage.getItem("habit-tracker-nostr-session") : null
      const url = session ? `/api/v1/connections?token=${encodeURIComponent(session)}` : "/api/v1/connections"
      const res = await fetch(url, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined, credentials: "same-origin" })
      if (!res.ok) return
      const data = (await res.json()) as { connections?: AssistantConnection[] }
      setConnections((data.connections ?? []).map(({ id, name }) => ({ id, name })))
    } catch {
      // Offline or signed out: stay unknown.
    }
  }, [apiKey, isNostrAuth])

  useEffect(() => {
    check()
    if (!poll) return
    const timer = window.setInterval(check, 4000)
    window.addEventListener("focus", check)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("focus", check)
    }
  }, [check, poll])

  return connections
}

/** Which assistant a connection is, from the name its client registered ("ChatGPT", "claude.ai"…). */
export function assistantKind(name: string): "chatgpt" | "claude" | null {
  const n = name.toLowerCase()
  if (n.includes("chatgpt") || n.includes("openai")) return "chatgpt"
  if (n.includes("claude") || n.includes("anthropic")) return "claude"
  return null
}
