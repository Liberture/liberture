"use client"

import Link from "next/link"
import { Search } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { articleTags } from "@/lib/article-tags"
import { useTranslations } from "@/components/i18n/locale-provider"

type Entry = { slug: string; title: string; tags: string }

export function DirectorySearch({ entries, initialQuery = "", pillar, sort, section = "articles", label, placeholder }: {
  entries: Entry[]; initialQuery?: string; pillar?: string; sort?: string; section?: string; label?: string; placeholder?: string
}) {
  const { articleReader: copy } = useTranslations().habits.app
  const inputId = useId()
  const searchLabel = placeholder ?? copy.search
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [term, setTerm] = useState("")
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(-1)
  const normalized = query.trim().toLowerCase()

  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(normalized), 220)
    return () => window.clearTimeout(timer)
  }, [normalized])

  const ready = focused && term && term === normalized
  const topics = ready ? [...new Set(entries.flatMap(entry => articleTags(entry.tags)).map(tag => tag.toLowerCase()))]
    .filter(tag => tag.includes(term)).sort().slice(0, 4) : []
  const articles = ready ? entries.filter(entry => entry.title.toLowerCase().includes(term)).slice(0, 5) : []
  function resultsUrl(value: string) {
    const params = new URLSearchParams()
    if (value.trim()) params.set("q", value.trim())
    if (pillar) params.set("pillar", pillar)
    if (sort) params.set("sort", sort)
    return "/" + section + "?" + params
  }
  const groups = [
    { label: copy.topics, items: topics.map(tag => ({ name: tag, href: resultsUrl(tag) })) },
    { label: label ?? copy.articles, items: articles.map(entry => ({ name: entry.title, href: "/" + section + "/" + entry.slug })) },
  ]
  const items = groups.flatMap(group => group.items)
  const open = items.length > 0
  return <form action={"/" + section} role="search" className="relative" onSubmit={event => {
    event.preventDefault()
    router.push(open && items[active] ? items[active].href : resultsUrl(query))
    setFocused(false)
  }}>
    <label htmlFor={inputId} className="sr-only">{searchLabel}</label>
    {sort && <input type="hidden" name="sort" value={sort} />}
    {pillar && <input type="hidden" name="pillar" value={pillar} />}
    <div className="relative">
      <Input id={inputId} name="q" type="search" role="combobox" autoComplete="off"
        aria-expanded={open} aria-autocomplete="list" aria-controls={open ? (inputId + "-suggestions") : undefined}
        aria-activedescendant={open && items[active] ? inputId + "-option-" + active : undefined}
        value={query} placeholder={placeholder ?? copy.searchPlaceholder} className="pr-10"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onChange={e => { setQuery(e.target.value); setActive(-1); setFocused(true) }}
        onKeyDown={e => {
          if (e.key === "Escape") { setFocused(false); setActive(-1) }
          if (open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault()
            const index = e.key === "ArrowDown" ? (active + 1) % items.length : active <= 0 ? items.length - 1 : active - 1
            setActive(index)
            document.getElementById(inputId + "-option-" + index)?.scrollIntoView({ block: "nearest" })
          }
        }} />
      <Button type="submit" size="icon" variant="ghost" className="absolute inset-y-0 right-0 size-9" aria-label={searchLabel}
        onClick={() => setActive(-1)}><Search aria-hidden /></Button>
    </div>
    {open && <div id={inputId + "-suggestions"} role="listbox" aria-label={searchLabel} className="lb-dropdown absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto p-1">
      {groups.map(group => group.items.length > 0 && <div key={group.label} role="group" aria-label={group.label}>
        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{group.label}</div>
        {group.items.map(item => {
          const index = items.indexOf(item)
          return <Link key={item.href} id={inputId + "-option-" + index} role="option" aria-selected={active === index}
            href={item.href} prefetch={false} tabIndex={-1} onMouseDown={e => e.preventDefault()}
            className="block rounded px-2 py-1.5 text-sm hover:bg-secondary aria-selected:bg-secondary">{item.name}</Link>
        })}
      </div>)}
    </div>}
  </form>
}
