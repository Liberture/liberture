"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Loader2, Send, Sparkles, Square } from "lucide-react"

import { ProtocolReader } from "@/components/habits/marketplace/protocol-reader"
import { CoachAdmin } from "@/components/habits/coach/coach-admin"
import { RecommendationCards } from "@/components/habits/coach/recommendation-cards"
import { parseAgentReply, toStoredEntries, type CustomHabitSpec, type Recommendation } from "@/lib/habits/agent/recommendation"
import { adoptedProtocolSlugs, adoptedSlugs } from "@/lib/habits/protocols/adopt"
import { CATALOG_PROTOCOLS, type CatalogHabit, type CatalogProtocol } from "@/lib/habits/protocols/catalog"
import type { CoachRecommendationSet, Habit } from "@/lib/habits/types"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"

interface CoachPanelProps {
  apiKey: string
  habits: Habit[]
  onAdoptProtocol: (protocol: CatalogProtocol) => void
  onAdoptHabit: (habit: CatalogHabit) => void
  onAdoptCustom: (spec: CustomHabitSpec) => void
  /** Persists the reply so GET /api/v1/coach/recommendations can serve it. */
  onRecommendations: (set: CoachRecommendationSet) => void
}

interface Message {
  createdAt: number
  updatedAt: number
  id: string
  role: "you" | "coach"
  text: string
  recommendations: Recommendation[]
}

const SUGGESTIONS = ["addNext", "slipping", "sleepBetter", "tooMuch"] as const

/**
 * The starter prompts.
 *
 * Kept on screen for the whole conversation, not just the empty state: the
 * questions worth asking a coach do not stop being worth asking once you have
 * asked one, and rediscovering them meant clearing the thread. Once a
 * conversation is under way they collapse from a grid into a single scrollable
 * row so they cost one line rather than half the panel.
 */
function SuggestionCards({
  layout,
  disabled,
  onPick,
}: {
  layout: "grid" | "row"
  disabled: boolean
  onPick: (prompt: string) => void
}) {
  const t = useTranslations().habits.app.coachPanel
  return (
    <div
      className={cn(
        layout === "grid"
          ? "mx-auto grid max-w-lg gap-2 sm:grid-cols-2"
          // Edge-to-edge scroll on a phone; the negative margin lets cards run
          // to the panel edge so it reads as scrollable rather than clipped.
          : "-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
      )}
    >
      {SUGGESTIONS.map((key) => t.suggestions[key]).map((suggestion) => (
        <button
          key={suggestion.title}
          type="button"
          disabled={disabled}
          onClick={() => onPick(suggestion.title)}
          className={cn(
            "group rounded-xl border border-border bg-card/60 p-3 text-left transition-colors",
            "hover:border-primary/40 hover:bg-card disabled:opacity-50",
            layout === "row" && "w-52 shrink-0 snap-start"
          )}
        >
          <span className="block text-sm font-medium text-foreground">{suggestion.title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{suggestion.hint}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * Chat with a coach that can see your habits and the marketplace.
 *
 * Read-only by construction: the agent behind this can look at a digest of the
 * user's data and the catalog, and nothing else. Everything it suggests arrives
 * as a card the user has to click, so the only thing that ever writes is the
 * marketplace adoption path this panel calls into.
 */
export function CoachPanel({
  apiKey,
  habits,
  onAdoptProtocol,
  onAdoptHabit,
  onAdoptCustom,
  onRecommendations,
}: CoachPanelProps) {
  const t = useTranslations().habits.app.coachPanel
  const [historyReady, setHistoryReady] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [canManageConnection, setCanManageConnection] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null)
  /** False when codex is running without an enforced sandbox — see below. */
  const [sandboxOk, setSandboxOk] = useState(true)
  const [readingSlug, setReadingSlug] = useState<string | null>(null)

  const conversationRef = useRef<string | null>(null)
  const runRef = useRef<string | null>(null)
  const sourceRef = useRef<EventSource | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  /**
   * The reply being assembled. Codex emits an interim "here is what I am about
   * to do" message before the real answer, so the last one wins and we only
   * persist once the turn actually finishes.
   */
  const pendingRef = useRef<{ question: string; recommendations: Recommendation[] } | null>(null)

  const authQuery = apiKey ? `?apiKey=${encodeURIComponent(apiKey)}` : ""
  // Nostr users authenticate with the session cookie and send no header, the
  // same split the rest of the app uses.
  const authHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {}
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`
    return headers
  }, [apiKey])

  useEffect(() => {
    let cancelled = false
    fetch("/api/agent/history", { headers: authHeaders, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(t.errorLoadHistory)
        return res.json()
      })
      .then((history: { conversationId: string | null; messages: Message[] }) => {
        if (cancelled) return
        conversationRef.current = history.conversationId
        setMessages(history.messages.map((message) => ({
          ...message,
          recommendations: parseAgentReply(JSON.stringify({ answer: message.text, recommendations: message.recommendations })).recommendations,
        })))
        setHistoryReady(true)
      })
      .catch((err: Error) => { if (!cancelled) setHistoryError(err.message) })
    return () => { cancelled = true }
  }, [authHeaders])

  const saveHistory = useCallback(async (entries: Message[], conversationId: string | null) => {
    const res = await fetch("/api/agent/history", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ conversationId, messages: entries }),
    })
    if (!res.ok) throw new Error(t.errorSaveHistory)
    setHistoryError(null)
  }, [authHeaders])

  useEffect(() => {
    if (!historyReady || messages.length === 0) return
    const save = () => { void saveHistory(messages, conversationRef.current).catch((err: Error) => setHistoryError(err.message)) }
    const timer = window.setTimeout(save, 300)
    const retry = window.setInterval(save, 30_000)
    return () => { window.clearTimeout(timer); window.clearInterval(retry); save() }
  }, [messages, historyReady, saveHistory])

  const habitSlugs = useMemo(() => adoptedSlugs(habits), [habits])
  const protocolSlugs = useMemo(() => adoptedProtocolSlugs(habits, CATALOG_PROTOCOLS), [habits])
  const reading = readingSlug ? CATALOG_PROTOCOLS.find((p) => p.slug === readingSlug) ?? null : null

  // Refresh when returning from ChatGPT sign-in, and while waiting for login.
  useEffect(() => {
    let cancelled = false
    const check = () => fetch("/api/agent/status", { headers: authHeaders, cache: "no-store" })
      .then((res) => res.json())
      .then((body: { available?: boolean; reason?: string; sandboxOk?: boolean; canManageConnection?: boolean }) => {
        if (cancelled) return
        setAvailable(Boolean(body.available))
        setCanManageConnection(Boolean(body.canManageConnection))
        setUnavailableReason(body.reason ?? null)
        setSandboxOk(body.sandboxOk !== false)
      })
      .catch(() => {
        if (!cancelled) setAvailable(false)
      })
    void check()
    window.addEventListener("focus", check)
    const timer = window.setInterval(check, 15_000)
    return () => {
      cancelled = true
      window.removeEventListener("focus", check)
      window.clearInterval(timer)
    }
  }, [authHeaders])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, status])

  // A panel that unmounts mid-run should not leave the stream open.
  useEffect(() => () => sourceRef.current?.close(), [])

  const finish = useCallback(() => {
    sourceRef.current?.close()
    sourceRef.current = null
    runRef.current = null
    setRunning(false)
    setStatus(null)
  }, [])

  const watch = useCallback(
    (runId: string) => {
      const source = new EventSource(`/api/agent/chat/${runId}/stream${authQuery}`)
      sourceRef.current = source

      source.onmessage = (event) => {
        let payload: Record<string, unknown>
        try {
          payload = JSON.parse(event.data)
        } catch {
          return
        }

        const type = payload.type as string
        const item = payload.item as { type?: string; text?: string; command?: string } | undefined

        if (type === "item.completed" && item?.type === "agent_message" && item.text) {
          const reply = parseAgentReply(item.text)
          if (pendingRef.current) pendingRef.current.recommendations = reply.recommendations
          // Codex emits a short "here is what I am about to do" message before
          // the real answer. Both match the schema, so rather than guess which
          // is final we let each one replace the last — the closing message
          // wins and the user sees progress in the meantime.
          setMessages((current) => {
            const next = [...current]
            const last = next[next.length - 1]
            if (last?.role === "coach") {
              next[next.length - 1] = { ...last, text: reply.answer, recommendations: reply.recommendations, updatedAt: Date.now() }
              return next
            }
            return [...next, { id: `${runId}-reply`, role: "coach", text: reply.answer, recommendations: reply.recommendations, createdAt: Date.now(), updatedAt: Date.now() }]
          })
          return
        }

        if (type === "item.started" && item?.type === "command_execution") {
          setStatus(t.statusReading)
          return
        }
        if (type === "item.started" && item?.type === "reasoning") {
          setStatus(t.statusThinking)
          return
        }
        // The sidecar's reading of why a run failed. It follows the raw codex
        // events, so it replaces their generic message with the real reason.
        if (type === "coach.error" && typeof payload.message === "string") {
          setError(payload.message)
          return
        }
        if (type === "turn.failed" || type === "error") {
          setError(t.errorTurnFailed)
          return
        }
        if (type === "finished") {
          if (payload.status !== "done") {
            setError((current) => current ?? t.errorStopped)
          } else if (pendingRef.current) {
            // Store even when the list is empty: "the coach ran and suggested
            // nothing" is a real answer, and the API distinguishes it from
            // "the coach has never run".
            onRecommendations({
              generatedAt: new Date().toISOString(),
              question: pendingRef.current.question,
              entries: toStoredEntries(pendingRef.current.recommendations),
            })
          }
          pendingRef.current = null
          finish()
        }
      }

      source.onerror = () => {
        setError((current) => current ?? t.errorLostConnection)
        finish()
      }
    },
    [authQuery, finish, onRecommendations]
  )

  const send = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim()
      if (!trimmed || running || !historyReady || !available) return

      setError(null)
      setDraft("")
      setRunning(true)
      pendingRef.current = { question: trimmed, recommendations: [] }
      setStatus(t.statusThinking)
      const question: Message = { id: `you-${crypto.randomUUID()}`, role: "you", text: trimmed, recommendations: [], createdAt: Date.now(), updatedAt: Date.now() }
      setMessages((current) => [...current, question])

      try {
        await saveHistory([question], conversationRef.current)
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({ prompt: trimmed, conversationId: conversationRef.current }),
        })
        const body = (await res.json()) as { runId?: string; conversationId?: string; error?: string }
        if (!res.ok || !body.runId) {
          setError(body.error ?? t.errorUnreachable)
          setRunning(false)
          setStatus(null)
          return
        }
        conversationRef.current = body.conversationId ?? null
        setMessages((current) => [...current])
        runRef.current = body.runId
        watch(body.runId)
      } catch {
        setError(t.errorUnreachable)
        setRunning(false)
        setStatus(null)
      }
    },
    [authHeaders, running, watch, historyReady, available, saveHistory]
  )

  const stop = useCallback(() => {
    const runId = runRef.current
    if (!runId) return
    void fetch(`/api/agent/chat/${runId}/kill`, { method: "POST", headers: authHeaders }).catch(() => {})
    finish()
  }, [authHeaders, finish])

  return (
    <div className="flex h-full flex-col">
      {available === false && (
        canManageConnection ? <CoachAdmin apiKey={apiKey} embedded /> : (
          <div className="mb-4 rounded-lg border p-4 text-sm">
            <p>{unavailableReason ?? t.notConnected}</p>
            <Link href="/admin/coach" className="font-medium text-purple-700 underline dark:text-purple-300">{t.connectionSettings}</Link>
          </div>
        )
      )}
      {historyError && <p role="alert" className="mb-3 text-sm text-red-600">{historyError}</p>}
      {!historyReady && !historyError && <p className="text-sm text-muted-foreground">{t.loadingHistory}</p>}
      {/*
        Without a working sandbox the agent's file reads fail intermittently and
        it answers with something vague about an "environment error", which
        looks like a bug in the coach rather than a misconfigured host. Say what
        it actually is. The sidecar refuses to start in this state unless
        someone passed HABIT_AGENT_ALLOW_UNSANDBOXED=1, so seeing this means
        that override is on.
      */}
      {!sandboxOk ? (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{t.sandboxTitle}</span>{" "}
            {t.sandboxBody}{" "}
            <code className="rounded bg-black/10 px-1 py-0.5 dark:bg-white/10">
              kernel.apparmor_restrict_unprivileged_userns=0
            </code>{" "}
            {t.sandboxRestart} <code className="rounded bg-black/10 px-1 py-0.5 dark:bg-white/10">habit-agent</code>.
          </span>
        </div>
      ) : null}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="space-y-4 py-8">
            <div className="space-y-2 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary" aria-hidden />
              <h2 className="text-lg font-semibold text-foreground">{t.emptyTitle}</h2>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                {t.emptyBody}
              </p>
            </div>
            <SuggestionCards layout="grid" disabled={running || !available || !historyReady} onPick={(s) => void send(s)} />
          </div>
        ) : null}

        {messages.map((message) => (
          <div key={message.id} className={cn(message.role === "you" && "flex justify-end")}>
            {message.role === "you" ? (
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                {message.text}
              </p>
            ) : (
              <div className="max-w-full">
                <Prose text={message.text} />
                <RecommendationCards
                  recommendations={message.recommendations}
                  adoptedHabitSlugs={habitSlugs}
                  adoptedProtocolSlugs={protocolSlugs}
                  onAdoptProtocol={onAdoptProtocol}
                  onAdoptHabit={onAdoptHabit}
                  onAdoptCustom={onAdoptCustom}
                  onReadProtocol={(protocol) => setReadingSlug(protocol.slug)}
                />
              </div>
            )}
          </div>
        ))}

        {status ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            {status}
          </p>
        ) : null}

        {error ? (
          <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>

      {/* Only once the thread has started — before that the grid above is showing. */}
      {messages.length > 0 ? (
        <div className="border-t border-border pt-3">
          <SuggestionCards layout="row" disabled={running || !available || !historyReady} onPick={(s) => void send(s)} />
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void send(draft)
        }}
        className={cn(
          "flex items-end gap-2 pt-3",
          // The suggestion row above already draws the divider.
          messages.length === 0 && "border-t border-border"
        )}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter breaks the line — the convention
            // everywhere else people type into a chat.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              void send(draft)
            }
          }}
          rows={1}
          disabled={running || !available || !historyReady}
          placeholder={available === null ? t.placeholderChecking : t.placeholder}
          className="max-h-32 min-h-[2.75rem] flex-1 resize-y rounded-xl border border-border bg-card/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none disabled:opacity-60"
        />
        {running ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Square className="h-4 w-4" aria-hidden />
            {t.stop}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim() || !available || !historyReady}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" aria-hidden />
            {t.ask}
          </button>
        )}
      </form>

      {reading ? (
        <ProtocolReader
          protocol={reading}
          adopted={protocolSlugs.has(reading.slug)}
          onAdopt={() => {
            onAdoptProtocol(reading)
            setReadingSlug(null)
          }}
          onClose={() => setReadingSlug(null)}
        />
      ) : null}
    </div>
  )
}

/**
 * Just enough markdown for the coach's replies — paragraphs, bullets and bold.
 * The alternative was a markdown dependency and a sanitiser for the sake of
 * a few short answers.
 */
function Prose({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/)

  return (
    <div className="space-y-2 text-sm leading-relaxed text-foreground">
      {blocks.map((block, index) => {
        const lines = block.split("\n")
        const isList = lines.every((line) => /^\s*[-*]\s+/.test(line))
        if (isList) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {lines.map((line, i) => (
                <li key={i}>{bold(line.replace(/^\s*[-*]\s+/, ""))}</li>
              ))}
            </ul>
          )
        }
        return <p key={index}>{bold(block)}</p>
      })}
    </div>
  )
}

function bold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  )
}
