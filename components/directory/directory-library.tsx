"use client"

import type { ComponentProps } from "react"
import { ArrowUpDown } from "lucide-react"
import { useLocalizedHref } from "@/components/i18n/localized-link"
import { useRouter } from "next/navigation"
import { useTranslations } from "@/components/i18n/locale-provider"
import { FieldOption, FieldSelect } from "@/components/ui/select"
import { PersonCard } from "@/components/people/person-card"
import { PILLAR_IDS } from "@/lib/habits/pillars"
import { profilePillars } from "@/lib/pillars"
import { articleTags } from "@/lib/article-tags"
import { DirectorySearch } from "./directory-search"
import { InfiniteGrid } from "./infinite-grid"
import { ArticleCard } from "./article-card"
import { BookCard } from "./book-card"
import { OrganizationCard } from "./org-card"

type Catalog =
  | { section: "articles"; rows: ComponentProps<typeof ArticleCard>["article"][] }
  | { section: "books"; rows: ComponentProps<typeof BookCard>["book"][] }
  | { section: "people"; rows: (ComponentProps<typeof PersonCard>["person"] & { expertise: string })[] }
  | { section: "projects" | "organizations"; rows: ComponentProps<typeof OrganizationCard>["org"][] }

export type ListingParams = { q?: string; pillar?: string; sort?: string; page?: string }
export type ListingPageProps = { searchParams: Promise<ListingParams> }

export function DirectoryLibrary({ catalog, params }: { catalog: Catalog; params: ListingParams }) {
  const router = useRouter()
  const localize = useLocalizedHref()
  const { directoryListing: text, articleReader, directoryProfiles, pillarTag, protocolCard } = useTranslations().habits.app
  const { section } = catalog
  const title = section === "articles" ? articleReader.articles : section === "books" || section === "people" ? text[section] : directoryProfiles[section]
  const placeholder = section === "articles" ? articleReader.searchPlaceholder : text[`${section}Search`]
  const entries = (() => {
    switch (catalog.section) {
      case "articles": return catalog.rows.map(article => ({ slug: article.slug, title: article.title, tags: article.tags, pillars: article.pillar, terms: [article.description, article.author], card: <ArticleCard key={article.slug} article={article} /> }))
      case "books": return catalog.rows.map(book => ({ slug: book.slug, title: book.title, tags: book.pillars, pillars: book.pillars, terms: [book.author, book.Person?.name ?? "", book.description], card: <BookCard key={book.slug} book={book} /> }))
      case "people": return catalog.rows.map(person => ({ slug: person.slug, title: person.name, tags: person.pillars, pillars: person.pillars, terms: [person.title, person.expertise, person.summary || person.bio], card: <PersonCard key={person.slug} person={person} featuredLabel={protocolCard.featured} /> }))
      default: return catalog.rows.map(org => ({ slug: org.slug, title: org.name, tags: org.pillars, pillars: org.pillars, terms: [org.type, org.description], card: <OrganizationCard key={org.slug} org={org} /> }))
    }
  })()
  const selected = profilePillars(params.pillar ?? "")[0]
  const query = params.q?.trim() ?? ""
  const needle = query.toLocaleLowerCase()
  const filtered = entries.filter(item => (!selected || profilePillars(item.pillars).includes(selected))
    && [item.title, ...item.terms, ...articleTags(item.tags)].some(value => value.toLocaleLowerCase().includes(needle)))
  const options = section === "articles" ? [["newest", articleReader.newest], ["oldest", articleReader.oldest], ["title", articleReader.titleOrder]]
    : [["featured", text.featured], ["title", section === "books" ? articleReader.titleOrder : text.name], ...(section === "books" ? [["rating", text.rating], ["year", text.newestBooks]] : [])]
  const sort = options.find(([id]) => id === params.sort)?.[0] ?? options[0][0]

  function update(pillar: string, order: string) {
    const search = new URLSearchParams()
    if (query) search.set("q", query)
    if (pillar !== "all") search.set("pillar", pillar)
    if (order !== options[0][0]) search.set("sort", order)
    router.push(localize(`/${section}?${search}`), { scroll: false })
  }

  const page = Number(params.page)
  const initialLimit = Number.isSafeInteger(page) && page > 1 ? Math.min(filtered.length, page * 20) : 20
  return <>
    <div className="mx-auto mb-6 grid w-full max-w-3xl items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
      <DirectorySearch key={query} entries={entries} initialQuery={query} section={section} label={title} placeholder={placeholder} pillar={selected} sort={sort} />
      <div className="w-fit"><FieldSelect aria-label={articleReader.categories} value={selected ?? "all"} onValueChange={value => update(value, sort)}>
        <FieldOption value="all">{articleReader.all}</FieldOption>
        {PILLAR_IDS.map(id => <FieldOption key={id} value={id}>{pillarTag.pillars[id]}</FieldOption>)}
      </FieldSelect></div>
    </div>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="whitespace-nowrap font-semibold">{title} ({filtered.length})</h2>
      <FieldSelect className="ml-auto w-fit max-w-full" aria-label={text.order} prefix={<ArrowUpDown aria-hidden className="size-4" />} value={sort}
        onValueChange={value => update(selected ?? "all", value)}>
        {options.map(([id, label]) => <FieldOption key={id} value={id}>{label}</FieldOption>)}
      </FieldSelect>
    </div>
    <InfiniteGrid key={JSON.stringify(params)} items={filtered} renderItem={item => item.card} initialLimit={initialLimit} />
    {!filtered.length && <p>{text.empty}</p>}
  </>
}
