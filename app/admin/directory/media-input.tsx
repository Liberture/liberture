"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { useTranslations } from "@/components/i18n/locale-provider"

export function MediaInput({ id, value, onChange, preview = false }: { id: string; value: string; onChange: (value: string) => void; preview?: boolean }) {
  const t = useTranslations().habits.app.directoryEditor
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  return <div className="space-y-3">
    <Input id={id} value={value} onChange={event => onChange(event.target.value)} />
    {value && <img src={value} alt="" className="max-h-40 rounded-lg object-contain" />}
    <label className="block text-sm">{busy ? t.uploadingImage : t.uploadImage}
      <Input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async event => {
        const file = event.target.files?.[0]
        if (!file) return
        setBusy(true); setError(false)
        try {
          if (file.size > 10 * 1024 * 1024) throw new Error("size")
          const response = await fetch(`/api/admin/media${preview ? "?variant=preview" : ""}`, { method: "POST", headers: { "Content-Type": file.type }, body: file })
          if (!response.ok) throw new Error("upload")
          const { url } = await response.json()
          onChange(url)
        } catch { setError(true) } finally { setBusy(false); event.target.value = "" }
      }} />
    </label>
    {error && <p role="alert" className="text-sm text-destructive">{t.uploadFailed}</p>}
  </div>
}
