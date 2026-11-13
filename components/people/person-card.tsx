import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ProfilePortrait } from "./profile-portrait"
import { ProfileMarkdown } from "./profile-markdown"
import { PillarTag } from "@/components/habits/marketplace/pillar-tag"
import { PILLAR_IDS } from "@/lib/habits/pillars"

type PersonPreview = { slug: string; name: string; title: string; imageUrl: string | null; pillars: string; bio: string; featured: boolean }

export function PersonCard({ person, featuredLabel }: { person: PersonPreview; featuredLabel: string }) {
  const tags = person.pillars.toLowerCase().split(",").map(tag => tag.trim() === "mental" ? "mind" : tag.trim())
  return <Link href={`/people/${person.slug}`} className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary">
    <div className="flex items-center gap-3">
      <ProfilePortrait person={person} compact />
      <div className="min-w-0 flex-1">
        {person.featured && <span className="text-xs font-semibold text-purple-400">{featuredLabel}</span>}
        <h3 className="text-lg font-semibold leading-tight">{person.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{person.title}</p>
      </div>
      <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
    </div>
    <ProfileMarkdown preview>{person.bio.split(/\n\s*\n/).find(paragraph => !paragraph.startsWith("#")) || person.bio}</ProfileMarkdown>
    <div className="mt-auto flex flex-wrap gap-1.5">{PILLAR_IDS.filter(id => tags.includes(id)).slice(0,3).map(id => <PillarTag key={id} pillar={id} />)}</div>
  </Link>
}
