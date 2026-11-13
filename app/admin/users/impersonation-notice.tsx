"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/locale-provider"
import { userAdmin } from "./client"

export function ImpersonationNotice({ name }: { name: string }) {
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const t = useTranslations().habits.app.adminUsers
  async function stop() {
    setBusy(true)
    try {
      const result = await userAdmin.admin.stopImpersonating()
      if (result.error) throw Error()
      location.assign("/admin/users")
    } catch { setError(true); setBusy(false) }
  }
  return <aside className="fixed bottom-3 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-lg border border-amber-400 bg-card px-4 py-2 text-sm shadow-lg">
    <span>{t.acting} <strong>{name}</strong></span>
    <Button disabled={busy} onClick={stop}>{t.exit}</Button>
    {error && <span role="alert">{t.unavailable}</span>}
  </aside>
}
