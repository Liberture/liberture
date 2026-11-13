"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppDialog } from "@/components/habits/ui/app-dialog"
import { ConfirmDialog } from "@/components/habits/todos/confirm-dialog"
import { useTranslations } from "@/components/i18n/locale-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { provisionNostrUser } from "./actions"
import { userAdmin } from "./client"

export function CreateUser() {
  const t = useTranslations().habits.app.adminUsers
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  async function create(data: FormData) {
    setBusy(true)
    try {
      const result = await provisionNostrUser(String(data.get("name")), String(data.get("key")))
      setMessage(t[result])
      if (result === "created") { setOpen(false); router.refresh() }
    } catch { setMessage(t.unavailable) }
    finally { setBusy(false) }
  }
  return <>
    <Button onClick={() => { setMessage(""); setOpen(true) }}>{t.create}</Button>
    <AppDialog open={open} onClose={() => setOpen(false)} title={t.create}>
      <form action={create} className="space-y-4">
        <label className="block">{t.name}<Input name="name" required maxLength={128} /></label>
        <label className="block">{t.pubkey}<Input name="key" required maxLength={128} spellCheck={false} /></label>
        {message && <p role="status">{message}</p>}
        <Button disabled={busy}>{t.create}</Button>
      </form>
    </AppDialog>
  </>
}

type User = { id: string; name: string; role: string; banned: boolean }
type ListedSession = { id: string; token: string; userAgent?: string | null; expiresAt: Date | string }
type Operation = { label: string; run: () => Promise<unknown>; destructive?: boolean; completed?: () => void }

export function ManageUser({ user, self, canImpersonate }: { user: User; self: boolean; canImpersonate: boolean }) {
  const router = useRouter()
  const t = useTranslations().habits.app.adminUsers
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [name, setName] = useState(user.name)
  const [reason, setReason] = useState("")
  const [days, setDays] = useState("")
  const [sessions, setSessions] = useState<ListedSession[] | null>(null)
  const [confirm, setConfirm] = useState<Operation | null>(null)
  const api = userAdmin.admin
  const userId = user.id
  async function loadSessions() {
    setSessions(null)
    try {
      const response = await api.listUserSessions({ userId })
      if (response.error) throw Error()
      setSessions(response.data.sessions)
    } catch { setMessage(t.unavailable) }
  }
  async function execute(action: Operation) {
    setBusy(true)
    setMessage("")
    try {
      const result = await action.run()
      if (!result || typeof result !== "object" || ("error" in result && result.error)) throw Error()
      setMessage(t.updated)
      router.refresh()
      action.completed?.()
    } catch { setMessage(t.unavailable) }
    finally { setBusy(false) }
  }
  const ask = (label: string, run: Operation["run"], completed?: Operation["completed"], destructive?: boolean) =>
    setConfirm({ label, run, completed, destructive })
  return <>
    <Button size="sm" variant="secondary" onClick={() => { setName(user.name); setReason(""); setDays(""); setMessage(""); setOpen(true) }}>{t.manage}</Button>
    <AppDialog open={open && !confirm} onClose={() => setOpen(false)} title={user.name}>
      <Tabs defaultValue="account" onValueChange={tab => { if (tab === "sessions") void loadSessions() }}>
        <TabsList aria-label={t.manage}><TabsTrigger value="account">{t.details}</TabsTrigger><TabsTrigger value="sessions">{t.sessions}</TabsTrigger></TabsList>
        <TabsContent value="account" className="space-y-4">
          <form className="flex items-end gap-2" onSubmit={event => { event.preventDefault(); void execute({ label: t.rename, run: () => api.updateUser({ userId, data: { name: name.trim() } }) }) }}>
            <label className="flex-1">{t.name}<Input required maxLength={128} value={name} onChange={e => setName(e.target.value)} /></label>
            <Button disabled={busy || !name.trim() || name.trim() === user.name}>{t.rename}</Button>
          </form>
          {!self && <div className="flex flex-wrap gap-2">
            <Button disabled={busy} variant="outline" onClick={() => ask(user.role === "admin" ? t.demote : t.promote, () => api.setRole({ userId, role: user.role === "admin" ? "user" : "admin" }))}>{user.role === "admin" ? t.demote : t.promote}</Button>
            {canImpersonate && !user.banned && user.role !== "admin" && <Button disabled={busy} variant="outline" onClick={() => ask(t.impersonate, () => api.impersonateUser({ userId }), () => location.assign("/tracker"))}>{t.impersonate}</Button>}
          </div>}
          {!self && (user.banned
            ? <Button disabled={busy} variant="outline" onClick={() => ask(t.unban, () => api.unbanUser({ userId }))}>{t.unban}</Button>
            : <form className="space-y-2 border-t pt-3" onSubmit={e => { e.preventDefault(); ask(t.ban, () => api.banUser({ userId, banReason: reason.trim() || undefined, banExpiresIn: days ? Number(days) * 86400 : undefined })) }}>
              <label className="block">{t.reason}<Input maxLength={256} value={reason} onChange={e => setReason(e.target.value)} /></label>
              <label className="block">{t.days}<Input type="number" min={1} max={3650} value={days} onChange={e => setDays(e.target.value)} /></label>
              <Button disabled={busy} variant="outline">{t.ban}</Button>
            </form>)}
          {!self && <Button disabled={busy} variant="destructive" onClick={() => ask(t.delete, () => api.removeUser({ userId }), () => setOpen(false), true)}>{t.delete}</Button>}
        </TabsContent>
        <TabsContent value="sessions" className="space-y-3">
          {sessions?.length === 0 && <p>{t.noSessions}</p>}
          {sessions?.map(session => <div key={session.id} className="flex items-center justify-between gap-3 border-b py-2">
            <div className="min-w-0"><p className="break-words text-sm">{session.userAgent || t.unknown}</p>
              <p className="text-xs text-muted-foreground">{t.expires} {new Date(session.expiresAt).toLocaleString()}</p></div>
            <Button disabled={busy} variant="outline" size="sm" onClick={() => ask(t.revoke, () => api.revokeUserSession({ sessionToken: session.token }), loadSessions)}>{t.revoke}</Button>
          </div>)}
          {!!sessions?.length && <Button disabled={busy} variant="outline" onClick={() => ask(t.revokeAll, () => api.revokeUserSessions({ userId }), loadSessions)}>{t.revokeAll}</Button>}
        </TabsContent>
      </Tabs>
      {message && <p className="pt-3 text-sm" role="status">{message}</p>}
    </AppDialog>
    <ConfirmDialog open={!!confirm} title={confirm?.label ?? ""} body={confirm?.destructive ? t.deleteHelp : user.name}
      confirmLabel={t.confirm} onClose={() => setConfirm(null)} onConfirm={() => { if (confirm && !busy) void execute(confirm) }} />
  </>
}
