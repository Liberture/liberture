"use client"

import { useEffect, useState } from "react"
import { Bell, BellRing, ChevronDown } from "lucide-react"

import { SettingRow, SettingsCard, SettingsDivider, settingsButtonClass } from "@/components/habits/settings/settings-ui"
import { Switch } from "@/components/habits/ui/switch"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"

type Permission = NotificationPermission | "unsupported"

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
