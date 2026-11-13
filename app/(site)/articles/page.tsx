import { publicPageMetadata } from "@/lib/seo/public-page-metadata"
export function generateMetadata() {
  return publicPageMetadata("/articles", "articles")
}

import { DirectoryHeader, DirectoryLayout } from "@/components/directory/layout"
import { DirectoryLibrary, type ListingPageProps } from "@/components/directory/directory-library"
import { directoryPrisma as prisma } from "@/lib/i18n/directory-records.server"
import { getSiteMessages } from "@/lib/i18n/messages.server"


export default async function ArticlesPage({ searchParams }: ListingPageProps) {
  const params = await searchParams
  const sort = params.sort === "oldest" || params.sort === "title" ? params.sort : "newest"
  const articles = await prisma.article.findMany({
      orderBy: [sort === "title" ? { title: "asc" } : { publishedAt: sort === "oldest" ? "asc" : "desc" }, { slug: "asc" }],
      select: { slug: true, title: true, description: true, author: true, readTime: true, pillar: true, tags: true },
    })
  const copy = (await getSiteMessages()).habits.app.articleReader
  return <DirectoryLayout>
    <DirectoryHeader title={copy.articles} description={copy.description} />
    <DirectoryLibrary catalog={{ section: "articles", rows: articles }} params={params} />
  </DirectoryLayout>
}
