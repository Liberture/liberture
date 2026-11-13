import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getDictionary } from "@/lib/habits/i18n"
import { profileSection } from "@/lib/directory/profile-path"
import { DirectoryLayout, DirectoryHeader, DirectoryGrid } from "./layout"
import { OrganizationCard } from "./org-card"

export type ProfileIndexProps = { searchParams: Promise<{ page?: string }> }

export async function ProfileIndex({ kind, searchParams }: ProfileIndexProps & { kind: "organization" | "project" }) {
  const section = profileSection(kind)
  const t = getDictionary(await getRequestLocale()).app.directoryProfiles
  const requested = Number((await searchParams).page)
  const where = { directoryKind: kind }
  const count = await prisma.organization.count({ where })
  const pages = Math.max(1, Math.ceil(count / 20))
  const page = Number.isSafeInteger(requested) ? Math.min(Math.max(1, requested), pages) : 1
  const rows = await prisma.organization.findMany({ where, orderBy: [{ featured: "desc" }, { name: "asc" }, { id: "asc" }], skip: (page - 1) * 20, take: 20 })
  return <DirectoryLayout>
    <DirectoryHeader title={t[section]} description={kind === "project" ? t.projectsIntro : t.organizationsIntro} />
    <DirectoryGrid>{rows.map(org => <OrganizationCard key={org.id} org={org} />)}</DirectoryGrid>
    {pages > 1 && <nav className="mt-8 flex justify-center gap-6">
      {page > 1 && <Link href={`/${section}?page=${page - 1}`}>{t.previous}</Link>}
      <span>{page} / {pages}</span>
      {page < pages && <Link href={`/${section}?page=${page + 1}`}>{t.next}</Link>}
    </nav>}
  </DirectoryLayout>
}
