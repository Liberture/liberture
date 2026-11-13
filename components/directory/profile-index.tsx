import { directoryPrisma as prisma } from "@/lib/i18n/directory-records.server"
import { getSiteMessages } from "@/lib/i18n/messages.server"
import { profileSection } from "@/lib/directory/profile-path"
import { DirectoryLayout, DirectoryHeader } from "./layout"
import { DirectoryLibrary, type ListingPageProps } from "./directory-library"

export type ProfileIndexProps = ListingPageProps

export async function ProfileIndex({ kind, searchParams }: ProfileIndexProps & { kind: "organization" | "project" }) {
  const section = profileSection(kind)
  const t = (await getSiteMessages()).habits.app.directoryProfiles
  const params = await searchParams
  const rows = await prisma.organization.findMany({
    where: { directoryKind: kind },
    select: { slug: true, directoryKind: true, name: true, description: true, type: true, imageUrl: true, pillars: true, founded: true, featured: true },
    orderBy: params.sort === "title" ? [{ name: "asc" }, { slug: "asc" }] : [{ featured: "desc" }, { name: "asc" }, { slug: "asc" }],
  })
  return <DirectoryLayout>
    <DirectoryHeader title={t[section]} description={kind === "project" ? t.projectsIntro : t.organizationsIntro} />
    <DirectoryLibrary catalog={{ section, rows }} params={params} />
  </DirectoryLayout>
}
