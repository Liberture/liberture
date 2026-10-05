"use client"

import { useState } from "react"
import { BadgeCheck, LogOut, Settings } from "lucide-react"

import { displayNip05, useNostrProfile } from "@/lib/habits/nostr/use-nostr-profile"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface AccountHeaderProps {
  /** Hex pubkey for Nostr accounts; null for the older API-key accounts. */
  pubkey: string | null
  /** The tracker's own profile name, used when the Nostr profile has none. */
  fallbackName?: string | null
  onSettings: () => void
  onLogout: () => void
  /** Compact = phone header: avatar and buttons, name truncated harder. */
  compact?: boolean
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

export function Avatar({ src, name, size }: { src: string | null; name: string; size: number }) {
  const [broken, setBroken] = useState(false)
  const style = { width: size, height: size }
  if (src && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote avatars from arbitrary hosts; next/image would need every domain whitelisted
      <img
        src={src}
        alt=""
        style={style}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setBroken(true)}
        className="shrink-0 rounded-full border border-border bg-muted object-cover"
      />
    )
  }
  return (
    <span
      style={style}
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-xs font-semibold text-primary"
    >
      {initials(name)}
    </span>
  )
}

/**
 * Who is signed in (Nostr picture, name, NIP-05 address) plus the Settings and
 * Log out buttons, filled so they read as buttons on the dark background.
 */
export function AccountHeader({ pubkey, fallbackName, onSettings, onLogout, compact = false }: AccountHeaderProps) {
  const t = useTranslations().habits.app.accountHeader
  const profile = useNostrProfile(pubkey)
  const name = profile?.name ?? fallbackName ?? t.yourAccount
  const address = profile?.nip05 ? displayNip05(profile.nip05) : null

  const buttonClass = cn(
    "flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary text-sm font-medium text-secondary-foreground transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    compact ? "size-11" : "h-10 min-w-10 px-2.5 2xl:px-3.5"
  )

  return (
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3", compact && "w-full justify-between")}>
      <button
        type="button"
        onClick={onSettings}
        className="flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-secondary/60"
        aria-label={formatMessage(t.accountLabel, { name })}
      >
        <Avatar src={profile?.picture ?? null} name={name} size={compact ? 36 : 40} />
        <span className="min-w-0">
          <span className={cn("block truncate font-semibold text-foreground", compact ? "max-w-[11rem] text-sm" : "max-w-[10rem] text-sm")}>{name}</span>
          {address ? (
            <span className={cn("flex items-center gap-1 truncate text-xs text-muted-foreground", compact ? "max-w-[11rem]" : "max-w-[10rem]")}>
              <span className="truncate">{address}</span>
              {profile?.nip05Verified ? <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label={t.verified} /> : null}
            </span>
          ) : null}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onSettings} aria-label={t.settings} title={t.settings} className={cn(buttonClass, "hover:bg-secondary/70")}>
          <Settings className={compact ? "size-5" : "h-4 w-4"} />
          {compact ? null : <span className="hidden 2xl:inline">{t.settings}</span>}
        </button>
        <button
          type="button"
          onClick={onLogout}
          aria-label={t.logOut}
          title={t.logOut}
          className={cn(buttonClass, "hover:border-destructive/50 hover:bg-destructive/15 hover:text-destructive")}
        >
          <LogOut className={compact ? "size-5" : "h-4 w-4"} />
          {compact ? null : <span className="hidden 2xl:inline">{t.logOut}</span>}
        </button>
      </div>
    </div>
  )
}
