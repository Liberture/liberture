import { catalogLinks } from "@/lib/habits/api/assistant"
import { callApi, type Handler } from "@/lib/habits/api/mcp-tools"
import { CATALOG_PROTOCOLS, findProtocol, scheduleLabel } from "@/lib/habits/protocols/catalog"
import { GET as getSummary } from "@/app/api/v1/summary/route"
import { GET as getHabits } from "@/app/api/v1/habits/route"
import { GET as getIcs } from "@/app/api/v1/calendar/ics/route"
import { GET as getExport } from "@/app/api/v1/export/route"

/**
 * MCP resources: read-only views a client can attach as context without a
 * tool call. The user-data ones go through the same /api/v1 handlers as the
 * tools, so the read/export permission switches apply to them too. Catalog
 * protocols are public content, one resource per slug via a URI template.
 */

export interface McpResource {
  uri: string
  name: string
  title: string
  description: string
  mimeType: string
}

interface StaticResource extends McpResource {
  handler: Handler
  path: string
}

const STATIC_RESOURCES: StaticResource[] = [
  {
    uri: "liberture://today",
    name: "today",
    title: "Today",
    description: "Today's habits (done and left), streaks and urgent todos, as markdown. Same as get_today.",
    mimeType: "text/markdown",
    handler: getSummary as Handler,
    path: "/summary",
  },
  {
    uri: "liberture://habits",
    name: "habits",
    title: "Habits",
    description: "Every active habit with schedule, streaks and 7/30-day rates.",
    mimeType: "application/json",
    handler: getHabits as Handler,
    path: "/habits",
  },
  {
    uri: "liberture://calendar.ics",
    name: "calendar.ics",
    title: "Calendar (iCalendar)",
    description: "The user's calendar events from the last 30 days through the next year.",
    mimeType: "text/calendar",
    handler: getIcs as Handler,
    path: "/calendar/ics",
  },
  {
    uri: "liberture://export",
    name: "export",
    title: "Full export",
    description: "Full JSON backup of the user's data. Needs the Export permission.",
    mimeType: "application/json",
    handler: getExport as Handler,
    path: "/export",
  },
]

export const MCP_RESOURCES: McpResource[] = STATIC_RESOURCES.map(({ uri, name, title, description, mimeType }) => ({ uri, name, title, description, mimeType }))

export const PROTOCOL_TEMPLATE = "liberture://protocol/{slug}"
const PROTOCOL_PREFIX = "liberture://protocol/"

export const MCP_RESOURCE_TEMPLATES = [
  {
    uriTemplate: PROTOCOL_TEMPLATE,
    name: "protocol",
    title: "Catalog protocol",
    description: "One protocol from the Liberture catalog: what it is, why, its habits, steps, risks and evidence. Slugs come from search_catalog.",
    mimeType: "text/markdown",
  },
]

export function protocolSlugs(): string[] {
  return CATALOG_PROTOCOLS.map((p) => p.slug)
}

/** The protocol as markdown, for reading aloud or quoting. Null for an unknown slug. */
export function protocolMarkdown(slug: string, origin: string): string | null {
  const p = findProtocol(slug)
  if (!p) return null
  const { infoUrl } = catalogLinks("protocol", p.slug, origin)
  const lines = [`# ${p.name}`, "", p.tagline, "", p.description, "", `Why: ${p.why}`, "", `Pillar: ${p.pillar} · Difficulty: ${p.difficulty} · ${p.duration}`]
  if (infoUrl) lines.push(`Page: ${infoUrl}`)
  lines.push("", "## Habits", ...p.habits.map((h) => `- ${h.name} (${h.time}, ${scheduleLabel(h.schedule)}): ${h.why}`))
  if (p.steps.length) lines.push("", "## Steps", ...p.steps.map((s, i) => `${i + 1}. ${s}`))
  if (p.benefits.length) lines.push("", "## Benefits", ...p.benefits.map((b) => `- ${b}`))
  if (p.risks.length) lines.push("", "## Cautions", ...p.risks.map((r) => `- ${r}`))
  if (p.evidence.length) {
    lines.push("", "## Evidence", ...p.evidence.map((s) => `- ${s.title}${s.authors ? `, ${s.authors}` : ""}${s.year ? ` (${s.year})` : ""}${s.url ? ` ${s.url}` : ""}`))
  }
  lines.push("", `To add it: adopt_habit with protocolSlug "${p.slug}".`)
  return lines.join("\n") + "\n"
}

export type ReadResult =
  | { contents: { uri: string; mimeType: string; text: string }[] }
  | { error: { code: number; message: string } }

/** -32002 is MCP's "resource not found". */
const NOT_FOUND = -32002

export async function readResource(uri: string, token: string, origin: string): Promise<ReadResult> {
  if (uri.startsWith(PROTOCOL_PREFIX)) {
    const slug = decodeURIComponent(uri.slice(PROTOCOL_PREFIX.length))
    const text = protocolMarkdown(slug, origin)
    if (!text) return { error: { code: NOT_FOUND, message: `No protocol with slug "${slug}". Find slugs with search_catalog.` } }
    return { contents: [{ uri, mimeType: "text/markdown", text }] }
  }

  const resource = STATIC_RESOURCES.find((r) => r.uri === uri)
  if (!resource) return { error: { code: NOT_FOUND, message: `Unknown resource: ${uri}` } }

  const result = await callApi(resource.handler, "GET", resource.path, token, origin)
  if (result.status >= 400) {
    let message = `HTTP ${result.status}`
    try {
      const parsed = JSON.parse(result.text) as { message?: string; error?: string }
      message = parsed.message ?? parsed.error ?? message
    } catch {
      // keep the status
    }
    return { error: { code: -32603, message } }
  }
  return { contents: [{ uri, mimeType: resource.mimeType, text: result.text }] }
}
