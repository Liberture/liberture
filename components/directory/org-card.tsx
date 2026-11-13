import { translatedLabel } from "@/lib/i18n/translated-label"
import { useMessages, useTranslations as useUiCopy } from "next-intl"
import { profilePath } from "@/lib/directory/profile-path"
import Link from "@/components/i18n/localized-link"
import { OrganizationLogo } from "./organization-logo"
import { profilePillars } from "@/lib/pillars"
import { PillarTag } from "@/components/habits/marketplace/pillar-tag"
import type { Organization } from "@prisma/client"

export function OrganizationCard({ org }: { org: Pick<Organization, "directoryKind" | "imageUrl" | "slug" | "name" | "type" | "description" | "pillars" | "featured" | "founded"> }) {
  const uiCopy = useUiCopy("publicCopy.orgCard")

  const terms = useMessages().directoryTerms
  const pillars = profilePillars(org.pillars);

  return (
    <Link
      href={profilePath(org)}
      className="group relative block overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-6 transition-all hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        {org.featured && (
          <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg">{uiCopy("featured")}</div>
        )}

        <OrganizationLogo src={org.imageUrl} name={org.name} className="mb-4 h-12 max-w-[65%]" />
        <h2 className="text-2xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">
          {org.name}
        </h2>

        <p className="text-cyan-400 text-sm mb-3 capitalize">{translatedLabel(terms, org.type)}</p>

        <p className="text-slate-400 mb-4 line-clamp-3">{org.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {pillars.slice(0, 3).map(pillar => <PillarTag key={pillar} pillar={pillar} />)}
        </div>

        {org.founded && (
          <div className="text-sm text-slate-500">{uiCopy("founded")} {org.founded}
          </div>
        )}
      </div>
    </Link>
  );
}
