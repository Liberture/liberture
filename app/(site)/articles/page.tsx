import { DirectoryLayout, DirectoryHeader, DirectoryGrid } from "@/components/directory/layout"
import { ArticleCard } from "@/components/directory/article-card"
import { BackLink } from "@/components/seo/back-link"
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
    <DirectoryLayout>
          <div className="mb-8">
            <BackLink fallback="/directory" />
          </div>

          <DirectoryHeader title="Articles" description="Research articles, white papers, and guides on human optimization." />
          <p className="text-sm text-slate-400 mb-12">
            Showing {skip + 1}&ndash;{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} articles
          </p>

          <DirectoryGrid>
            {articles.map(article => <ArticleCard key={article.id} article={article} />)}
          </DirectoryGrid>

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
    </DirectoryLayout>
  );
}
