import type { Metadata } from "next"
import { DirectoryLayout, DirectoryHeader } from "@/components/directory/layout"
import { DirectoryLibrary, type ListingPageProps } from "@/components/directory/directory-library"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Books | Biohacking Directory | Liberture",
  description: "Essential books on biohacking, longevity, and human optimization.",
  alternates: { canonical: "/books" },
}

export default async function BooksPage({ searchParams }: ListingPageProps) {
  const params = await searchParams
  const [locale, rows] = await Promise.all([
    getRequestLocale(),
    prisma.book.findMany({
      select: { slug: true, title: true, author: true, description: true, pillars: true, rating: true, year: true, featured: true, pages: true, imageUrl: true, Person: { select: { slug: true, name: true } } },
      orderBy: params.sort === "title" ? [{ title: "asc" }, { slug: "asc" }]
        : params.sort === "year" ? [{ year: { sort: "desc", nulls: "last" } }, { title: "asc" }, { slug: "asc" }]
        : params.sort === "rating" ? [{ rating: { sort: "desc", nulls: "last" } }, { title: "asc" }, { slug: "asc" }]
        : [{ featured: "desc" }, { rating: { sort: "desc", nulls: "last" } }, { title: "asc" }, { slug: "asc" }],
    }),
  ])
  const copy = getDictionary(locale).app.directoryListing
  return <DirectoryLayout>
    <DirectoryHeader title={copy.books} description={copy.booksIntro} />
    <DirectoryLibrary catalog={{ section: "books", rows }} params={params} />
  </DirectoryLayout>
}
