"use client"

import { useEffect, useRef, useState, type ComponentProps } from "react"
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

export function ArticleLibrary({ articles, query, pillar }: {
  articles: ComponentProps<typeof ArticleCard>["article"][]; query: string; pillar: string
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

  return <>
    <div className="mx-auto mb-6 w-full md:w-3/4 lg:w-1/2">
      <ArticleSearch entries={articles} initialQuery={query} pillar={selected} />
      <div className="mx-auto mt-3 w-fit">
        <FieldSelect aria-label={copy.categories} value={selected ?? "all"} onValueChange={value => {
          const params = new URLSearchParams()
          if (query) params.set("q", query)
          if (value !== "all") params.set("pillar", value)
          router.push("/articles?" + params)
        }}>
          <FieldOption value="all">{copy.all}</FieldOption>
          {PILLAR_IDS.map(id => <FieldOption key={id} value={id}>{pillarTag.pillars[id]}</FieldOption>)}
        </FieldSelect>
      </div>
    </div>
    <h2 className="mb-4 font-semibold">{copy.articles} ({filtered.length})</h2>
    <DirectoryGrid>{filtered.slice(0, limit).map(article => <ArticleCard key={article.slug} article={article} />)}</DirectoryGrid>
    {!filtered.length && <p>{copy.empty}</p>}
    {limit < filtered.length && <Button variant="secondary" ref={next} onClick={() => setLimit(limit + 20)} className="mx-auto mt-6 flex">{copy.more}</Button>}
  </>
}
