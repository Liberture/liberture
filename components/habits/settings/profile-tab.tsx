"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BadgeCheck, Check, Copy } from "lucide-react"

import { Avatar } from "@/components/habits/account-header"
import { NostrMigrationCard } from "@/components/habits/nostr-migration-card"
import { SettingRow, SettingsCard, settingsButtonClass, settingsInputClass } from "@/components/habits/settings/settings-ui"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { hexToNpub, shortenNpub } from "@/lib/habits/nostr/crypto"
import { displayNip05, useNostrProfile } from "@/lib/habits/nostr/use-nostr-profile"
import type { Habit, UserProfile } from "@/lib/habits/types"
import { cn } from "@/lib/utils"

const MAX_FOCUS = 3
/** Typing is batched so every keystroke isn't its own save. */
const COMMIT_DELAY_MS = 500

interface ProfileTabProps {
  apiKey: string
  isNostrAuth: boolean
  pubkey: string | null
  profile?: UserProfile
  onProfileChange: (patch: Partial<UserProfile>) => void
  habits: Habit[]
  linkedNostrPubkey?: string | null
  onNostrMigration?: (pubkey: string, npub: string) => void
}

export function ProfileTab({
  apiKey,
  isNostrAuth,
  pubkey,
  profile,
  onProfileChange,
  habits,
  linkedNostrPubkey,
  onNostrMigration,
}: ProfileTabProps) {
  const t = useTranslations().habits.app.settingsDialog
  const nostrProfile = useNostrProfile(isNostrAuth ? pubkey : null)
  const [copied, setCopied] = useState(false)
  const [migratedNpub, setMigratedNpub] = useState<string | null>(null)
  const [name, setName] = useState(profile?.name ?? "")
  const [mission, setMission] = useState(profile?.missionStatement ?? "")
  const npub = pubkey && /^[0-9a-f]{64}$/.test(pubkey) ? hexToNpub(pubkey) : null
  const shownName = nostrProfile?.name ?? (name.trim() || (isNostrAuth ? t.nostrAccount : t.yourAccount))

  // Pending text edits, flushed after a pause and when the tab closes.
  const pending = useRef<Partial<UserProfile>>({})
  const timer = useRef<number | undefined>(undefined)
  const onChangeRef = useRef(onProfileChange)
  onChangeRef.current = onProfileChange
  const flush = useCallback(() => {
    window.clearTimeout(timer.current)
    const patch = pending.current
    pending.current = {}
    if (Object.keys(patch).length > 0) onChangeRef.current(patch)
  }, [])
  useEffect(() => flush, [flush])
  const queue = (patch: Partial<UserProfile>) => {
    pending.current = { ...pending.current, ...patch }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, COMMIT_DELAY_MS)
  }

  const activeHabits = habits.filter((h) => !h.archived)
  const focus = (profile?.focusHabits ?? []).filter((id) => activeHabits.some((h) => h.id === id))
  const toggleFocus = (id: string) => {
    flush()
    const next = focus.includes(id) ? focus.filter((f) => f !== id) : [...focus, id].slice(0, MAX_FOCUS)
    onProfileChange({ focusHabits: next })
  }

  const copyNpub = async () => {
    if (!npub) return
    try {
      await navigator.clipboard.writeText(npub)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked; the npub is on screen to select by hand.
    }
  }

  const handleMigrationComplete = useCallback(
    (newPubkey: string, newNpub: string) => {
      setMigratedNpub(newNpub)
      onNostrMigration?.(newPubkey, newNpub)
    },
    [onNostrMigration]
  )

  return (
    <>
      <SettingsCard>
        <div className="flex items-center gap-4">
          <Avatar src={nostrProfile?.picture ?? null} name={shownName} size={56} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">{shownName}</p>
            {nostrProfile?.nip05 ? (
              <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                <span className="truncate">{displayNip05(nostrProfile.nip05)}</span>
                {nostrProfile.nip05Verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label={t.verified} /> : null}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{isNostrAuth ? t.signedInWithNostr : t.signedInWithApiKey}</p>
            )}
          </div>
        </div>

        {npub ? (
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 overflow-hidden whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
              {shortenNpub(npub, 10)}
            </code>
            <button type="button" onClick={copyNpub} className={settingsButtonClass()}>
              {copied ? <Check className="h-4 w-4 text-nutrition" /> : <Copy className="h-4 w-4" />}
              {copied ? t.copied : t.copyNpub}
            </button>
          </div>
        ) : null}
      </SettingsCard>

      <SettingsCard title={t.profile.title} description={t.profile.description}>
        <div className="space-y-1.5">
          <label htmlFor="profile-name" className="block text-sm font-medium text-foreground">
            {t.profile.displayName}
          </label>
          <input
            id="profile-name"
            type="text"
            autoComplete="nickname"
            maxLength={80}
            value={name}
            placeholder={t.profile.displayNamePlaceholder}
            onChange={(event) => {
              setName(event.target.value)
              queue({ name: event.target.value.trim() || undefined })
            }}
            onBlur={flush}
            className={settingsInputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="profile-mission" className="block text-sm font-medium text-foreground">
            {t.profile.mission}
          </label>
          <textarea
            id="profile-mission"
            rows={3}
            maxLength={500}
            value={mission}
            placeholder={t.profile.missionPlaceholder}
            aria-describedby="profile-mission-hint"
            onChange={(event) => {
              setMission(event.target.value)
              queue({ missionStatement: event.target.value.trim() || undefined })
            }}
            onBlur={flush}
            className={cn(settingsInputClass, "h-auto resize-y py-2 leading-relaxed")}
          />
          <p id="profile-mission-hint" className="text-xs text-muted-foreground">
            {t.profile.missionHint}
          </p>
        </div>
      </SettingsCard>

      <SettingsCard title={t.profile.focusTitle} description={formatMessage(t.profile.focusDescription, { max: MAX_FOCUS })}>
        {activeHabits.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.profile.focusEmpty}</p>
        ) : (
          <>
            <div role="group" aria-label={t.profile.focusTitle} className="flex flex-wrap gap-2">
              {activeHabits.map((habit) => {
                const selected = focus.includes(habit.id)
                const full = !selected && focus.length >= MAX_FOCUS
                return (
                  <button
                    key={habit.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={full}
                    title={full ? formatMessage(t.profile.focusLimitReached, { max: MAX_FOCUS }) : undefined}
                    onClick={() => toggleFocus(habit.id)}
                    className={cn(
                      "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-40",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {selected ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
                    <span className="truncate">{habit.name}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {formatMessage(t.profile.focusCount, { count: focus.length, max: MAX_FOCUS })}
            </p>
          </>
        )}
      </SettingsCard>

      {!isNostrAuth ? (
        <SettingsCard title={t.nostrIdentity} description={t.nostrIdentityDescription}>
          {linkedNostrPubkey || migratedNpub ? (
            <SettingRow
              title={
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-nutrition" />
                  {t.linked}
                </span>
              }
              description={<code className="font-mono">{shortenNpub(migratedNpub || linkedNostrPubkey || "", 12)}</code>}
            />
          ) : (
            <NostrMigrationCard apiKey={apiKey} onMigrationComplete={handleMigrationComplete} />
          )}
        </SettingsCard>
      ) : null}
    </>
  )
}
