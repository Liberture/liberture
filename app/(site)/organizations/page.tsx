import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Organizations | Biohacking Directory | Liberture",
  description: "Explore leading organizations, labs, and communities in biohacking and human optimization.",
};

const ITEMS_PER_PAGE = 20;

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  let organizations: Awaited<ReturnType<typeof prisma.organization.findMany>> = [];
  let totalCount = 0;
  try {
    [organizations, totalCount] = await Promise.all([
      prisma.organization.findMany({
        orderBy: [
          { featured: 'desc' },
          { name: 'asc' }
        ],
        take: ITEMS_PER_PAGE,
        skip,
      }),
      prisma.organization.count(),
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

          <h1 className="text-5xl font-bold mb-4">Organizations</h1>
          <p className="text-xl text-slate-300 mb-4">
            Labs, companies, and communities advancing biohacking and longevity research.
          </p>
          <p className="text-sm text-slate-400 mb-12">
            Showing {skip + 1}–{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} organizations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {organizations.map((org) => {
              const pillars = org.pillars.split(',').map(p => p.trim());
              
              return (
                <Link
                  key={org.id}
                  href={`/organizations/${org.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-6 transition-all hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    {org.featured && (
                      <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
                        Featured
                      </div>
                    )}
                    
                    <h2 className="text-2xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                      {org.name}
                    </h2>
                    
                    <p className="text-cyan-400 text-sm mb-3 capitalize">{org.type}</p>
                    
                    <p className="text-slate-400 mb-4 line-clamp-3">{org.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {pillars.slice(0, 3).map((pillar, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-medium border border-cyan-500/30"
                        >
                          {pillar}
                        </span>
                      ))}
                    </div>

                    {org.founded && (
                      <div className="text-sm text-slate-500">
                        Founded: {org.founded}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {organizations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No organizations found. Check back soon!</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-4">
              {hasPrevPage && (
                <Link
                  href={`/organizations?page=${currentPage - 1}`}
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
                  href={`/organizations?page=${currentPage + 1}`}
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
