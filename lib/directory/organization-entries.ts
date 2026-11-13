export function httpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return
  try {
    const url = new URL(value)
    if (url.protocol === "https:" || url.protocol === "http:") return url.href
  } catch {
    return
  }
}

export type Entry = { title: string; url?: string }

export function entries(raw: string | null): Entry[] {
  if (!raw?.trim()) return []
  let values: unknown
  try {
    values = JSON.parse(raw)
  } catch {
    values = raw.split(/\r?\n/)
  }
  const list = Array.isArray(values) ? values : [values]
  return list.flatMap((value): Entry[] => {
    if (typeof value === "string" && value.trim()) return [{ title: value.trim(), url: httpUrl(value.trim()) }]
    if (value && typeof value.title === "string" && value.title.trim()) return [{ title: value.title.trim(), url: httpUrl(value.url) }]
    return []
  })
}
