import type { PillarId } from "@/lib/constants/pillars"
import type { Locale } from "@/lib/translations"

const sections: Record<string, string> = {
  about: "nosotros", articles: "articulos", books: "libros", contact: "contacto",
  content: "contenido", directory: "directorio", docs: "documentacion",
  "get-started": "primeros-pasos", guides: "guias", "how-it-works": "como-funciona",
  "media-kit": "kit-de-prensa", organizations: "organizaciones", people: "personas",
  pillars: "pilares", privacy: "privacidad", projects: "proyectos", protocols: "protocolos",
  support: "ayuda", terms: "terminos", unsubscribed: "suscripcion-cancelada",
}

const children: Record<string, Record<string, string>> = {
  docs: { api: "api", chatgpt: "chatgpt", claude: "claude", permissions: "permisos", updates: "novedades" },
  pillars: { work: "trabajo", sleep: "sueno", nutrition: "nutricion", mind: "mente", exercise: "ejercicio", finance: "finanzas" } satisfies Record<PillarId, string>,
  guides: {
    "track-habits-with-chatgpt": "registrar-habitos-con-chatgpt",
    "connect-claude-to-your-habit-tracker": "conectar-claude-al-registro-de-habitos",
    "log-habits-by-voice": "registrar-habitos-por-voz",
    "build-a-morning-routine-with-protocols": "crear-una-rutina-matutina-con-protocolos",
    "read-your-habit-statistics": "interpretar-las-estadisticas-de-habitos",
    "habit-tracker-privacy-and-permissions": "privacidad-y-permisos-del-registro-de-habitos",
    "refresh-your-assistant-connector": "actualizar-el-conector-del-asistente",
  },
}
export const entitySections = new Set(["articles", "books", "organizations", "people", "projects", "protocols", "content"])

function englishKey(entries: Record<string, string>, value: string) {
  return Object.keys(entries).find(key => entries[key] === value)
}

/** Decode page paths only. API endpoints, assets and private routes retain their own routing. */
export function parsePublicPath(pathname: string) {
  const pieces = pathname.split("/").filter(Boolean)
  const prefix = pieces[0]
  const locale: Locale | undefined = prefix === "en" || prefix === "es" ? pieces.shift() as Locale : undefined
  if (!pieces.length) return { locale, section: "", slug: "", internalPath: "/" }
  const [segment, child] = pieces
  const section = locale === "es" ? englishKey(sections, segment) : segment
  if (!section || !Object.hasOwn(sections, section) || pieces.length > 2) return null
  let slug = child || ""
  if (slug && children[section]) {
    slug = locale === "es" ? englishKey(children[section], slug) ?? "" : slug
    if (!Object.hasOwn(children[section], slug)) return null
  } else if (slug && !entitySections.has(section)) return null
  return { locale, section, slug, internalPath: "/" + section + (slug ? "/" + slug : "") }
}

export function localizedPath(path: string, locale: Locale, spanishEntitySlug?: string) {
  const route = parsePublicPath(path)
  if (!route || route.locale) return path
  if (!route.section) return "/" + locale
  const section = locale === "es" ? sections[route.section] : route.section
  const slug = locale === "es" ? children[route.section]?.[route.slug] ?? spanishEntitySlug ?? route.slug : route.slug
  return "/" + locale + "/" + section + (slug ? "/" + slug : "")
}

export function localizedHref(href: string, locale: Locale, slugs: ReadonlyMap<string, string>) {
  if (!href.startsWith("/") || href.startsWith("//")) return href
  const url = new URL(href, "https://liberture.com")
  const route = parsePublicPath(url.pathname)
  if (!route || route.locale) return href
  url.searchParams.delete("lang")
  return localizedPath(url.pathname, locale, slugs.get(url.pathname)) + url.search + url.hash
}
