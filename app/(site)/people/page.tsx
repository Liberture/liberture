import { publicPageMetadata } from "@/lib/seo/public-page-metadata"
export function generateMetadata() {
  return publicPageMetadata("/people", "people")
}

import { DirectoryLayout, DirectoryHeader } from "@/components/directory/layout"
import { DirectoryLibrary, type ListingPageProps } from "@/components/directory/directory-library"
import { getSiteMessages } from "@/lib/i18n/messages.server"
import { directoryPrisma as prisma } from "@/lib/i18n/directory-records.server"


export default async function PeoplePage({ searchParams }: ListingPageProps) {
  const params = await searchParams
  const rows = await prisma.person.findMany({
      select: { slug: true, name: true, title: true, expertise: true, bio: true, summary: true, imageUrl: true, pillars: true, featured: true },
      orderBy: params.sort === "title" ? [{ name: "asc" }, { slug: "asc" }] : [{ featured: "desc" }, { name: "asc" }, { slug: "asc" }],
    })
  const copy = (await getSiteMessages()).habits.app.directoryListing
  return <DirectoryLayout>
    <DirectoryHeader title={copy.people} description={copy.peopleIntro} />
    <DirectoryLibrary catalog={{ section: "people", rows }} params={params} />
  </DirectoryLayout>
}
