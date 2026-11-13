"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/components/i18n/locale-provider"
import { labels, fieldLabel } from "./editor-fields"

type Revision = {
  id: string
  createdAt: string
  actor: string
  source: "manual" | "ai" | "system"
  changes: Record<string, { before: unknown; after: unknown }>
}
type Page = { entries: Revision[]; nextCursor: string | null }

function display(value: unknown, empty: string) {
  if (value == null || value === "") return empty
  return typeof value === "string" ? value : JSON.stringify(value, null, 2)
}

export function EditHistory({ url }: { url: string }) {
  const locale = useLocale()
  const t = labels[locale]
  const [entries, setEntries] = useState<Revision[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [request, setRequest] = useState<{ cursor?: string }>({})
  const [pending, setPending] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      setPending(true)
      setFailed(false)
      try {
        const search = request.cursor ? "?" + new URLSearchParams({ cursor: request.cursor }) : ""
        const response = await fetch(url + search, { signal: controller.signal, cache: "no-store" })
        if (!response.ok) throw new Error("history")
        const page: Page = await response.json()
        if (controller.signal.aborted) return
        setEntries(previous => request.cursor ? [...previous, ...page.entries] : page.entries)
        setCursor(page.nextCursor)
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      } finally {
        if (!controller.signal.aborted) setPending(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [request, url])

  return <div className="space-y-4 text-sm">
    {entries.map(entry => <details key={entry.id} className="rounded-lg border border-border p-3">
      <summary className="cursor-pointer">
        <strong>{t[entry.source]}</strong>{" · "}{new Date(entry.createdAt).toLocaleString(locale)}{" · "}
        <span className="break-all text-muted-foreground">{entry.actor}</span>
      </summary>
      {Object.entries(entry.changes).map(([field, change]) => <div className="mt-4" key={field}>
        <h3 className="font-medium">{fieldLabel(t, field)}</h3>
        <dl className="mt-1 grid gap-2 sm:grid-cols-2">{(["before", "after"] as const).map(side =>
          <div key={side} className="min-w-0 rounded-md bg-muted p-2">
            <dt className="text-xs text-muted-foreground">{t[side]}</dt>
            <dd className="max-h-64 overflow-auto whitespace-pre-wrap break-words">{display(change[side], t.emptyValue)}</dd>
          </div>
        )}</dl>
      </div>)}
    </details>)}
    {failed ? <div role="alert">{t.historyError} <Button type="button" variant="outline" onClick={() => setRequest({ ...request })}>{t.retry}</Button></div>
      : pending ? <p role="status">{t.loading}</p>
      : entries.length === 0 ? <p className="text-muted-foreground">{t.empty}</p>
      : cursor && <Button type="button" variant="outline" onClick={() => setRequest({ cursor })}>{t.older}</Button>}
  </div>
}
