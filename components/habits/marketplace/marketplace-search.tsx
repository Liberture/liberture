"use client"

import { HelpTooltip } from "@/components/ui/tooltip"
import { useEffect, useId, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { PillarTag } from "./pillar-tag"
import { filterProtocols, DEFAULT_FILTER } from "@/lib/habits/protocols/filter"
import { CATALOG_AUTHORS, CATALOG_PROTOCOLS } from "@/lib/habits/protocols/catalog"
import type { Author } from "@/lib/habits/protocols/authors"
import { cn } from "@/lib/utils"

interface SearchProps {
  className?: string
  catalog: typeof CATALOG_PROTOCOLS
  author?: Author
  onRemoveAuthor: () => void
  onSearch: () => void
  query: string
  onQuery: (query: string) => void
  onAuthor: (author: string) => void
  onProtocol: (slug: string) => void
}

export function MarketplaceSearch({ className, catalog, query, onQuery, onAuthor, onProtocol, author, onSearch, onRemoveAuthor }: SearchProps) {
  const t = useTranslations().habits.app.marketplaceView
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [active, setActive] = useState(-1)
  const term = query.trim().toLocaleLowerCase()
  const open = expanded && Boolean(term)
  const authors = CATALOG_AUTHORS.filter(author => author.name.toLocaleLowerCase().includes(term) && catalog.some(p => p.author?.id === author.id || p.coAuthors.some(a => a.id === author.id)))
    .map(author => ({ kind: "author" as const, key: author.id, name: author.name }))
  const protocols = filterProtocols(catalog, { ...DEFAULT_FILTER, authorId: author?.id ?? "all", query: term })
    .sort((a, b) => Number(b.name.toLowerCase().includes(term)) - Number(a.name.toLowerCase().includes(term)))
    .map(protocol => ({ kind: "protocol" as const, key: protocol.slug, name: protocol.name, pillar: protocol.pillar }))
  const matches = [{ kind: "search" as const, key: "submit", name: t.showResults }, ...authors, ...protocols]

  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" })
  }, [active, open, id])

  const choose = (match: typeof matches[number]) => {
    setExpanded(false)
    setActive(-1)
    if (match.kind === "author") onAuthor(match.key)
    else if (match.kind === "protocol") onProtocol(match.key)
    else onSearch()
  }

  return (
    <div data-no-swipe className={cn("mx-auto w-full space-y-2", className)}>
      <div className="relative">
        <div className="flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <input ref={input} type="search" role="combobox" aria-label={t.searchAria} placeholder={t.searchPlaceholder}
            aria-autocomplete="list" aria-expanded={open} aria-controls={open ? id : undefined}
            aria-activedescendant={open && matches[active] ? `${id}-${active}` : undefined}
            autoComplete="off" value={query}
            onChange={event => { onQuery(event.target.value); setExpanded(true); setActive(-1) }}
            onBlur={() => setExpanded(false)} onFocus={() => setExpanded(true)} onClick={() => setExpanded(true)}
            onKeyDown={event => {
              if (event.nativeEvent.isComposing) return
              if (event.key === "Escape" && open) {
                event.preventDefault()
                setExpanded(false)
              } else if (term && matches.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
                event.preventDefault()
                setExpanded(true)
                setActive(i => event.key === "ArrowDown" ? (i + 1) % matches.length : (i <= 0 ? matches.length - 1 : i - 1))
              } else if (event.key === "Enter") {
                event.preventDefault()
                choose((open && matches[active]) || matches[0])
              }
            }}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        {open && (
          <div className="lb-dropdown absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto p-1">
            <div id={id} role="listbox" aria-label={t.searchAria}>
              <div id={`${id}-0`} role="option" aria-selected={active === 0}
                onMouseDown={event => event.preventDefault()} onClick={() => choose(matches[0])}
                className={cn("flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-primary/15", active === 0 && "bg-primary/15")}>
                <Search aria-hidden className="size-4" /> {t.showResults}
              </div>
              {[{ label: t.authors, items: authors, offset: 1 }, { label: t.protocols, items: protocols, offset: 1 + authors.length }].map(group => group.items.length > 0 && (
                <div key={group.label} role="group" aria-label={group.label}>
                  <div aria-hidden className="px-2 py-1 text-xs font-semibold text-muted-foreground">{group.label}</div>
                  {group.items.map((match, i) => (
                    <div key={match.key} id={`${id}-${group.offset+i}`} role="option" aria-selected={active === group.offset+i}
                      onMouseDown={event => event.preventDefault()} onClick={() => choose(match)}
                      className={cn("flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-primary/15", active === group.offset+i && "bg-primary/15")}>
                      <span>{match.name}</span>
                      {match.kind === "protocol" && <PillarTag pillar={match.pillar} className="shrink-0" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {matches.length === 1 && <p role="status" className="p-2 text-sm text-muted-foreground">{t.noSuggestions}</p>}
          </div>
        )}
      </div>
      {author && (
        <span className="inline-flex max-w-full items-center rounded-full bg-primary/15 pl-2 text-xs font-medium text-foreground">
          <span className="truncate">{author.name}</span>
          <HelpTooltip label={t.removeAuthor}><button type="button" aria-label={`${t.removeAuthor} · ${author.name}`}
            onClick={() => { onRemoveAuthor(); input.current?.focus() }}
            className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-secondary focus-visible:ring-2">
            <X aria-hidden className="size-3.5" />
          </button></HelpTooltip>
        </span>
      )}
    </div>
  )
}
