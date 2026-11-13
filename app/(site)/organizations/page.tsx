import { DirectoryLayout, DirectoryHeader, DirectoryGrid } from "@/components/directory/layout"
import { OrganizationCard } from "@/components/directory/org-card"
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
    <DirectoryLayout>
          <DirectoryHeader title="Organizations" description="Labs, companies, and communities advancing biohacking and longevity research." />
          <p className="text-sm text-slate-400 mb-12">
            Showing {skip + 1}–{Math.min(skip + ITEMS_PER_PAGE, totalCount)} of {totalCount} organizations
          </p>

          <DirectoryGrid>
            {organizations.map(org => <OrganizationCard key={org.id} org={org} />)}
          </DirectoryGrid>

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
    </DirectoryLayout>
  );
}
