"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { CATALOG_AUTHORS } from "@/lib/habits/protocols/catalog"
import { cn } from "@/lib/utils"

export function AuthorFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTranslations().habits.app.marketplaceView
  const id = useId()
  const [query, setQuery] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  const open = query !== null
  const options = [{ id: "all", name: t.allAuthors }, ...CATALOG_AUTHORS]
  const selected = options.find(option => option.id === value)?.name ?? t.allAuthors
  const matches = options.filter(option => option.name.toLocaleLowerCase().includes((query ?? "").trim().toLocaleLowerCase()))
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" })
  }, [active, open])

  const show = () => {
    setQuery("")
    setActive(Math.max(0, options.findIndex(option => option.id === value)))
  }
  const choose = (authorId: string) => {
    onChange(authorId)
    setQuery(null)
  }

  return (
    <div className="relative col-span-2 min-w-0 sm:col-span-1">
      <input
        ref={input}
        role="combobox"
        aria-label={t.authorAria}
        aria-controls={id}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-activedescendant={open && matches[active] ? `${id}-${active}` : undefined}
        autoComplete="off"
        value={query ?? selected}
        placeholder={selected}
        onClick={() => { if (!open) show() }}
        onFocus={show}
        onBlur={() => setQuery(null)}
        onChange={event => { setQuery(event.target.value); setActive(0) }}
        onKeyDown={event => {
          if (event.nativeEvent.isComposing) return
          if (event.key === "Escape" && open) {
            event.preventDefault()
            event.stopPropagation()
            setQuery(null)
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            if (!open) show()
            else if (matches.length) setActive(i => (i + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length)
          } else if (event.key === "Enter" && open) {
            event.preventDefault()
            if (matches[active]) choose(matches[active].id)
          }
        }}
        className="h-10 w-full truncate rounded-lg border border-border bg-card pl-3 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button type="button" tabIndex={-1} aria-label={t.authorAria} aria-expanded={open} aria-controls={id}
        onMouseDown={event => event.preventDefault()}
        onClick={() => { if (open) setQuery(null); else { input.current?.focus(); show() } }}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground">
        <ChevronDown aria-hidden className="size-4" />
      </button>
      {open && (
        <div className="lb-dropdown absolute inset-x-0 top-full z-30 mt-1 min-w-0 p-1">
          <ul role="listbox" id={id} ref={list} aria-label={t.authorAria} className="max-h-60 overflow-y-auto">
            {matches.map((option, index) => (
              <li key={option.id} id={`${id}-${index}`} role="option" aria-selected={option.id === value}
                onMouseDown={event => event.preventDefault()}
                onClick={() => choose(option.id)}
                className={cn("flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-primary/15", active === index && "bg-primary/15")}>
                {option.name}
                {value === option.id && <Check aria-hidden className="size-4 shrink-0 text-primary" />}
              </li>
            ))}
          </ul>
          {!matches.length && <p role="status" className="p-2 text-sm text-muted-foreground">{t.noAuthors}</p>}
        </div>
      )}
    </div>
  )
}
