"use client"
import { useTranslations as useUiCopy } from "next-intl"

import Link from "@/components/i18n/localized-link"
import { Star } from "lucide-react"
import { splitBookTitle } from "@/lib/directory/book-title"
import { BookAuthor } from "./book-author"
import { BookCover } from "./book-cover"
import type { Book } from "@prisma/client"
import { PillarTag } from "@/components/habits/marketplace/pillar-tag"
import { profilePillars } from "@/lib/pillars"

type BookPreview = Pick<Book, "slug" | "title" | "author" | "description" | "pillars" | "rating" | "year" | "featured" | "pages" | "imageUrl"> & {
  Person?: { slug: string; name: string } | null
}

export function BookCard({ book }: { book: BookPreview }) {
  const uiCopy = useUiCopy("publicCopy.bookCard")

  const href = `/books/${book.slug}`
  const { title, subtitle } = splitBookTitle(book.title)
  const pillars = profilePillars(book.pillars)
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary/60">
      <div className="flex items-start gap-4">
        <BookCover src={book.imageUrl} title={book.title} compact />
        <div className="min-w-0">
          {book.featured && <span className="text-xs font-semibold text-primary">{uiCopy("featured")}</span>}
          <h3 className="text-lg font-semibold leading-tight"><Link href={href} className="hover:underline">{title}</Link></h3>
          {subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>}
          <p className="mt-1 text-sm text-muted-foreground"><BookAuthor book={book} /></p>
        </div>
      </div>
      <p className="line-clamp-3 text-sm text-muted-foreground">{book.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {book.year != null && book.year > 0 && <span>{book.year}</span>}
        {book.pages != null && book.pages > 0 && <span>{book.pages} {uiCopy("pages")}</span>}
        {book.rating != null && book.rating > 0 && <span className="inline-flex items-center gap-1"><Star aria-hidden className="size-3 fill-yellow-400 text-yellow-400" />{book.rating.toFixed(1)}</span>}
      </div>
      {pillars.length > 0 && <div className="flex flex-wrap gap-1.5">{pillars.map(id => <PillarTag key={id} pillar={id} />)}</div>}
    </article>
  )
}
