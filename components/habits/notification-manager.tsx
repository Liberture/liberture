"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { Habit, HabitCompletion, UserPreferences } from "@/lib/habits/types"
import { Bell } from "lucide-react"
import { Button } from "@/components/habits/ui/button"
import { useTranslations } from "@/components/i18n/locale-provider"
import { dueReminders, localNowFor, type DueReminder } from "@/lib/habits/reminders/due"
import { claimReminder, getActivePushSubscription, type AuthHeaders } from "@/lib/habits/reminders/client"

interface NotificationManagerProps {
  habits: Habit[]
  completions: HabitCompletion[]
  /** Reminders on (preferences.notifications, and the app has loaded). Off also hides the permission prompt. */
  enabled?: boolean
  /** preferences.notificationPromptDismissedAt: when the user last said "Not now". */
  dismissedAt?: string
  /** "Not now": the parent saves preferences.notificationPromptDismissedAt = now. */
  onDismiss: () => void
  /** Week start, time zone and quiet hours: the same inputs the server tick uses. */
  preferences?: UserPreferences
  /** Sent with POST /api/habits/push/claim (API-key accounts; Nostr uses the cookie). */
  authHeaders?: AuthHeaders
}

/** "Not now" keeps the permission prompt away for this long. */
const PROMPT_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000
/** How often the in-tab fallback looks for due reminders. */
const CHECK_INTERVAL_MS = 60_000

function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

/**
 * Habit reminders while Liberture is open, as a fallback: a device with an
 * active push subscription gets them from the server (even closed), so this
 * loop stays quiet there. Otherwise it fires what lib/habits/reminders/due.ts
 * says is due and claims each one first, so the server, other tabs and other
 * devices never show it twice.
 */
export function NotificationManager({
  habits,
  completions,
  enabled = true,
  dismissedAt,
  onDismiss,
  preferences,
  authHeaders,
}: NotificationManagerProps) {
  const t = useTranslations().habits.app.notificationManager
  // "unsupported" until mounted: there is no Notification API during SSR.
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported")
  /** This tab already handled the key (claimed or lost the claim): don't ask again. */
  const handledRef = useRef<Set<string>>(new Set())
  const authRef = useRef<AuthHeaders>(authHeaders ?? {})
  authRef.current = authHeaders ?? {}

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return
    const nextPermission = Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission
    setPermission(nextPermission)
  }, [])

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission)
  }, [])

  const showReminder = useCallback(async (reminder: DueReminder) => {
    const options: NotificationOptions = {
      body: reminder.body,
      icon: "/pwa-icon-192.png",
      badge: "/icon-dark-32x32.png",
      tag: reminder.tag,
      data: { url: reminder.url },
      requireInteraction: false,
      silent: false,
    }

    // Android Chrome throws on `new Notification()` and only delivers through a
    // service worker registration, so prefer that path wherever it exists.
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.showNotification(reminder.title, options)
          return
        }
      }
    } catch {
      // Fall through to the constructor below.
    }

    try {
      const notification = new Notification(reminder.title, options)
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      setTimeout(() => notification.close(), 8000)
    } catch (error) {
      console.warn("Notification delivery failed", error)
    }
  }, [])

  const checkHabits = useCallback(async () => {
    if (!enabled || !habits.length) return
    if (!("Notification" in window) || Notification.permission !== "granted") return
    // The server delivers to this device: firing here too would duplicate.
    if (await getActivePushSubscription()) return

    const localNow = localNowFor(preferences?.timeZone || deviceTimeZone())
    const due = dueReminders(
      { habits, preferences },
      completions,
      localNow,
      preferences?.weekStartsOn ?? 1,
      { reminderTitle: t.reminderTitle, reminderBody: t.reminderBody, dueBody: t.dueBody },
    )

    for (const reminder of due) {
      if (handledRef.current.has(reminder.key)) continue
      handledRef.current.add(reminder.key)
      if (await claimReminder(reminder.key, reminder.kind, localNow.date, authRef.current)) {
        await showReminder(reminder)
      }
    }
  }, [habits, completions, enabled, preferences, showReminder, t])

  useEffect(() => {
    if (!enabled) return
    void checkHabits()
    const interval = setInterval(() => void checkHabits(), CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [checkHabits, enabled])

  // A blocked permission can only be undone in browser settings, so nagging
  // about it forever just covers the UI. Settings → Reminders shows the status
  // and has its own "Allow" button, so "Not now" can stay quiet for a month.
  const dismissedRecently = dismissedAt ? Date.now() - Date.parse(dismissedAt) < PROMPT_SNOOZE_MS : false
  if (!enabled || permission !== "default" || dismissedRecently) return null

  // Bottom-right, high enough on phones to clear the bottom nav and the toast
  // stack above it (toasts sit 88px up, see ui/toast.tsx).
  return (
    <div
      role="region"
      aria-label={t.promptTitle}
      className="fixed bottom-[calc(10.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm sm:left-auto sm:max-w-xs lg:bottom-6"
    >
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden />
        <div className="flex-1">
          <p className="mb-2 text-sm font-semibold text-foreground">{t.promptTitle}</p>
          <p className="mb-3 text-xs text-muted-foreground">
            {t.promptBody}
          </p>
          <div className="flex gap-2">
            <Button onClick={requestPermission} size="sm" className="flex-1">
              {t.enable}
            </Button>
            <Button onClick={onDismiss} size="sm" variant="ghost">
              {t.notNow}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
