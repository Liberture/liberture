import { calculateStreak, isHabitDueOnDate, weeklyProgress } from "@/lib/habits/habit-utils"
import { parseDateOnly } from "@/lib/habits/date-utils"
import { CATALOG_PROTOCOLS, STANDALONE_HABITS } from "@/lib/habits/protocols/catalog"
import { CATALOG_PROTOCOLS as PUBLIC_PROTOCOLS } from "@/lib/tracker/catalog"
import type { StorageData } from "@/lib/habits/types"
import { TOOL_COUNT, TOOLS_VERSION } from "@/lib/habits/api/operations"

/**
 * Helpers shared by the assistant-facing endpoints (/api/v1 and /api/mcp):
 * public origin, catalog links, and the spoken-style summary.
 */

/** The public origin of this deployment, behind the Cloudflare tunnel or not. */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url)
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const proto = forwardedProto || (host.startsWith("localhost") || host.startsWith("127.") ? "http" : url.protocol.replace(":", ""))
  return `${proto}://${host}`
}

/** Protocols with a page at /protocols/<slug> on this site. */
const PUBLIC_PROTOCOL_SLUGS = new Set(PUBLIC_PROTOCOLS.map((p) => p.slug))

/** The protocol a catalog habit belongs to, if any. */
export function protocolSlugForHabit(habitSlug: string): string | undefined {
  return CATALOG_PROTOCOLS.find((p) => p.habits.some((h) => h.slug === habitSlug))?.slug
}

export interface CatalogLinks {
  /** This site's public page for the protocol (or the catalog anchor for a standalone habit). */
  infoUrl: string | null
}

export function catalogLinks(kind: "protocol" | "habit" | "custom", slug: string | null, origin: string): CatalogLinks {
  if (!slug || kind === "custom") return { infoUrl: null }
  const protocolSlug = kind === "protocol" ? slug : protocolSlugForHabit(slug)
  if (!protocolSlug) {
    // Standalone habits have no protocol page; the catalog anchor is the next best thing.
    const standalone = STANDALONE_HABITS.some((h) => h.slug === slug)
    return { infoUrl: standalone ? `${origin}/protocols#${slug}` : null }
  }
  // Liberture's public library only carries part of the catalog; the rest is
  // readable in the tracker's marketplace.
  if (!PUBLIC_PROTOCOL_SLUGS.has(protocolSlug)) return { infoUrl: `${origin}/tracker?view=market` }
  return { infoUrl: `${origin}/protocols/${protocolSlug}` }
}

export interface SummaryContext {
  name: string | null
  /** Permission scopes the user switched off, so the assistant needs no second call to learn them. */
  disabledScopes: string[]
}

export interface TodayHabit {
  id: string
  name: string
  time: string | null
  done: boolean
  currentStreak: number
  /** What currentStreak counts: days, or weeks that met the target for times-per-week habits. */
  streakUnit: "days" | "weeks"
  /** Times-per-week habits only: this week's progress towards the target. */
  week: { done: number; target: number; met: boolean } | null
}

/**
 * Habits due on `today`. A times-per-week habit drops off once that week's
 * target was met on earlier days (rest days aren't misses); one done today
 * stays listed as done.
 */
export function habitsForDay(data: StorageData, today: string): TodayHabit[] {
  const date = parseDateOnly(today)
  const completions = data.completions ?? []
  const weekStartsOn = data.preferences?.weekStartsOn ?? 1
  return (data.habits ?? [])
    .filter((h) => !h.archived && isHabitDueOnDate(h, date, completions, weekStartsOn, date))
    .map((h) => {
      const streak = calculateStreak(h.id, completions, undefined, h, date, weekStartsOn)
      const week = h.schedule?.type === "times_per_week" ? weeklyProgress(h, completions, date, weekStartsOn) : null
      return {
        id: h.id,
        name: h.name,
        time: h.time || null,
        done: completions.some((c) => c.habitId === h.id && c.date === today && c.completed),
        currentStreak: streak.current,
        streakUnit: streak.unit ?? "days",
        week: week ? { done: week.done, target: week.target, met: week.met } : null,
      }
    })
    .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"))
}

/** "3 days", "1 week". */
function streakText(h: TodayHabit): string {
  const n = h.currentStreak
  return `${n} ${h.streakUnit === "weeks" ? (n === 1 ? "week" : "weeks") : n === 1 ? "day" : "days"}`
}

/** " (2/3 this week)" for a times-per-week habit, "" otherwise. */
function weekText(h: TodayHabit): string {
  return h.week ? ` (${h.week.done}/${h.week.target} this week)` : ""
}

/**
 * A short markdown digest an assistant can read aloud without further calls:
 * what's left today, what's done, streaks worth mentioning, open todos.
 * Ids are included so the assistant can act on what it just read.
 */
export function buildSpokenSummary(data: StorageData, today: string, context?: SummaryContext): string {
  const habits = habitsForDay(data, today)
  const left = habits.filter((h) => !h.done)
  const done = habits.filter((h) => h.done)
  const weekday = parseDateOnly(today).toLocaleDateString("en-US", { weekday: "long" })
  const lines: string[] = [`# ${weekday} ${today}`, ""]
  if (context) {
    if (context.name) lines.push(`User: ${context.name}`)
    // Lets the model notice a stale tool list and ask the user to refresh the connector.
    lines.push(`Connector: ${TOOL_COUNT} tools (version ${TOOLS_VERSION})`)
    lines.push(
      context.disabledScopes.length
        ? `Switched off by the user: ${context.disabledScopes.join(", ")}. Don't attempt those.`
        : "All actions allowed."
    )
    lines.push("")
  }

  if (habits.length === 0) {
    lines.push("No habits are due today.")
  } else {
    lines.push(`${done.length} of ${habits.length} done.`, "")
    if (left.length) {
      lines.push("## Still to do")
      for (const h of left) lines.push(`- ${h.name}${h.time ? ` at ${h.time}` : ""}${weekText(h)} (id: ${h.id}, streak ${streakText(h)})`)
      lines.push("")
    }
    if (done.length) {
      lines.push("## Done")
      for (const h of done) lines.push(`- ${h.name}${weekText(h)} (id: ${h.id}, streak ${streakText(h)})`)
      lines.push("")
    }
  }

  // Week streaks are worth mentioning sooner: 2 weeks is 2 targets met.
  const streaks = habits
    .filter((h) => h.currentStreak >= (h.streakUnit === "weeks" ? 2 : 3))
    .sort((a, b) => b.currentStreak - a.currentStreak)
  if (streaks.length) {
    lines.push("## Streaks", ...streaks.slice(0, 5).map((h) => `- ${h.name}: ${streakText(h)}`), "")
  }

  const todos = (data.todos ?? []).filter((t) => t.status !== "completed")
  if (todos.length) {
    const overdue = todos.filter((t) => t.dueDate && t.dueDate < today)
    const dueToday = todos.filter((t) => t.dueDate === today)
    lines.push(`## Todos`, `${todos.length} open${overdue.length ? `, ${overdue.length} overdue` : ""}${dueToday.length ? `, ${dueToday.length} due today` : ""}.`)
    for (const t of [...overdue, ...dueToday].slice(0, 5)) lines.push(`- ${t.title} (id: ${t.id}${t.dueDate ? `, due ${t.dueDate}` : ""})`)
    lines.push("")
  }

  return lines.join("\n").trimEnd() + "\n"
}
