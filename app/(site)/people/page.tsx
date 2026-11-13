import { DirectoryLayout, DirectoryHeader, DirectoryGrid } from "@/components/directory/layout"
import { BackLink } from "@/components/seo/back-link"
import { PersonCard } from "@/components/people/person-card"
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata: Metadata = {
  title: "People | Biohacking Directory | Liberture",
  description: "Explore leading biohackers, researchers, and pioneers in human optimization.",
};

const ITEMS_PER_PAGE = 20;

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  let people: Awaited<ReturnType<typeof prisma.person.findMany>> = [];
  let totalCount = 0;
  try {
    [people, totalCount] = await Promise.all([
      prisma.person.findMany({
        orderBy: [
          { featured: 'desc' },
          { name: 'asc' }
        ],
        take: ITEMS_PER_PAGE,
        skip,
      }),
      prisma.person.count(),
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

          <DirectoryHeader title="People" description="Leading biohackers, researchers, and pioneers in human optimization." />
          <p className="text-sm text-slate-400 mb-12">
            Showing {skip + 1}–{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} people
          </p>

          <DirectoryGrid>
            {people.map(person => <PersonCard key={person.id} featuredLabel="Featured" person={person} />)}
          </DirectoryGrid>

          {people.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No people found. Check back soon!</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-4">
              {hasPrevPage && (
                <Link
                  href={`/people?page=${currentPage - 1}`}
                  className="px-6 py-3 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors"
                >
                  ← Previous
                </Link>
              )}
              
              <div className="text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
              
              {hasNextPage && (
                <Link
                  href={`/people?page=${currentPage + 1}`}
                  className="px-6 py-3 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
    </DirectoryLayout>
  );
}
