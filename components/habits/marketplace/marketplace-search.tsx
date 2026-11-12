"use client"

import { useEffect, useId, useState } from "react"
import { Search, X } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { Avatar } from "@/components/habits/account-header"
import { CATALOG_AUTHORS, CATALOG_PROTOCOLS } from "@/lib/habits/protocols/catalog"
import type { Author } from "@/lib/habits/protocols/authors"
import { cn } from "@/lib/utils"

interface SearchProps {
  query: string
  onQuery: (query: string) => void
  onAuthor: (author: string) => void
  onProtocol: (slug: string) => void
}

export function MarketplaceSearch({ query, onQuery, onAuthor, onProtocol }: SearchProps) {
  const t = useTranslations().habits.app.marketplaceView
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  const [active, setActive] = useState(-1)
  const term = query.trim().toLocaleLowerCase()
  const open = expanded && Boolean(term)
  const authors = CATALOG_AUTHORS.filter(author => author.name.toLocaleLowerCase().includes(term))
    .map(author => ({ kind: "author" as const, key: author.id, name: author.name }))
  const protocols = CATALOG_PROTOCOLS.filter(protocol => protocol.searchText.includes(term))
    .sort((a, b) => Number(b.name.toLowerCase().includes(term)) - Number(a.name.toLowerCase().includes(term)))
    .map(protocol => ({ kind: "protocol" as const, key: protocol.slug, name: protocol.name }))
  const matches = [...authors, ...protocols]

  useEffect(() => {
    if (open && active >= 0) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" })
  }, [active, open, id])

  const choose = (match: typeof matches[number]) => {
    setExpanded(false)
    setActive(-1)
    if (match.kind === "author") onAuthor(match.key)
    else onProtocol(match.key)
  }

  return (
    <div data-no-swipe className="relative mx-auto w-full md:w-3/4 lg:w-1/2">
      <Search aria-hidden className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
      <input type="search" role="combobox" aria-label={t.searchAria} placeholder={t.searchPlaceholder}
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
          } else if (open && event.key === "Enter" && matches[active]) {
            event.preventDefault()
            choose(matches[active])
          }
        }}
        className="h-10 w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
      {open && (
        <div className="lb-dropdown absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto p-1">
          <div id={id} role="listbox" aria-label={t.searchAria}>
            {[{ label: t.authors, items: authors, offset: 0 }, { label: t.protocols, items: protocols, offset: authors.length }].map(group => group.items.length > 0 && (
              <div key={group.label} role="group" aria-label={group.label}>
                <div aria-hidden className="px-2 py-1 text-xs font-semibold text-muted-foreground">{group.label}</div>
                {group.items.map((match, i) => (
                  <div key={match.key} id={`${id}-${group.offset+i}`} role="option" aria-selected={active === group.offset+i}
                    onMouseDown={event => event.preventDefault()} onClick={() => choose(match)}
                    className={cn("cursor-pointer rounded-md px-2 py-2 text-sm hover:bg-primary/15", active === group.offset+i && "bg-primary/15")}>
                    {match.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {!matches.length && <p role="status" className="p-2 text-sm text-muted-foreground">{t.noSuggestions}</p>}
        </div>
      )}
    </div>
  )
}

const localPortraits = new Set(["andrew-huberman", "andy-galpin", "david-sinclair", "james-clear", "kelly-starrett", "matthew-walker", "morgan-housel", "peter-attia", "ramit-sethi", "rhonda-patrick", "tim-ferriss", "wim-hof"])

export function AuthorSummary({ author, onRemove }: { author: Author; onRemove: () => void }) {
  const t = useTranslations().habits.app.marketplaceView
  const localImage = localPortraits.has(author.id) ? `/examples/portraits/${author.id}-portrait.jpg` : null
  const [image, setImage] = useState<string | null>(localImage)
  useEffect(() => {
    if (localImage) return
    const controller = new AbortController()
    fetch(`/api/people/${encodeURIComponent(author.id)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(person => { if (person?.imageUrl) setImage(person.imageUrl) })
      .catch(() => {})
    return () => controller.abort()
  }, [author.id, localImage])
  return (
    <aside className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <Avatar src={image} name={author.name} size={52} />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground">{author.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{author.bio}</p>
      </div>
      <button type="button" aria-label={t.removeAuthor} title={t.removeAuthor} onClick={onRemove}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring">
        <X aria-hidden className="size-4" />
      </button>
    </aside>
  )
}
