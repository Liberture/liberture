import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Books | Biohacking Directory | Liberture",
  description: "Essential books on biohacking, longevity, and human optimization.",
};

const ITEMS_PER_PAGE = 20;

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  let books: Awaited<ReturnType<typeof prisma.book.findMany<{ include: { Person: { select: { id: true; name: true; slug: true } } } }>>> = [];
  let totalCount = 0;
  try {
    [books, totalCount] = await Promise.all([
      prisma.book.findMany({
        orderBy: [
          { featured: 'desc' },
          { rating: 'desc' }
        ],
        take: ITEMS_PER_PAGE,
        skip,
        include: {
          Person: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }),
      prisma.book.count(),
    ]);
  } catch {
    // Database unavailable — render empty state
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/directory" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Directory
            </Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">Books</h1>
          <p className="text-xl text-slate-300 mb-4">
            Essential reading on biohacking, longevity, and human optimization.
          </p>
          <p className="text-sm text-slate-400 mb-12">
            Showing {skip + 1}–{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} books
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => {
              const pillars = book.pillars.split(',').map(p => p.trim());
              
              return (
                <div
                  key={book.id}
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
            })}
          </div>

          {books.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No books found. Check back soon!</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-4">
              {hasPrevPage && (
                <Link
                  href={`/books?page=${currentPage - 1}`}
                  className="px-6 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  ← Previous
                </Link>
              )}
              
              <div className="text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
              
              {hasNextPage && (
                <Link
                  href={`/books?page=${currentPage + 1}`}
                  className="px-6 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
