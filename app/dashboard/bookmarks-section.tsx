"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookmarkCard } from "./bookmark-card"
import { BookmarksEmpty } from "./bookmarks-empty"
import {
  BookOpen,
  FileText,
  Users,
  FlaskConical,
  Building2,
  ShoppingBag,
  Bookmark,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const TABS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "book", label: "Books", icon: BookOpen },
  { value: "article", label: "Articles", icon: FileText },
  { value: "person", label: "People", icon: Users },
  { value: "protocol", label: "Protocols", icon: FlaskConical },
  { value: "organization", label: "Orgs", icon: Building2 },
  { value: "marketplace", label: "Market", icon: ShoppingBag },
]

interface BookmarkItem {
  id: string
  entityType: string
  entityId: string
  createdAt: string
  entity: Record<string, unknown>
}

export function BookmarksSection() {
  const [bookmarks, setBookmarks] = useState<Record<string, BookmarkItem[]>>({})
  const [loading, setLoading] = useState(true)

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch("/api/bookmarks/hydrated")
      if (res.ok) {
        const data = await res.json()
        setBookmarks(data.bookmarks)
      }
    } catch (error) {
      console.error("Failed to fetch bookmarks:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const handleRemove = async (entityType: string, entityId: string) => {
    // Optimistic update
    setBookmarks((prev) => ({
      ...prev,
      [entityType]: (prev[entityType] || []).filter(
        (b) => b.entityId !== entityId
      ),
    }))

    await fetch("/api/bookmarks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId }),
    })
  }

  const totalCount = Object.values(bookmarks).reduce(
    (sum, items) => sum + items.length,
    0
  )

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Bookmark className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-100">Your Bookmarks</h2>
        {totalCount > 0 && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            {totalCount}
          </span>
        )}
      </div>

      <Tabs defaultValue="book" className="w-full">
        <TabsList className="w-full grid grid-cols-6 bg-gray-800/70 border border-gray-700 rounded-xl">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const count = (bookmarks[tab.value] || []).length
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-1.5 text-xs data-[state=active]:bg-gray-700 rounded-lg"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded-full">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {(bookmarks[tab.value] || []).length === 0 ? (
              <BookmarksEmpty entityType={tab.value} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(bookmarks[tab.value] || []).map((item) => (
                  <BookmarkCard
                    key={item.id}
                    entityType={tab.value}
                    entity={item.entity as BookmarkItem["entity"] & { id: string; slug: string; description: string }}
                    onRemove={() => handleRemove(tab.value, item.entityId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Placeholder for future features */}
      {/* TODO: Wizard integration — connect bookmarked content to personalized protocols */}
      {/* TODO: Export bookmarks to Nostr lists (NIP-51) */}
      {/* TODO: Share bookmark collections with other users */}
    </div>
  )
}
