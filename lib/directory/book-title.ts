// Prefer a colon when a main title already contains a spaced dash.
export function splitBookTitle(fullTitle: string) {
  const separator = /:\s+/.exec(fullTitle) ?? /\s+[–—-]\s+/.exec(fullTitle)
  if (!separator) return { title: fullTitle, subtitle: "" }
  return {
    title: fullTitle.slice(0, separator.index),
    subtitle: fullTitle.slice(separator.index + separator[0].length),
  }
}
