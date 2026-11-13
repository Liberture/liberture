export function translatedLabel(labels: Record<string, string>, key: string, fallback = key): string {
  return Object.prototype.hasOwnProperty.call(labels, key) ? labels[key] : fallback
}
