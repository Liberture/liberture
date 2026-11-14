/** Only public HTTP media or existing local paths; never javascript/data URLs. */
export function mediaFields(body: Record<string, unknown>) {
  const result: Record<string, string | null> = {}
  for (const field of ["imageUrl", "previewImageUrl"]) {
    const value = body[field]
    if (value === undefined) continue
    if (value === null || value === "") { result[field] = null; continue }
    if (typeof value !== "string" || value.length > 2048) return null
    if (/^\/(?!\/)[^\s\\]*$/.test(value)) { result[field] = value; continue }
    try {
      const url = new URL(value)
      if (url.protocol !== "https:" || url.username || url.password) return null
      result[field] = url.href
    } catch { return null }
  }
  return result
}
