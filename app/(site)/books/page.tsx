import { publicPageMetadata } from "@/lib/seo/public-page-metadata"
export function generateMetadata() {
  return publicPageMetadata("/books", "books")
}

import { DirectoryLayout, DirectoryHeader } from "@/components/directory/layout"
import { DirectoryLibrary, type ListingPageProps } from "@/components/directory/directory-library"
import { getSiteMessages } from "@/lib/i18n/messages.server"
import { directoryPrisma as prisma } from "@/lib/i18n/directory-records.server"


export default async function BooksPage({ searchParams }: ListingPageProps) {
  const params = await searchParams
  const rows = await prisma.book.findMany({
      select: { slug: true, title: true, author: true, description: true, pillars: true, rating: true, year: true, featured: true, pages: true, imageUrl: true, Person: { select: { slug: true, name: true } } },
      orderBy: params.sort === "title" ? [{ title: "asc" }, { slug: "asc" }]
        : params.sort === "year" ? [{ year: { sort: "desc", nulls: "last" } }, { title: "asc" }, { slug: "asc" }]
        : params.sort === "rating" ? [{ rating: { sort: "desc", nulls: "last" } }, { title: "asc" }, { slug: "asc" }]
        : [{ featured: "desc" }, { rating: { sort: "desc", nulls: "last" } }, { title: "asc" }, { slug: "asc" }],
    })
  const copy = (await getSiteMessages()).habits.app.directoryListing
  return <DirectoryLayout>
    <DirectoryHeader title={copy.books} description={copy.booksIntro} />
    <DirectoryLibrary catalog={{ section: "books", rows }} params={params} />
  </DirectoryLayout>
}
