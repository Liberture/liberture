"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  FileText,
  Users,
  FlaskConical,
  Building2,
  ShoppingBag,
  X,
} from "lucide-react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

const entityConfig: Record<
  string,
  { icon: LucideIcon; label: string; color: string; href: (slug: string) => string }
> = {
  book: { icon: BookOpen, label: "Book", color: "text-green-400", href: (slug) => `/books/${slug}` },
  article: { icon: FileText, label: "Article", color: "text-cyan-400", href: (slug) => `/knowledge/${slug}` },
  person: { icon: Users, label: "Person", color: "text-pink-400", href: (slug) => `/people/${slug}` },
  protocol: { icon: FlaskConical, label: "Protocol", color: "text-orange-400", href: (slug) => `/protocols/${slug}` },
  organization: { icon: Building2, label: "Org", color: "text-indigo-400", href: (slug) => `/organizations/${slug}` },
  marketplace: { icon: ShoppingBag, label: "Item", color: "text-yellow-400", href: (slug) => `/marketplace/${slug}` },
}

interface BookmarkCardProps {
  entityType: string
  entity: {
    id: string
    slug: string
    title?: string
    name?: string
    description: string
    pillars?: string
    pillar?: string
    author?: string
    creator?: string
    imageUrl?: string | null
  }
  onRemove: () => void
}

export function BookmarkCard({ entityType, entity, onRemove }: BookmarkCardProps) {
  const config = entityConfig[entityType]
  if (!config) return null

  const Icon = config.icon
  const displayName = entity.title || entity.name || "Untitled"
  const pillarText = entity.pillars || entity.pillar || ""
  const authorText = entity.author || entity.creator || ""

  return (
    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl hover:border-gray-600 transition-all group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-xl bg-gray-900/50 border border-gray-700">
            <Icon className={`h-4 w-4 ${config.color}`} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          >
            <X className="h-4 w-4 text-gray-500 hover:text-red-400" />
          </Button>
        </div>
        <Link href={config.href(entity.slug)}>
          <h3 className="font-semibold text-gray-100 mb-1 hover:text-primary transition-colors line-clamp-2">
            {displayName}
          </h3>
        </Link>
        {authorText && (
          <p className="text-xs text-gray-400 mb-2">{authorText}</p>
        )}
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
          {entity.description}
        </p>
        {pillarText && (
          <div className="flex flex-wrap gap-1">
            {pillarText
              .split(",")
              .slice(0, 2)
              .map((p) => (
                <Badge key={p.trim()} variant="secondary" className="text-[10px]">
                  {p.trim()}
                </Badge>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
