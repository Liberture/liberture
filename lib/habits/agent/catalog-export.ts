import crypto from "node:crypto"

import { CATALOG_PROTOCOLS, STANDALONE_HABITS, scheduleLabel, type CatalogHabit, type CatalogProtocol } from "@/lib/habits/protocols/catalog"
import { COST_TIER_LABEL } from "@/lib/habits/protocols/cost"
import { formatSourceMeta } from "@/lib/habits/protocols/sources"

/**
 * Renders the marketplace as markdown for the coach agent.
 *
 * Markdown rather than JSON, and split into an index plus one file per
 * protocol, because of how little the agent can actually do with a file. Codex
 * confines the model's shell to a sandbox, and when that sandbox is degraded
 * the only thing that still works is reading a file top to bottom — no grep, no
 * jq. So the catalog has to be navigable by reading alone: a small index that
 * lists everything, and detail files opened one at a time by slug.
 *
 * It is also just cheaper. The full catalog is ~200KB of prose; the index is a
 * few KB, and a typical answer opens two or three detail files.
 */

export interface CatalogExport {
  version: string
  indexMarkdown: string
  protocols: { slug: string; markdown: string }[]
}

function habitLine(habit: CatalogHabit, adopted: boolean): string {
  const mark = adopted ? " **[already tracked]**" : ""
  return `- \`${habit.slug}\` — ${habit.name} — ${habit.pillar}, ${habit.time} ${scheduleLabel(habit.schedule).toLowerCase()}, ${habit.difficulty}, ${COST_TIER_LABEL[habit.cost].toLowerCase()} — ${habit.why}${mark}`
}

function protocolLine(protocol: CatalogProtocol, adopted: boolean): string {
  const mark = adopted ? " **[already adopted]**" : ""
  const author = protocol.author?.name ?? protocol.creator
  return `- \`${protocol.slug}\` — ${protocol.name} — ${protocol.pillar}, ${protocol.difficulty}, ${COST_TIER_LABEL[protocol.costTier].toLowerCase()}, ${protocol.habits.length} habit${protocol.habits.length === 1 ? "" : "s"}, by ${author} — ${protocol.tagline}${mark}`
}

/**
 * The index the agent reads first. Everything the catalog offers, one line
 * each, grouped by pillar so "this user has nothing for sleep" is answerable
 * without opening a single detail file.
 */
function buildIndex(adoptedHabits: Set<string>, adoptedProtocols: Set<string>): string {
  const byPillar = new Map<string, { protocols: CatalogProtocol[]; habits: CatalogHabit[] }>()
  const bucket = (pillar: string) => {
    if (!byPillar.has(pillar)) byPillar.set(pillar, { protocols: [], habits: [] })
    return byPillar.get(pillar)!
  }

  for (const protocol of CATALOG_PROTOCOLS) bucket(protocol.pillar).protocols.push(protocol)
  for (const habit of STANDALONE_HABITS) bucket(habit.pillar).habits.push(habit)

  const sections = [...byPillar.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([pillar, { protocols, habits }]) => {
      const parts = [`## ${pillar}`]
      if (protocols.length > 0) {
        parts.push("", "Protocols:", ...protocols.map((p) => protocolLine(p, adoptedProtocols.has(p.slug))))
      }
      const protocolHabits = protocols.flatMap((p) =>
        p.habits.map((h) => `${habitLine(h, adoptedHabits.has(h.slug))} (part of \`${p.slug}\`)`)
      )
      if (protocolHabits.length > 0) {
        parts.push("", "Habits inside those protocols (each can be added on its own):", ...protocolHabits)
      }
      if (habits.length > 0) {
        parts.push("", "Standalone habits:", ...habits.map((h) => habitLine(h, adoptedHabits.has(h.slug))))
      }
      return parts.join("\n")
    })

  return [
    "# Marketplace catalog",
    "",
    "Every protocol and habit available, grouped by pillar. Entries marked",
    "**[already tracked]** or **[already adopted]** are things this user has —",
    "do not recommend those again.",
    "",
    "Use a protocol slug with `kind: \"protocol\"` and a habit slug with",
    "`kind: \"habit\"`. For the full reasoning, evidence and cost behind a",
    "protocol, read `catalog/protocols/<slug>.md`.",
    "",
    ...sections,
  ].join("\n")
}

/** One detail file per protocol, opened only for genuine candidates. */
function buildProtocolDoc(protocol: CatalogProtocol): string {
  const lines: string[] = [
    `# ${protocol.name}`,
    "",
    `slug: \`${protocol.slug}\``,
    `pillar: ${protocol.pillar} · difficulty: ${protocol.difficulty} · cost: ${COST_TIER_LABEL[protocol.costTier].toLowerCase()} · duration: ${protocol.duration}`,
    `by ${protocol.author?.name ?? protocol.creator}${protocol.author?.credentials ? ` (${protocol.author.credentials})` : ""}`,
  ]
  if (protocol.coAuthors.length > 0) {
    lines.push(`with ${protocol.coAuthors.map((a) => a.name).join(", ")}`)
  }

  lines.push("", `> ${protocol.tagline}`, "", "## What it is", protocol.description, "", "## Why it works", protocol.why)

  const section = (title: string, items: string[]) => {
    if (items.length === 0) return
    lines.push("", `## ${title}`, ...items.map((item) => `- ${item}`))
  }
  section("Steps", protocol.steps)
  section("Benefits", protocol.benefits)
  section("Risks", protocol.risks)
  section("Equipment", protocol.equipment)

  if (protocol.cost?.note) lines.push("", "## Cost", protocol.cost.note)

  lines.push(
    "",
    "## Habits it adds",
    ...protocol.habits.map(
      (h) => `- \`${h.slug}\` — ${h.name} at ${h.time}, ${scheduleLabel(h.schedule).toLowerCase()} — ${h.why}`
    )
  )

  if (protocol.evidence.length > 0) {
    lines.push(
      "",
      "## Evidence",
      ...protocol.evidence.map((s) => `- ${s.title} — ${formatSourceMeta(s)}`)
    )
  }

  return lines.join("\n")
}

/**
 * Small LRU over recent exports.
 *
 * Every turn needs the version hash to ask the sidecar whether its copy is
 * current, and computing that means rendering the whole ~200KB catalog. Users
 * adopt habits rarely, so the same input recurs constantly — caching turns a
 * per-message cost into a per-adoption one. Bounded because the key includes
 * the user's adopted slugs and so varies per user.
 */
const CACHE_LIMIT = 32
const cache = new Map<string, CatalogExport>()

function cached(key: string, build: () => CatalogExport): CatalogExport {
  const hit = cache.get(key)
  if (hit) {
    // Refresh recency.
    cache.delete(key)
    cache.set(key, hit)
    return hit
  }
  const built = build()
  cache.set(key, built)
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  return built
}

/**
 * Build the whole export. `adopted*` come from the user's habits so the index
 * can mark what they already have — the agent recommending something already on
 * their list is the most obvious way for this feature to look stupid.
 */
export function buildCatalogExport(adoptedHabits: Set<string>, adoptedProtocols: Set<string>): CatalogExport {
  const key = `${[...adoptedHabits].sort().join(",")}|${[...adoptedProtocols].sort().join(",")}`
  return cached(key, () => buildCatalogExportUncached(adoptedHabits, adoptedProtocols))
}

function buildCatalogExportUncached(adoptedHabits: Set<string>, adoptedProtocols: Set<string>): CatalogExport {
  const indexMarkdown = buildIndex(adoptedHabits, adoptedProtocols)
  const protocols = CATALOG_PROTOCOLS.map((protocol) => ({
    slug: protocol.slug,
    markdown: buildProtocolDoc(protocol),
  }))

  // The version keys the sidecar's per-conversation cache. It has to cover the
  // adopted markers too, otherwise adding a habit mid-conversation would leave
  // the agent reading a stale index that still offers it.
  const version = crypto
    .createHash("sha256")
    .update(indexMarkdown)
    .update(protocols.map((p) => p.markdown).join("\n"))
    .digest("hex")
    .slice(0, 16)

  return { version, indexMarkdown, protocols }
}
