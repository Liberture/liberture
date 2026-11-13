"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/components/i18n/locale-provider"
import { DirectoryGrid } from "./layout"

export function InfiniteGrid<T>({ items, renderItem, initialLimit = 20 }: {
  items: T[]
  renderItem: (item: T) => ReactNode
  initialLimit?: number
}) {
  const [limit, setLimit] = useState(initialLimit)
  const next = useRef<HTMLButtonElement>(null)
  const more = useTranslations().habits.app.directoryListing.more
  const hasMore = limit < items.length

  useEffect(() => {
    if (!hasMore || !next.current || !("IntersectionObserver" in window)) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLimit(count => count + 20)
    }, { rootMargin: "250px" })
    observer.observe(next.current)
    return () => observer.disconnect()
  }, [limit, hasMore])

  return <>
    <DirectoryGrid>{items.slice(0, limit).map(renderItem)}</DirectoryGrid>
    {hasMore && <Button variant="secondary" ref={next} onClick={() => setLimit(count => count + 20)} className="mx-auto mt-6 flex">{more}</Button>}
  </>
}
