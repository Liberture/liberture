import Link from "next/link"
import type { Book } from "@prisma/client"
import { Star } from "lucide-react"

export function BookCard({ book }: { book: Pick<Book, "slug" | "title" | "author" | "description" | "pillars" | "rating" | "year" | "featured" | "pages"> & { Person?: { slug: string; name: string } | null } }) {
  const pillars = (book.pillars || '').split(',').map(p => p.trim()).filter(Boolean);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-6 transition-all hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        {book.featured && (
          <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
            Featured
          </div>
        )}

        <Link href={`/books/${book.slug}`}>
          <h2 className="text-lg font-bold mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2 cursor-pointer">
            {book.title}
          </h2>
        </Link>

        <p className="text-cyan-400 text-sm mb-3">
          {book.Person ? (
            <Link
              href={`/people/${book.Person.slug}`}
              className="hover:text-cyan-300 underline decoration-cyan-400/30 hover:decoration-cyan-300 transition-colors"
            >
              {book.Person.name}
            </Link>
          ) : (
            book.author
          )}
        </p>

        <Link href={`/books/${book.slug}`} className="block">
          {book.rating && (
            <div className="flex items-center gap-1 mb-3">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{book.rating.toFixed(1)}</span>
              {book.year && (
                <span className="text-xs text-slate-500 ml-2">({book.year})</span>
              )}
            </div>
          )}

          <p className="text-slate-400 text-sm mb-4 line-clamp-3">{book.description}</p>
        </Link>

        <div className="flex flex-wrap gap-2">
          {pillars.slice(0, 3).map((pillar, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium border border-cyan-500/30"
            >
              {pillar}
            </span>
          ))}
        </div>

        {book.pages && (
          <div className="mt-4 text-xs text-slate-500">
            {book.pages} pages
          </div>
        )}
      </div>
    </div>
  );
}
