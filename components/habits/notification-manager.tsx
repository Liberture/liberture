"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { Habit, HabitCompletion } from "@/lib/habits/types"
import { format, startOfDay } from "date-fns"
import { Bell } from "lucide-react"
import { Button } from "@/components/habits/ui/button"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface NotificationManagerProps {
  habits: Habit[]
  completions: HabitCompletion[]
  enabled?: boolean
}

export function NotificationManager({ habits, completions, enabled = true }: NotificationManagerProps) {
  const t = useTranslations().habits.app.notificationManager
  const notifiedHabitsRef = useRef<Set<string>>(new Set())
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [dismissed, setDismissed] = useState(false)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  const sendNotification = useCallback(async (habitName: string, body?: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return

    const options: NotificationOptions = {
      body: body ?? formatMessage(t.reminderBody, { name: habitName }),
      icon: "/pwa-icon-192.png",
      badge: "/icon-dark-32x32.png",
      tag: `habit-${habitName}`,
      requireInteraction: false,
      silent: false,
    }

    // Android Chrome throws on `new Notification()` and only delivers through a
    // service worker registration, so prefer that path wherever it exists.
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.showNotification(t.reminderTitle, options)
          return
        }
      }
    } catch {
      // Fall through to the constructor below.
    }

    try {
      const notification = new Notification(t.reminderTitle, options)
      notification.onclick = () => {
        window.focus()
        notification.close()
      }
      setTimeout(() => notification.close(), 8000)
    } catch (error) {
      console.warn("Notification delivery failed", error)
    }
  }, [t])

  const isHabitScheduledForToday = useCallback((habit: Habit): boolean => {
    const today = new Date().getDay()

    if (habit.schedule.type === "daily") {
      return true
    } else if (habit.schedule.type === "specific_days" && habit.schedule.days) {
      return habit.schedule.days.includes(today)
    } else if (habit.schedule.type === "times_per_week") {
      // For times_per_week, assume any day is valid
      return true
    }

    return false
  }, [])

  const checkHabits = useCallback(() => {
    if (!enabled || !habits.length) return

    const now = new Date()
    const todayStr = format(startOfDay(now), "yyyy-MM-dd")
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes()

    habits.forEach((habit) => {
      if (habit.archived) return

      // Skip if habit is not scheduled for today
      if (!isHabitScheduledForToday(habit)) return

      // Check if already completed today. A record can exist with completed:false
      // when only data was logged, so the flag has to be read, not just presence.
      const isCompleted = completions.some(
        (c) => c.habitId === habit.id && c.date === todayStr && c.completed
      )

      if (isCompleted) return

      // Opt-in nudges at random points in the day, separate from the reminder
      // at the habit's scheduled time below.
      if (habit.randomRemindersEnabled) {
        const randomNotificationKey = habit.id + "-" + todayStr + "-random-" + Math.floor(currentTimeMinutes / 180)
        if (!notifiedHabitsRef.current.has(randomNotificationKey) && Math.random() < 1 / 120) {
          sendNotification(habit.name)
          notifiedHabitsRef.current.add(randomNotificationKey)
        }
      }

      // Parse habit time (format: "HH:MM" or "H:MM AM/PM").
      // Older/pro-model habits may only have timeOfDay and no concrete time;
      // skip those instead of throwing on every render/interval.
      if (typeof habit.time !== "string" || habit.time.trim() === "") {
        return
      }

      const timeParts = habit.time.match(/(\d+):(\d+)\s*(AM|PM)?/i)
      if (!timeParts) return

      let hours = Number.parseInt(timeParts[1])
      const minutes = Number.parseInt(timeParts[2])
      const period = timeParts[3]?.toUpperCase()

      if (period === "PM" && hours !== 12) hours += 12
      if (period === "AM" && hours === 12) hours = 0

      const habitTimeMinutes = hours * 60 + minutes

      const minutesOverdue = currentTimeMinutes - habitTimeMinutes

      if (minutesOverdue >= 0 && minutesOverdue <= 720) {
        // From the scheduled minute up to 12 hours late
        const notificationKey = `${habit.id}-${todayStr}`

        // Only notify once per habit per day
        if (!notifiedHabitsRef.current.has(notificationKey)) {
          console.log(`[v0] Sending notification for overdue habit: ${habit.name}`)
          sendNotification(habit.name, formatMessage(t.overdueBody, { name: habit.name, time: habit.time }))
          notifiedHabitsRef.current.add(notificationKey)
        }
      }
    })
  }, [habits, completions, enabled, sendNotification, isHabitScheduledForToday, t])

  useEffect(() => {
    if (!enabled) return

    // Check immediately on mount
    checkHabits()

    // Then check every minute
    checkIntervalRef.current = setInterval(checkHabits, 60000)

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [checkHabits, enabled])

  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setHours(24, 0, 0, 0)
    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    const midnightTimer = setTimeout(() => {
      console.log("[v0] Clearing notification cache at midnight")
      notifiedHabitsRef.current.clear()

      // Set up daily clearing
      const dailyInterval = setInterval(
        () => {
          notifiedHabitsRef.current.clear()
        },
        24 * 60 * 60 * 1000,
      )

      return () => clearInterval(dailyInterval)
    }, msUntilMidnight)

    return () => clearTimeout(midnightTimer)
  }, [])

  if (!("Notification" in window)) {
    return null
  }

  // A blocked permission can only be undone in browser settings, so nagging
  // about it forever just covers the UI. Settings shows the status instead.
  if (permission !== "default" || dismissed) return null

  return (
    <div className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom))] right-4 z-40 max-w-xs rounded-xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur-sm lg:bottom-6">
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
            <Button onClick={() => setDismissed(true)} size="sm" variant="ghost">
              {t.notNow}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
