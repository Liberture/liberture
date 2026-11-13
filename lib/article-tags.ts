export function articleTags(value: string): string[] {
  if (value.trimStart().startsWith("[")) {
    try {
      const tags: unknown = JSON.parse(value)
      if (Array.isArray(tags)) return tags.filter((tag): tag is string => typeof tag === "string")
    } catch {
      // Older entries store comma-separated tags.
    }
  }
  return value.split(",").map(tag => tag.trim()).filter(Boolean)
}
