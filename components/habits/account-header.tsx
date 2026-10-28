"use client"

import { useState } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { BadgeCheck, ChevronDown, Download, LogOut, Mic, Settings, UserRound } from "lucide-react"

import type { SettingsTab } from "@/components/habits/settings/settings-tabs"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { settingsButtonClass } from "@/components/habits/settings/settings-ui"
import { displayNip05, useNostrProfile } from "@/lib/habits/nostr/use-nostr-profile"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface AccountHeaderProps {
  /** Hex pubkey for Nostr accounts; null for the older API-key accounts. */
  pubkey: string | null
  /** The tracker's own profile name, used when the Nostr profile has none. */
  fallbackName?: string | null
  /** Opens Settings, on the given tab when there is one. */
  onOpenSettings: (tab?: SettingsTab) => void
  /** Downloads a full backup; the menu item is hidden without it. */
  onExport?: () => void
  onLogout: () => void
  /** Compact = phone header: smaller avatar, bigger menu rows, its own Settings button. */
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
 * Who is signed in (Nostr picture, name, NIP-05 address). The whole card is
 * one button that opens the account menu: profile, settings, assistants,
 * export, sign out. Phones also get a Settings button at the other end of the
 * header, since the menu is one tap further away there.
 */
export function AccountHeader({ pubkey, fallbackName, onOpenSettings, onExport, onLogout, compact = false }: AccountHeaderProps) {
  const t = useTranslations().habits.app.accountHeader
  const common = useTranslations().habits.app.common
  const profile = useNostrProfile(pubkey)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const name = profile?.name ?? fallbackName ?? t.yourAccount
  const address = profile?.nip05 ? displayNip05(profile.nip05) : null

  // Act once the menu has closed and handed focus back to its button, so a
  // dialog opened from it restores focus there when it closes.
  const afterClose = (action: () => void) => () => window.setTimeout(action, 0)

  // Finger-sized rows on phones, the usual dense menu with a mouse.
  const itemClass = cn(
    "flex cursor-pointer select-none items-center rounded-lg text-foreground outline-none transition-colors",
    "data-[highlighted]:bg-secondary data-[highlighted]:text-foreground",
    compact ? "min-h-11 gap-3 px-3 text-base" : "gap-2.5 px-3 py-2 text-sm"
  )
  const iconClass = cn("shrink-0 text-muted-foreground", compact ? "h-5 w-5" : "h-4 w-4")

  return (
    <div className={cn("flex min-w-0 items-center", compact && "w-full justify-between gap-2")}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={cn(
              "group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-xl border border-border/60 bg-muted/50 pl-1 pr-2.5 text-left transition-colors",
              compact ? "h-11" : "py-1",
              "hover:border-border hover:bg-secondary data-[state=open]:border-border data-[state=open]:bg-secondary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
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
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
              aria-hidden
            />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            // The card sits at the left of the phone header and the right of the desktop one.
            align={compact ? "start" : "end"}
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              "z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg animate-in fade-in zoom-in-95",
              // Never narrower than the card that opened it.
              compact
                ? "min-w-[max(15rem,var(--radix-dropdown-menu-trigger-width))] p-1.5"
                : "min-w-[max(13rem,var(--radix-dropdown-menu-trigger-width))] p-1"
            )}
          >
            <DropdownMenu.Item className={itemClass} onSelect={afterClose(() => onOpenSettings("profile"))}>
              <UserRound className={iconClass} aria-hidden />
              {t.profile}
            </DropdownMenu.Item>
            <DropdownMenu.Item className={itemClass} onSelect={afterClose(() => onOpenSettings("preferences"))}>
              <Settings className={iconClass} aria-hidden />
              {t.settings}
            </DropdownMenu.Item>
            <DropdownMenu.Item className={itemClass} onSelect={afterClose(() => onOpenSettings("assistants"))}>
              <Mic className={iconClass} aria-hidden />
              {t.assistants}
            </DropdownMenu.Item>
            {onExport ? (
              <DropdownMenu.Item className={itemClass} onSelect={onExport}>
                <Download className={iconClass} aria-hidden />
                {t.exportBackup}
              </DropdownMenu.Item>
            ) : null}
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              className={cn(itemClass, "text-destructive data-[highlighted]:bg-destructive/15 data-[highlighted]:text-destructive")}
              onSelect={afterClose(() => setConfirmingSignOut(true))}
            >
              <LogOut className={cn("shrink-0", compact ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
              {t.signOut}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {compact ? (
        <button
          type="button"
          onClick={() => onOpenSettings("preferences")}
          aria-label={t.openSettings}
          title={t.openSettings}
          className={cn(
            // Same height as the account card next to it.
            "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-foreground transition-colors md:hidden",
            "hover:border-border hover:bg-secondary active:bg-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Settings className="h-5 w-5" aria-hidden />
        </button>
      ) : null}

      <AppDialog
        open={confirmingSignOut}
        onClose={() => setConfirmingSignOut(false)}
        title={t.signOutTitle}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setConfirmingSignOut(false)} className={settingsButtonClass()}>
              {common.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmingSignOut(false)
                onLogout()
              }}
              className={settingsButtonClass("danger")}
            >
              <LogOut className="h-4 w-4" />
              {t.signOut}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">{common.signOutConfirm}</p>
      </AppDialog>
    </div>
  )
}
