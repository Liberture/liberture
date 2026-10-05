"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, Loader2, Minus, Zap } from "lucide-react"

import { useHabitsSession } from "@/components/habits/session-provider"
import { API_SCOPES, type ApiScope } from "@/lib/habits/api-scopes"
import type { Dictionary } from "@/lib/habits/i18n"

interface ConsentScreenProps {
  params: Record<string, string | null>
  appName: string
  host: string
  t: Dictionary["oauth"]
}

type State =
  | { kind: "checking" }
  | { kind: "signed-out" }
  | { kind: "ready"; name: string | null; permissions: Record<ApiScope, boolean> }
  | { kind: "working" }
  | { kind: "done" }
  | { kind: "error"; message: string }

/** Owner auth the same way Settings does it: ht_ key, or the Nostr session. */
function ownerFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const apiKey = localStorage.getItem("habit-tracker-api-key")
  const session = localStorage.getItem("habit-tracker-nostr-session")
  const headers = new Headers(init.headers)
  if (apiKey && localStorage.getItem("habit-tracker-auth-type") === "api-key") headers.set("Authorization", `Bearer ${apiKey}`)
  const url = session ? `${path}?token=${encodeURIComponent(session)}` : path
  return fetch(url, { ...init, headers, credentials: "same-origin" })
}

const fill = (text: string, app: string, host = "") => text.replaceAll("{app}", app).replaceAll("{host}", host)

export function ConsentScreen({ params, appName, host, t }: ConsentScreenProps) {
  const [state, setState] = useState<State>({ kind: "checking" })

  useEffect(() => {
    ownerFetch("/api/oauth/whoami")
      .then(async (r) => {
        if (!r.ok) return setState({ kind: "signed-out" })
        const d = await r.json()
        setState({ kind: "ready", name: d.name, permissions: d.permissions })
      })
      .catch(() => setState({ kind: "signed-out" }))
  }, [])

  const decide = useCallback(
    async (decision: "approve" | "deny") => {
      setState({ kind: "working" })
      try {
        const r = await ownerFetch("/api/oauth/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...params, decision }),
        })
        const d = await r.json()
        if (d.redirect) {
          if (decision === "approve") setState({ kind: "done" })
          window.location.assign(d.redirect)
        } else {
          setState({ kind: "error", message: d.error ?? "Something went wrong" })
        }
      } catch {
        setState({ kind: "error", message: "Network error" })
      }
    },
    [params]
  )

  const { openSignIn } = useHabitsSession()
  const signIn = () => {
    // The session provider sends us back here (full load) once signed in.
    openSignIn({ next: window.location.pathname + window.location.search })
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-background/70 p-6 backdrop-blur">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
          <Zap className="h-5 w-5 text-primary" aria-hidden />
        </span>
        <span className="text-sm text-muted-foreground">{host}</span>
      </div>

      {state.kind === "checking" || state.kind === "working" ? (
        <p className="flex items-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {state.kind === "working" ? t.working : ""}
        </p>
      ) : state.kind === "done" ? (
        <p className="py-6 text-foreground">{fill(t.done, appName)}</p>
      ) : state.kind === "error" ? (
        <p className="py-6 text-exercise">{state.message}</p>
      ) : state.kind === "signed-out" ? (
        <>
          <h1 className="text-2xl font-bold text-foreground">{fill(t.signInTitle, appName)}</h1>
          <p className="mt-2 text-muted-foreground">{t.signInBody}</p>
          <button
            type="button"
            onClick={signIn}
            className="mt-6 w-full rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.signIn}
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-foreground">{fill(t.title, appName)}</h1>
          <p className="mt-2 text-muted-foreground">{fill(t.lead, appName, host)}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.signedInAs} <span className="font-medium text-foreground">{state.name ?? t.you}</span>
          </p>

          <p className="mt-5 text-sm font-medium text-foreground">{t.willBeAble}</p>
          <ul className="mt-2 space-y-2">
            {API_SCOPES.filter((s) => state.permissions[s]).map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                {t.scopes[s]}
              </li>
            ))}
          </ul>
          {API_SCOPES.some((s) => !state.permissions[s]) && (
            <>
              <p className="mt-4 text-sm text-muted-foreground">{t.offNote}</p>
              <ul className="mt-2 space-y-2">
                {API_SCOPES.filter((s) => !state.permissions[s]).map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Minus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {t.scopes[s]}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-5 text-xs text-muted-foreground">{t.durable}</p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => decide("deny")}
              className="flex-1 rounded-lg border border-white/15 px-5 py-3 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => decide("approve")}
              className="flex-1 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t.approve}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
