import { redirect } from "next/navigation"
import { getAuthUser, isAdmin } from "@/lib/auth"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default async function Subscribers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await getAuthUser()
  if (!user || !await isAdmin(user.userId)) redirect("/")
  const params = await searchParams
  const q = (params.q ?? "").trim().slice(0, 254)
  const page = Math.max(1, Math.min(100000, parseInt(params.page ?? "1") || 1))
  const t = getDictionary(await getRequestLocale()).app.newsletter
  const rows = await prisma.newsletter.findMany({
    where: { subscribed: true, email: { contains: q, mode: "insensitive" } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (page - 1) * 50, take: 51,
    select: { email: true, id: true },
  })
  const href = (n: number) => "?" + new URLSearchParams({ q, page: String(n) })
  return <div className="space-y-5">
    <h1 className="text-2xl font-semibold">{t.subscribers}</h1>
    <form className="flex gap-2"><Input type="search" name="q" defaultValue={q} placeholder={t.search} aria-label={t.search} /><Button>{t.find}</Button></form>
    <ul className="divide-y">{rows.slice(0, 50).map(row => <li key={row.id} className="py-2">{row.email}</li>)}</ul>
    {!rows.length && <p>{t.empty}</p>}
    <div className="flex gap-4">{page > 1 && <Link href={href(page-1)}>{t.previous}</Link>}{rows.length > 50 && <Link href={href(page+1)}>{t.next}</Link>}</div>
  </div>
}
