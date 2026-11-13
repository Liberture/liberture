import { DirectoryLayout, DirectoryHeader, DirectoryGrid } from "@/components/directory/layout"
import { BookCard } from "@/components/directory/book-card"
import { BackLink } from "@/components/seo/back-link"
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
    <DirectoryLayout>
          <div className="mb-8">
            <BackLink fallback="/directory" />
          </div>

          <DirectoryHeader title="Books" description="Essential reading on biohacking, longevity, and human optimization." />
          <p className="text-sm text-slate-400 mb-12">
            Showing {skip + 1}–{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} books
          </p>

          <DirectoryGrid>
            {books.map(book => <BookCard key={book.id} book={book} />)}
          </DirectoryGrid>

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
    </DirectoryLayout>
  );
}
