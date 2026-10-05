/** Fills `{name}` placeholders in a translated string. */
export function formatMessage(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))
}

/** Picks `one` or `other` by count and fills `{count}`. */
export function plural(forms: { one: string; other: string }, count: number, values: Record<string, string | number> = {}): string {
  return formatMessage(count === 1 ? forms.one : forms.other, { count, ...values })
}
