"use client"

import Link from "next/link"
import { Star } from "lucide-react"
import { useState } from "react"
import type { Book } from "@prisma/client"
import { PillarTag } from "@/components/habits/marketplace/pillar-tag"
import { profilePillars } from "@/lib/pillars"

type BookPreview = Pick<Book, "slug" | "title" | "author" | "description" | "pillars" | "rating" | "year" | "featured" | "pages" | "imageUrl"> & {
  Person?: { slug: string; name: string } | null
}

export function BookCard({ book }: { book: BookPreview }) {
  const [failedCover, setFailedCover] = useState<string>()
  const href = `/books/${book.slug}`
  const pillars = profilePillars(book.pillars)
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary/60">
      <div className="flex items-start gap-4">
        {book.imageUrl && book.imageUrl !== failedCover && (
          <Link href={href} aria-label={book.title} className="shrink-0">
            <img src={book.imageUrl} alt="" width={64} height={96} loading="lazy" className="h-24 w-16 rounded object-contain" onError={() => setFailedCover(book.imageUrl ?? undefined)} />
          </Link>
        )}
        <div className="min-w-0">
          {book.featured && <span className="text-xs font-semibold text-primary">Featured</span>}
          <h3 className="text-lg font-semibold leading-tight"><Link href={href} className="hover:underline">{book.title}</Link></h3>
          <p className="mt-1 text-sm text-muted-foreground">{book.Person ? <Link href={`/people/${book.Person.slug}`} className="hover:underline">{book.Person.name}</Link> : book.author}</p>
        </div>
      </div>
      <p className="line-clamp-3 text-sm text-muted-foreground">{book.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {book.year && <span>{book.year}</span>}
        {book.pages && <span>{book.pages} pages</span>}
        {book.rating != null && <span className="inline-flex items-center gap-1"><Star aria-hidden className="size-3 fill-yellow-400 text-yellow-400" />{book.rating.toFixed(1)}</span>}
      </div>
      {pillars.length > 0 && <div className="flex flex-wrap gap-1.5">{pillars.map(id => <PillarTag key={id} pillar={id} />)}</div>}
    </article>
  )
}
