"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CardCarousel({ title, previousLabel, nextLabel, children }: {
  title: string
  previousLabel: string
  nextLabel: string
  children: ReactNode
}) {
  const track = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  useEffect(() => {
    const list = track.current
    if (!list) return
    const update = () => setEdges({
      start: list.scrollLeft <= 1,
      end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 1,
    })
    const observer = new ResizeObserver(update)
    observer.observe(list)
    list.addEventListener("scroll", update, { passive:true })
    update()
    return () => { observer.disconnect(); list.removeEventListener("scroll", update) }
  }, [children])
  function scroll(direction: number) {
    const list = track.current
    const first = list?.firstElementChild
    if (!list || !first) return
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(list).columnGap)
    list.scrollBy({left: direction * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"})
  }
  return <section className="mt-10 min-w-0" aria-label={title}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {!(edges.start && edges.end) && <div className="flex gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label={previousLabel} disabled={edges.start} onClick={() => scroll(-1)}><ChevronLeft /></Button>
        <Button type="button" variant="ghost" size="icon" aria-label={nextLabel} disabled={edges.end} onClick={() => scroll(1)}><ChevronRight /></Button>
      </div>}
    </div>
    <ul ref={track} className="flex snap-x snap-mandatory gap-4 overflow-x-auto p-1 pb-3 [&>li]:w-[84%] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[46%] lg:[&>li]:w-[31%]">{children}</ul>
  </section>
}
