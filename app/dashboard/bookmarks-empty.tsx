"use client"

import { BookOpen, FileText, Users, FlaskConical, Building2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

const emptyStates: Record<string, { icon: LucideIcon; message: string; cta: string; href: string }> = {
  book: { icon: BookOpen, message: "No books bookmarked yet", cta: "Browse Books", href: "/books" },
  article: { icon: FileText, message: "No articles saved yet", cta: "Explore Articles", href: "/articles" },
  person: { icon: Users, message: "No people followed yet", cta: "Discover People", href: "/people" },
  protocol: { icon: FlaskConical, message: "No protocols saved yet", cta: "Find Protocols", href: "/protocols" },
  organization: { icon: Building2, message: "No organizations saved yet", cta: "View Organizations", href: "/organizations" },
  marketplace: { icon: ShoppingBag, message: "No items saved yet", cta: "Browse Protocols", href: "/protocols" },
}

export function BookmarksEmpty({ entityType }: { entityType: string }) {
  const state = emptyStates[entityType]
  if (!state) return null
  const Icon = state.icon

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-gray-800/50 border border-gray-700 mb-4">
        <Icon className="h-8 w-8 text-gray-500" />
      </div>
      <p className="text-gray-400 mb-4">{state.message}</p>
      <Button variant="outline" asChild>
        <Link href={state.href}>{state.cta}</Link>
      </Button>
    </div>
  )
}
