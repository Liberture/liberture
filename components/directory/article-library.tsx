"use client"

import { useEffect, useRef, useState, type ComponentProps } from "react"
import { ArrowUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { DirectoryGrid } from "./layout"
import { ArticleCard } from "./article-card"
import { ArticleSearch } from "./article-search"
import { useTranslations } from "@/components/i18n/locale-provider"
import { FieldOption, FieldSelect } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PILLAR_IDS } from "@/lib/habits/pillars"
import { profilePillars } from "@/lib/pillars"
import { articleTags } from "@/lib/article-tags"

export function ArticleLibrary({ articles, query, pillar, sort }: {
  articles: ComponentProps<typeof ArticleCard>["article"][]; query: string; pillar: string; sort: string
}) {
  const router = useRouter()
  const { articleReader: copy, pillarTag } = useTranslations().habits.app
  const selected = profilePillars(pillar)[0]
  const term = query.trim().toLowerCase()
  const filtered = articles.filter(article => (!selected || profilePillars(article.pillar).includes(selected))
    && [article.title, article.description, ...articleTags(article.tags)].some(value => value.toLowerCase().includes(term)))
  const [limit, setLimit] = useState(20)
  const next = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!next.current || !("IntersectionObserver" in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLimit(count => count + 20)
    }, { rootMargin: "250px" })
    observer.observe(next.current)
    return () => observer.disconnect()
  }, [limit, filtered.length])

  function updateFilters(nextPillar: string | undefined, nextSort: string) {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (nextPillar && nextPillar !== "all") params.set("pillar", nextPillar)
    if (nextSort !== "newest") params.set("sort", nextSort)
    router.push("/articles?" + params, { scroll: false })
  }

  return <>
    <div className="mx-auto mb-6 grid w-full max-w-3xl items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
      <ArticleSearch entries={articles} initialQuery={query} pillar={selected} sort={sort} />
      <div className="w-fit">
        <FieldSelect aria-label={copy.categories} value={selected ?? "all"} onValueChange={value => updateFilters(value, sort)}>
          <FieldOption value="all">{copy.all}</FieldOption>
          {PILLAR_IDS.map(id => <FieldOption key={id} value={id}>{pillarTag.pillars[id]}</FieldOption>)}
        </FieldSelect>
      </div>
    </div>
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="font-semibold">{copy.articles} ({filtered.length})</h2>
      <FieldSelect aria-label={copy.order} prefix={<ArrowUpDown aria-hidden className="size-4" />} value={sort}
        onValueChange={value => updateFilters(selected, value)}>
        <FieldOption value="newest">{copy.newest}</FieldOption>
        <FieldOption value="oldest">{copy.oldest}</FieldOption>
        <FieldOption value="title">{copy.titleOrder}</FieldOption>
      </FieldSelect>
    </div>
    <DirectoryGrid>{filtered.slice(0, limit).map(article => <ArticleCard key={article.slug} article={article} />)}</DirectoryGrid>
    {!filtered.length && <p>{copy.empty}</p>}
    {limit < filtered.length && <Button variant="secondary" ref={next} onClick={() => setLimit(limit + 20)} className="mx-auto mt-6 flex">{copy.more}</Button>}
  </>
}
