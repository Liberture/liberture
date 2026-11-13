import type { HabitsDictionary } from "@/lib/translations"

export const editorGroups = {
  people: {
    details: ["name", "title", "expertise", "pillars"],
    content: ["bio"],
    links: ["website", "wikipedia", "twitter", "instagram", "youtube", "podcast"],
  },
  organizations: {
    details: ["name", "type", "pillars", "founded"],
    content: ["description", "keyPeople", "resources", "publications"],
    links: ["website", "wikipedia", "imageUrl"],
  },
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
  return Object.fromEntries(fields.map(field => [field, String(record[field] ?? "")]))
}

export type EditorLabels = HabitsDictionary["app"]["directoryEditor"]
export function fieldLabel(t: EditorLabels, field: string) {
  return field === "content" ? t.markdown : t[field as keyof EditorLabels] ?? field
}
