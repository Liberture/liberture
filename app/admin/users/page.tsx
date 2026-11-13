import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { identity } from "@/lib/identity/server"
import { managedAuthEnabled } from "@/lib/identity/config"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { Input } from "@/components/ui/input"
import { ManageUser, CreateUser } from "./user-controls"

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  if (!managedAuthEnabled()) notFound()
  const requestHeaders = await headers()
  const session = await identity().api.getSession({ headers: requestHeaders })
  if (session?.user.role !== "admin" || session.session.impersonatedBy) redirect("/")
  const t = getDictionary(await getRequestLocale()).app.adminUsers
  const params = await searchParams
  const q = (params.q ?? "").trim().slice(0, 128)
  const page = Math.max(1, Math.min(100000, parseInt(params.page ?? "1", 10) || 1))
  const limit = 25
  const { users, total } = await identity().api.listUsers({ headers: requestHeaders, query: {
    searchField: "name", searchOperator: "contains", searchValue: q || undefined, limit, offset: (page - 1) * limit,
    sortBy: "createdAt", sortDirection: "desc",
  } })
  const nostrAccounts = await prisma.authAccount.findMany({
    where: { providerId: "nostr", userId: { in: [session.user.id, ...users.map(user => user.id)] } },
    select: { userId: true },
  })
  const nostrUsers = new Set(nostrAccounts.map(account => account.userId))
  const href = (n: number) => "?" + new URLSearchParams({ q, page: String(n) })
  return <div className="mx-auto w-full max-w-5xl space-y-5 p-6">
    <Link href="/admin" className="text-sm text-muted-foreground">{t.back}</Link>
    <header className="flex items-center justify-between"><h1 className="text-2xl font-semibold">{t.users} ({total})</h1><CreateUser /></header>
    <form className="flex max-w-lg gap-2"><Input type="search" name="q" defaultValue={q} placeholder={t.search} aria-label={t.search} /><Button>{t.find}</Button></form>
    <ul className="divide-y rounded-lg border bg-card px-4">
      {users.map(user => <li key={user.id} className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0"><p className="break-words font-medium">{user.name}</p><p className="text-sm text-muted-foreground">{user.role === "admin" ? t.admin : t.user} · {user.banned ? t.banned : t.active}</p></div>
        <ManageUser user={{ id: user.id, name: user.name, role: user.role ?? "user", banned: !!user.banned }} self={user.id === session.user.id} canImpersonate={nostrUsers.has(user.id) && nostrUsers.has(session.user.id)} />
      </li>)}
    </ul>
    {!users.length && <p>{t.empty}</p>}
    <nav className="flex gap-4">{page > 1 && <Link href={href(page - 1)}>{t.previous}</Link>}{page * limit < total && <Link href={href(page + 1)}>{t.next}</Link>}</nav>
  </div>
}
