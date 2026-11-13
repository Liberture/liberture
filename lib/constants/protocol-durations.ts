import en from "@/messages/durations/en.json"
import es from "@/messages/durations/es.json"
import type { Locale } from "@/lib/translations"

export type ProtocolDurationKey = keyof typeof en
export const protocolDurations = { en, es } satisfies Record<Locale, Record<ProtocolDurationKey, string>>

const storedDurationKeys = new Map<string, ProtocolDurationKey>(
  (Object.keys(en) as ProtocolDurationKey[]).map(key => [en[key], key]),
)

export function localizeProtocolDuration(value: string, locale: Locale) {
  const key = storedDurationKeys.get(value)
  return key ? protocolDurations[locale][key] : value
}
