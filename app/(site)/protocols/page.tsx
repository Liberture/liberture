import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Protocols | Biohacking Directory | Liberture",
  description: "Proven biohacking protocols and methods for optimization.",
};

const ITEMS_PER_PAGE = 20;

export default async function ProtocolsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  let protocols: Awaited<ReturnType<typeof prisma.protocol.findMany>> = [];
  let totalCount = 0;
  try {
    [protocols, totalCount] = await Promise.all([
      prisma.protocol.findMany({
        orderBy: [
          { featured: 'desc' },
          { name: 'asc' }
        ],
        take: ITEMS_PER_PAGE,
        skip,
      }),
      prisma.protocol.count(),
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

          <h1 className="text-5xl font-bold mb-4">Protocols</h1>
          <p className="text-xl text-slate-300 mb-4">
            Proven methods and systems for human optimization.
          </p>
          <p className="text-sm text-slate-400 mb-12">
            Showing {skip + 1}–{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} protocols
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {protocols.map((protocol) => {
              const benefits = protocol.benefits ? JSON.parse(protocol.benefits) : [];
              
              return (
                <Link
                  key={protocol.id}
                  href={`/protocols/${protocol.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-6 transition-all hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    {protocol.featured && (
                      <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">
                        Featured
                      </div>
                    )}
                    
                    <h2 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">
                      {protocol.name}
                    </h2>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/30 capitalize">
                        {protocol.difficulty}
                      </span>
                      {protocol.duration && (
                        <span className="text-xs text-slate-500">{protocol.duration}</span>
                      )}
                    </div>
                    
                    <p className="text-slate-400 text-sm mb-4 line-clamp-3">{protocol.description}</p>
                    
                    {benefits.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-medium">Key Benefits:</p>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {benefits.slice(0, 3).map((benefit: string, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-purple-400">•</span>
                              <span className="line-clamp-1">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {protocols.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No protocols found. Check back soon!</p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-4">
              {hasPrevPage && (
                <Link
                  href={`/protocols?page=${currentPage - 1}`}
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
                  href={`/protocols?page=${currentPage + 1}`}
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
