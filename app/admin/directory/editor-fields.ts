import type { HabitsDictionary } from "@/lib/translations"

const organizationGroups = {
    details: ["name", "type", "pillars", "founded"],
    content: ["description", "keyPeople", "resources", "publications"],
    links: ["website", "wikipedia", "imageUrl"],
} as const

export const editorGroups = {
  people: {
    details: ["name", "title", "expertise", "pillars"],
    content: ["summary", "bio"],
    links: ["website", "wikipedia", "twitter", "instagram", "youtube", "podcast"],
  },
  organizations: { ...organizationGroups, relationships: ["relatedPeople"] },
  projects: { ...organizationGroups, relationships: ["relatedPeople", "relatedOrganizations"] },
  books: {
    details: ["title", "author", "pillars", "year", "rating"],
    content: ["description"],
    links: ["imageUrl", "wikipedia", "amazonUrl", "goodreadsUrl"],
  },
  articles: {
    details: ["title", "author", "pillar", "tags", "readTime", "url"],
    content: ["description", "content"],
  },
  protocols: {
    details: ["name", "pillar", "creator", "duration", "difficulty"],
    content: ["description", "steps", "benefits", "risks", "equipment"],
  },
} as const

export type DirectoryType = keyof typeof editorGroups
export type EditorValues = Record<string, string>

export function isDirectoryType(value: string): value is DirectoryType {
  return Object.hasOwn(editorGroups, value)
}

export function editorValues(type: DirectoryType, record: Record<string, unknown>): EditorValues {
  const fields: string[] = Object.values(editorGroups[type]).flat()
  const values = Object.fromEntries(fields.map(field => [field, String(record[field] ?? "")]))
  if (type === "projects" || type === "organizations") {
    const people = Array.isArray(record.profilePeople) ? record.profilePeople : []
    values.relatedPeople = JSON.stringify(people.map(({ personId, role, sourceUrl }) => ({ id: personId, role, sourceUrl })))
  }
  if (type === "projects") {
    const links = Array.isArray(record.projectOrganizations) ? record.projectOrganizations : []
    values.relatedOrganizations = JSON.stringify(links.map(({ organizationId, role, sourceUrl }) => ({ id: organizationId, role, sourceUrl })))
  }
  return values
}

export type EditorLabels = HabitsDictionary["app"]["directoryEditor"]
export function fieldLabel(t: EditorLabels, field: string) {
  return field === "content" ? t.markdown : t[field as keyof EditorLabels] ?? field
}
