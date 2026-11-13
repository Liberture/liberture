import type { Metadata } from "next"
import { DirectoryLayout, DirectoryHeader } from "@/components/directory/layout"
import { DirectoryLibrary, type ListingPageProps } from "@/components/directory/directory-library"
import { getDictionary } from "@/lib/habits/i18n"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "People | Biohacking Directory | Liberture",
  description: "Explore leading biohackers, researchers, and pioneers in human optimization.",
  alternates: { canonical: "/people" },
}

export default async function PeoplePage({ searchParams }: ListingPageProps) {
  const params = await searchParams
  const [locale, rows] = await Promise.all([
    getRequestLocale(),
    prisma.person.findMany({
      select: { slug: true, name: true, title: true, expertise: true, bio: true, summary: true, imageUrl: true, pillars: true, featured: true },
      orderBy: params.sort === "title" ? [{ name: "asc" }, { slug: "asc" }] : [{ featured: "desc" }, { name: "asc" }, { slug: "asc" }],
    }),
  ])
  const copy = getDictionary(locale).app.directoryListing
  return <DirectoryLayout>
    <DirectoryHeader title={copy.people} description={copy.peopleIntro} />
    <DirectoryLibrary catalog={{ section: "people", rows }} params={params} />
  </DirectoryLayout>
}
