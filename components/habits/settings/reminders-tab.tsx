"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Bell, BellRing, ChevronDown, Send } from "lucide-react"

import { SettingRow, SettingsCard, SettingsDivider, settingsButtonClass } from "@/components/habits/settings/settings-ui"
import { Switch } from "@/components/habits/ui/switch"
import { useHabitsSession } from "@/components/habits/session-provider"
import { useLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"
import {
  fetchPublicKey,
  getActivePushSubscription,
  pushSupported,
  subscribeThisDevice,
  unsubscribeThisDevice,
} from "@/lib/habits/reminders/client"
import type { ReminderStatus } from "@/lib/habits/push"
import { cn } from "@/lib/utils"

type Permission = NotificationPermission | "unsupported"
/** Whether this device can get server push: checked on mount. */
type PushState = "checking" | "unsupported" | "not_configured" | "ready"

interface RemindersTabProps {
  enabled: boolean
  /** Saved to the account (preferences.notifications). */
  onToggle: (enabled: boolean) => void
}

export function RemindersTab({ enabled, onToggle }: RemindersTabProps) {
  const t = useTranslations().habits.app.settingsDialog
  const [permission, setPermission] = useState<Permission>("default")
  const [swRegistered, setSwRegistered] = useState<boolean | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const locale = useLocale()
  const { auth } = useHabitsSession()
  const authHeaders = useMemo<Record<string, string>>(
    (): Record<string, string> => (auth.apiKey ? { Authorization: `Bearer ${auth.apiKey}` } : {}),
    [auth.apiKey]
  )
  const [pushState, setPushState] = useState<PushState>("checking")
  const [subscribed, setSubscribed] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState<string | null>(null)
  const [status, setStatus] = useState<ReminderStatus | null>(null)
  const [serverTest, setServerTest] = useState<{ ok: boolean; message: string } | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/habits/push/status", { headers: authHeaders, cache: "no-store" })
      if (response.ok) setStatus((await response.json()) as ReminderStatus)
    } catch {
      // Status is informative only.
    }
  }, [authHeaders])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!pushSupported()) return setPushState("unsupported")
      const [publicKey, subscription] = await Promise.all([fetchPublicKey(), getActivePushSubscription()])
      if (cancelled) return
      setSubscribed(Boolean(subscription))
      setPushState(publicKey ? "ready" : "not_configured")
      if (publicKey) void loadStatus()
    })()
    return () => {
      cancelled = true
    }
  }, [loadStatus])

  const togglePush = async (next: boolean) => {
    setPushError(null)
    setPushBusy(true)
    try {
      if (next) {
        const result = permission === "granted" ? permission : await requestPermission()
        if (result !== "granted") {
          setPushError(t.closedAppNeedsPermission)
          return
        }
        await subscribeThisDevice(authHeaders)
        setSubscribed(true)
      } else {
        await unsubscribeThisDevice(authHeaders)
        setSubscribed(false)
      }
      await loadStatus()
    } catch {
      setPushError(t.closedAppFailed)
    } finally {
      setPushBusy(false)
    }
  }

  const sendServerTest = async () => {
    setServerTest(null)
    try {
      const response = await fetch("/api/habits/push/test", { method: "POST", headers: authHeaders })
      const body = (await response.json().catch(() => ({}))) as { sent?: number; devices?: number }
      if (!response.ok) return setServerTest({ ok: false, message: t.serverTestFailed })
      if (!body.devices) return setServerTest({ ok: false, message: t.serverTestNoDevices })
      if (!body.sent) return setServerTest({ ok: false, message: t.serverTestFailed })
      setServerTest({ ok: true, message: plural(t.serverTestSent, body.sent) })
    } catch {
      setServerTest({ ok: false, message: t.serverTestFailed })
    } finally {
      void loadStatus()
    }
  }

  const formatWhen = (iso: string) => {
    const date = new Date(iso)
    return Number.isNaN(date.getTime())
      ? iso
      : date.toLocaleString(locale === "es" ? "es-AR" : "en-US", { dateStyle: "medium", timeStyle: "short" })
  }

  useEffect(() => {
    setPermission("Notification" in window ? Notification.permission : "unsupported")
    // Whether a service worker is registered decides whether reminders can
    // reach Android at all, so it's surfaced rather than left to the console.
    if (!("serviceWorker" in navigator)) return setSwRegistered(false)
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => setSwRegistered(Boolean(reg)))
      .catch(() => setSwRegistered(false))
  }, [])

  const requestPermission = async (): Promise<Permission> => {
    if (!("Notification" in window)) return "unsupported"
    const result = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission
    setPermission(result)
    return result
  }

  const toggle = async (next: boolean) => {
    if (next && permission === "default" && (await requestPermission()) !== "granted") return
    onToggle(next)
  }

  /**
   * Mirrors NotificationManager's delivery path exactly, and reports which one
   * worked. A silent no-op is the worst outcome here — if reminders don't reach
   * a device, the reason has to be visible.
   */
  const sendTest = async () => {
    setTestResult(null)
    if (!("Notification" in window)) return setTestResult({ ok: false, message: t.testNoNotificationApi })
    if (Notification.permission !== "granted") {
      return setTestResult({ ok: false, message: formatMessage(t.testPermissionNotGranted, { permission: t.permissionStates[Notification.permission] }) })
    }
    const options: NotificationOptions = { body: t.testNotificationBody, icon: "/pwa-icon-192.png", badge: "/icon-dark-32x32.png", tag: "habit-test" }
    try {
      const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null
      if (registration) {
        await registration.showNotification("Liberture", options)
        return setTestResult({ ok: true, message: t.testSentServiceWorker })
      }
      new Notification("Liberture", options)
      setTestResult({ ok: true, message: t.testSentNotificationApi })
    } catch (error) {
      setTestResult({ ok: false, message: error instanceof Error ? error.message : t.testUnknownError })
    }
  }

  const blocked = permission === "denied" || permission === "unsupported"

  return (
    <>
      <SettingsCard title={t.remindersTitle} description={t.remindersDescription}>
        <SettingRow
          htmlFor="reminders-switch"
          title={t.remindMe}
          description={enabled ? t.remindersOn : t.remindersOff}
          action={<Switch id="reminders-switch" checked={enabled} disabled={permission === "unsupported"} onCheckedChange={toggle} />}
        />
        <SettingsDivider />
        <SettingRow
          title={t.browserPermission}
          description={
            <span aria-live="polite">
              {permission === "denied"
                ? t.remindersBlocked
                : permission === "unsupported"
                  ? t.remindersUnsupported
                  : permission === "granted"
                    ? t.permissionGrantedHint
                    : t.permissionDefaultHint}
            </span>
          }
          action={
            permission === "default" ? (
              <button type="button" onClick={() => void requestPermission()} className={settingsButtonClass("primary")}>
                <BellRing className="h-4 w-4" />
                {t.allowNotifications}
              </button>
            ) : (
              <span
                className={cn(
                  "text-sm font-semibold capitalize",
                  permission === "granted" ? "text-nutrition" : blocked ? "text-destructive" : "text-exercise"
                )}
              >
                {t.permissionStates[permission]}
              </span>
            )
          }
        />
        <SettingsDivider />
        <SettingRow
          title={t.sendTest}
          description={t.sendTestDescription}
          action={
            <button type="button" onClick={sendTest} className={settingsButtonClass()}>
              <Bell className="h-4 w-4" />
              {t.test}
            </button>
          }
        />
        {testResult && (
          <p
            role="status"
            className={cn(
              "rounded-lg border p-3 text-xs",
              testResult.ok ? "border-nutrition/30 bg-nutrition/10 text-nutrition" : "border-destructive/30 bg-destructive/10 text-destructive"
            )}
          >
            {testResult.message}
          </p>
        )}
      </SettingsCard>

      <SettingsCard title={t.closedAppTitle} description={t.closedAppDescription}>
        <SettingRow
          htmlFor="closed-app-switch"
          title={t.closedAppTitle}
          description={
            <span aria-live="polite">
              {pushState === "unsupported"
                ? t.closedAppUnsupported
                : pushState === "not_configured"
                  ? t.closedAppNotConfigured
                  : !enabled
                    ? t.closedAppRemindersOff
                    : subscribed
                      ? t.closedAppOn
                      : t.closedAppOff}
            </span>
          }
          action={
            <Switch
              id="closed-app-switch"
              checked={subscribed && pushState === "ready"}
              disabled={pushState !== "ready" || pushBusy || !enabled || permission === "denied"}
              onCheckedChange={(next) => void togglePush(next)}
            />
          }
        />
        {pushError && (
          <p role="status" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {pushError}
          </p>
        )}
        {pushState === "ready" && (
          <>
            <SettingsDivider />
            <SettingRow
              title={t.devicesTitle}
              description={
                <>
                  {status && status.devices > 0 ? plural(t.devicesCount, status.devices) : t.devicesNone}{" "}
                  {status?.lastDeliveredAt ? formatMessage(t.lastDelivered, { time: formatWhen(status.lastDeliveredAt) }) : t.neverDelivered}
                  {status?.lastFailureAt ? ` ${formatMessage(t.lastFailure, { time: formatWhen(status.lastFailureAt) })}` : null}
                </>
              }
            />
            <SettingsDivider />
            <SettingRow
              title={t.serverTest}
              description={t.serverTestDescription}
              action={
                <button type="button" onClick={() => void sendServerTest()} className={settingsButtonClass()}>
                  <Send className="h-4 w-4" />
                  {t.serverTestButton}
                </button>
              }
            />
            {serverTest && (
              <p
                role="status"
                className={cn(
                  "rounded-lg border p-3 text-xs",
                  serverTest.ok ? "border-nutrition/30 bg-nutrition/10 text-nutrition" : "border-destructive/30 bg-destructive/10 text-destructive"
                )}
              >
                {serverTest.message}
              </p>
            )}
          </>
        )}
      </SettingsCard>

      <SettingsCard>
        <button
          type="button"
          onClick={() => setShowDiagnostics((v) => !v)}
          aria-expanded={showDiagnostics}
          aria-controls="reminder-diagnostics"
          className="flex w-full items-center justify-between text-left text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {t.troubleshoot}
          <ChevronDown className={cn("h-4 w-4 transition-transform", showDiagnostics && "rotate-180")} aria-hidden />
        </button>

        {showDiagnostics && (
          <div id="reminder-diagnostics" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">{t.browserPermission}</p>
                <p className={cn("mt-1 text-sm font-semibold capitalize", permission === "granted" ? "text-nutrition" : blocked ? "text-destructive" : "text-exercise")}>
                  {t.permissionStates[permission]}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">{t.serviceWorker}</p>
                <p className={cn("mt-1 text-sm font-semibold", swRegistered ? "text-nutrition" : "text-exercise")}>
                  {swRegistered === null ? t.checking : swRegistered ? t.registered : t.notRegistered}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t.diagnosticsFootnote}</p>
          </div>
        )}
      </SettingsCard>
    </>
  )
}
