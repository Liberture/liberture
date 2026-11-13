import type { Metadata } from "next"
import { DirectoryHeader, DirectoryLayout } from "@/components/directory/layout"
import { ArticleLibrary } from "@/components/directory/article-library"
import { prisma } from "@/lib/prisma"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"

export const metadata: Metadata = {
  title: "Articles | Biohacking Directory | Liberture",
  description: "Research articles and practical guides across the six Liberture pillars.",
  alternates: { canonical: "/articles" },
}

export default async function ArticlesPage({ searchParams }: {
  searchParams: Promise<{ q?: string; pillar?: string; sort?: string }>
}) {
  const params = await searchParams
  const sort = params.sort === "oldest" || params.sort === "title" ? params.sort : "newest"
  const [locale, articles] = await Promise.all([
    getRequestLocale(),
    prisma.article.findMany({
      orderBy: [sort === "title" ? { title: "asc" } : { publishedAt: sort === "oldest" ? "asc" : "desc" }, { slug: "asc" }],
      select: { slug: true, title: true, description: true, author: true, readTime: true, pillar: true, tags: true },
    }),
  ])
  const copy = getDictionary(locale).app.articleReader
  return <DirectoryLayout>
    <DirectoryHeader title={copy.articles} description={copy.description} />
    <ArticleLibrary key={JSON.stringify(params)} articles={articles} sort={sort} query={params.q ?? ""} pillar={params.pillar ?? ""} />
  </DirectoryLayout>
}
