"use client"

import { useEffect, useId, useRef, useState } from "react"
import { decode, npubEncode } from "nostr-tools/nip19"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { PlayerProfile } from "./player-profile"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/habits/ui/popover"
import { Input } from "@/components/ui/input"
import { useNostrProfile } from "@/lib/habits/nostr/use-nostr-profile"
import { useHabitsSession } from "@/components/habits/session-provider"
import { loadFollowProfiles, rankProfiles, type ProfileMatch } from "@/lib/habits/nostr/search-profiles"

export function recipientPublicKey(value: string) {
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

export function NostrRecipient({ nameField, initialNpub = "", defaultQuery = "", onRecipientChange, optional = false, sendBusy, action }: { defaultQuery?: string; onRecipientChange?: (npub: string, match?: ProfileMatch) => void; action?: React.ReactNode; nameField: string; initialNpub?: string; optional?: boolean; sendBusy?: boolean }) {
  const t = useTranslations("challenges")
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [query, setQuery] = useState(initialNpub || defaultQuery)
  const [selected, setSelected] = useState<ProfileMatch | null>(null)
  const { auth } = useHabitsSession()
  const [follows, setFollows] = useState<ProfileMatch[]>([])
  const [network, setMatches] = useState<ProfileMatch[]>([])
  const [loading, setLoading] = useState(false)
  const term = query.trim()
  const matches = rankProfiles(term, follows, network)
  const key = recipientPublicKey(selected?.npub ?? term)
  const profile = useNostrProfile(key)
  const npub = key ? npubEncode(key) : ""
  const name = profile?.name || selected?.name
  const picture = profile?.picture || selected?.picture
  const address = profile?.nip05 || selected?.address
  useEffect(() => {
    if (key || term.length < 2 || /^(nostr:|npub1)/i.test(term)) return
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
  }, [key, term])
  useEffect(() => {
    setFollows([])
    if (!auth.pubkey || initialNpub) return
    const controller = new AbortController()
    void loadFollowProfiles(auth.pubkey, controller.signal, (rows) => {
      if (!controller.signal.aborted) setFollows(rows)
    }).catch(() => {})
    return () => controller.abort()
  }, [auth.pubkey, initialNpub])
  function change(value: string) {
    const pastedKey = recipientPublicKey(value)
    onRecipientChange?.(pastedKey ? npubEncode(pastedKey) : "")
    setActiveIndex(-1)
    setFocused(true)
    setQuery(value)
    setSelected(null)
    setMatches([])
    setLoading(value.trim().length >= 2 && !/^(nostr:|npub1)/i.test(value.trim()))
  }
  const searching = focused && !key && term.length >= 2
  const player = nameField === "playerNpub"
  function choose(match: ProfileMatch) {
    setSelected(match)
    onRecipientChange?.(match.npub, match)
    setFocused(false)
  }
  useEffect(() => {
    input.current?.setCustomValidity(npub || (optional && !term) ? "" : t("selectProfile"))
  }, [npub, optional, term, t])

  return (
    <>
      {player && npub && <input type="hidden" name="playerName" value={(name || address || "").slice(0,60)} />}
      <input type="hidden" name={nameField} value={npub} />
      {player && npub ? (
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-1">
          <button type="button" className="min-w-0 rounded-md" title={t("changeOpponent")} aria-label={t("changeOpponent") + " · " + (name || npub)}
            onClick={() => { change(""); requestAnimationFrame(() => input.current?.focus()) }}>
            <PlayerProfile name={name || address || npub.slice(0,12) + "…"} picture={picture} />
          </button>
          {action}
        </div>
      ) : (
        <>
          <label htmlFor={id} className={player ? "sr-only" : "text-sm"}>{t(player ? "opponent" : "profileQuery")}</label>
          <Popover open={searching} onOpenChange={open => { if (!open) setFocused(false) }}>
            <PopoverAnchor asChild>
              <div className={action ? "relative mx-auto w-full max-w-44" : "flex flex-wrap items-center gap-2"}>
                <Input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={searching}
                  aria-controls={searching ? id + "-matches" : undefined}
                  aria-activedescendant={searching && matches[activeIndex] ? id + "-" + activeIndex : undefined}
                  className={action ? "h-8 ps-2 pe-8 text-sm" : "min-w-0 flex-[1_1_10rem]"}
                  placeholder={t("searchPlaceholder")} value={selected?.npub ?? query} readOnly={Boolean(initialNpub)}
                  required={!optional} maxLength={160} autoComplete="off"
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={e => change(e.target.value)}
                  onKeyDown={e => {
                    if (!searching) return
                    if (e.key === "Escape") { e.preventDefault(); setFocused(false) }
                    if (matches.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                      e.preventDefault()
                      const next = e.key === "ArrowDown" ? (activeIndex + 1) % matches.length : (activeIndex <= 0 ? matches.length - 1 : activeIndex - 1)
                      setActiveIndex(next)
                      document.getElementById(id + "-" + next)?.scrollIntoView({block: "nearest"})
                    }
                    if (e.key === "Enter") { e.preventDefault(); if (matches[activeIndex]) choose(matches[activeIndex]) }
                  }} />
                {action && <span className="absolute end-0.5 top-1/2 -translate-y-1/2">{action}</span>}
                {sendBusy !== undefined && <Button type="submit" size="sm" disabled={sendBusy || !key}>{t("sendInvite")}</Button>}
              </div>
            </PopoverAnchor>
            <PopoverContent side="top" align="end" collisionPadding={8} className="max-h-48 w-64 max-w-[90vw] overflow-y-auto p-1"
              onOpenAutoFocus={e => e.preventDefault()} onCloseAutoFocus={e => e.preventDefault()}
              onInteractOutside={e => { if (e.target === input.current) e.preventDefault() }}>
              <div id={id + "-matches"} role="listbox" aria-label={t("profileQuery")}>
                {matches.map((match, index) => <button key={match.npub} id={id + "-" + index}
                  role="option" aria-selected={index === activeIndex} tabIndex={-1} type="button"
                  className="block w-full truncate rounded px-2 py-1 text-left hover:bg-muted aria-selected:bg-muted"
                  onPointerDown={e => e.preventDefault()} onClick={() => choose(match)}>
                  <strong>{match.name || match.address || match.npub}</strong>
                  <small className="block truncate">{match.address || match.npub}</small>
                </button>)}
              </div>
              {!matches.length && <p role="status" className="p-2 text-xs text-muted-foreground">{t(loading ? "looking" : "noProfiles")}</p>}
            </PopoverContent>
          </Popover>
          {key && <PlayerProfile name={name || address || npub.slice(0,12) + "…"} picture={picture} />}
        </>
      )}
    </>
  )
}
