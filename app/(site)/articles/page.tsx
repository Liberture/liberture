import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Clock, User } from "lucide-react";

export const metadata: Metadata = {
  title: "Articles | Biohacking Directory | Liberture",
  description: "Research articles, white papers, and guides on biohacking, longevity, and human optimization.",
};

const ITEMS_PER_PAGE = 20;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pillar?: string }>;
}) {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1", 10);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;
  const pillarFilter = params.pillar;

  const where: any = {};
  if (pillarFilter && pillarFilter !== "all") {
    where.pillar = pillarFilter;
  }

  let articles: any[] = [];
  let totalCount = 0;
  try {
    [articles, totalCount] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: [
          { publishedAt: "desc" },
        ],
        take: ITEMS_PER_PAGE,
        skip,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          pillar: true,
          tags: true,
          author: true,
          readTime: true,
          publishedAt: true,
        },
      }),
      prisma.article.count({ where }),
    ]);
  } catch {
    // Database unavailable
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link href="/directory" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
              &larr; Back to Directory
            </Link>
          </div>

          <h1 className="text-5xl font-bold mb-4">Articles</h1>
          <p className="text-xl text-slate-300 mb-4">
            Research articles, white papers, and guides on human optimization.
          </p>
          <p className="text-sm text-slate-400 mb-12">
            Showing {skip + 1}&ndash;{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} articles
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => {
              const tags = (article.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean);

              return (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-6 transition-all hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <h2 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                      {article.title}
                    </h2>

                    <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                      {article.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {article.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime} min
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {article.pillar && (
                        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium border border-blue-500/30">
                          {article.pillar}
                        </span>
                      )}
                      {tags.slice(0, 2).map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-full bg-slate-700/50 text-slate-400 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {articles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No articles found. Check back soon!</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-4">
              {hasPrevPage && (
                <Link
                  href={`/articles?page=${currentPage - 1}${pillarFilter ? `&pillar=${pillarFilter}` : ''}`}
                  className="px-6 py-3 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  &larr; Previous
                </Link>
              )}

              <div className="text-slate-400">
                Page {currentPage} of {totalPages}
              </div>

              {hasNextPage && (
                <Link
                  href={`/articles?page=${currentPage + 1}${pillarFilter ? `&pillar=${pillarFilter}` : ''}`}
                  className="px-6 py-3 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-colors"
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
