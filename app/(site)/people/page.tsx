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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/directory" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Directory
            </Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">People</h1>
          <p className="text-xl text-slate-300 mb-4">
            Leading biohackers, researchers, and pioneers in human optimization.
          </p>
          <p className="text-sm text-slate-400 mb-12">
            Showing {skip + 1}–{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} people
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {people.map((person) => {
              const pillars = (person.pillars || '').split(',').map(p => p.trim()).filter(Boolean);
              
              return (
                <Link
                  key={person.id}
                  href={`/people/${person.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-6 transition-all hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    {person.featured && (
                      <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
                        Featured
                      </div>
                    )}
                    
                    <h2 className="text-2xl font-bold mb-2 group-hover:text-purple-400 transition-colors">
                      {person.name}
                    </h2>
                    
                    <p className="text-purple-400 text-sm mb-3">{person.title}</p>
                    
                    <p className="text-slate-400 mb-4 line-clamp-3">{person.bio}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {pillars.slice(0, 3).map((pillar, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/30"
                        >
                          {pillar}
                        </span>
                      ))}
                    </div>

                    {person.followers && (
                      <div className="mt-4 text-sm text-slate-500">
                        {person.followers}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

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
        </div>
      </div>
    </div>
  );
}
