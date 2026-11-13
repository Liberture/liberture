"use client"

import { useEffect, useId, useState } from "react"
import { decode, npubEncode } from "nostr-tools/nip19"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNostrProfile } from "@/lib/habits/nostr/use-nostr-profile"
import type { ProfileMatch } from "@/lib/habits/nostr/search-profiles"

function publicKey(value: string) {
  try {
    const decoded = decode(
      value
        .trim()
        .replace(/^nostr:/i, "")
        .toLowerCase(),
    )
    return decoded.type === "npub" ? decoded.data : null
  } catch {
    return null
  }
}

export function InviteTarget({ role }: { role: "player" | "moderator" }) {
  const t = useTranslations("challenges")
  const id = useId()
  const [search, setSearch] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<ProfileMatch | null>(null)
  const [matches, setMatches] = useState<ProfileMatch[]>([])
  const [loading, setLoading] = useState(false)
  const term = query.trim()
  const key = publicKey(selected?.npub ?? term)
  const profile = useNostrProfile(search ? key : null)
  const npub = key ? npubEncode(key) : ""
  const name = profile?.name || selected?.name
  const picture = profile?.picture || selected?.picture
  const address = profile?.nip05 || selected?.address
  useEffect(() => {
    if (!search || key || term.length < 2 || /^(nostr:|npub1)/i.test(term)) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const { searchProfiles } = await import("@/lib/habits/nostr/search-profiles")
        const list = await searchProfiles(term, controller.signal)
        if (!controller.signal.aborted) setMatches(list)
      } catch {
        if (!controller.signal.aborted) setMatches([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 350)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [search, key, term])
  function change(value: string) {
    setQuery(value)
    setSelected(null)
    setMatches([])
    setLoading(value.trim().length >= 2 && !/^(nostr:|npub1)/i.test(value.trim()))
  }
  return (
    <fieldset className="min-w-0 space-y-2 rounded-lg border border-border p-3">
      <legend className="px-1 text-sm font-medium">{t("inviteRole", { role: t(role) })}</legend>
      <div className="flex flex-wrap gap-2">
        {[false, true].map((mode) => (
          <Button
            type="button"
            size="sm"
            variant={search === mode ? "default" : "outline"}
            key={String(mode)}
            aria-pressed={search === mode}
            onClick={() => setSearch(mode)}
          >
            {t(mode ? "findProfile" : "byLink")}
          </Button>
        ))}
      </div>
      <input type="hidden" name={role + "Npub"} value={search ? npub : ""} />
      {search ? (
        <>
          <label htmlFor={id} className="text-sm">
            {t("profileQuery")}
          </label>
          <Input
            id={id}
            value={selected?.npub ?? query}
            required
            maxLength={160}
            autoComplete="off"
            onChange={(e) => change(e.target.value)}
            ref={(el) => {
              el?.setCustomValidity(npub ? "" : t("selectProfile"))
            }}
          />
          {key ? (
            <div className="flex items-center gap-2 text-sm" role="status">
              {picture && (
                <img
                  src={picture}
                  alt=""
                  width="32"
                  height="32"
                  referrerPolicy="no-referrer"
                  className="size-8 rounded-full object-cover"
                />
              )}
              <span className="break-all">
                {name || t("validKey")}
                {address && " · " + address}
              </span>
            </div>
          ) : (
            <>
              {term.length >= 2 && (
                <p role="status" className="text-xs text-muted-foreground">
                  {loading ? t("looking") : matches.length ? "" : t("noProfiles")}
                </p>
              )}
              {matches.map((m) => (
                <button
                  type="button"
                  key={m.npub}
                  className="block w-full rounded-md px-2 py-1 text-left hover:bg-muted focus-visible:bg-muted"
                  onClick={() => setSelected(m)}
                >
                  <strong>{m.name || m.address}</strong> <small>{m.address}</small>
                  <span className="block truncate font-mono text-xs">{m.npub}</span>
                </button>
              ))}
            </>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("laterLink")}</p>
      )}
    </fieldset>
  )
}
