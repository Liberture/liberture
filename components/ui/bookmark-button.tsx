"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"

interface BookmarkButtonProps {
  entityType: string
  entityId: string
  className?: string
}

export function BookmarkButton({ entityType, entityId, className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/bookmarks/check?type=${entityType}&id=${entityId}`)
      .then((res) => res.json())
      .then((data) => setIsBookmarked(data.bookmarked))
      .catch(() => {})
  }, [entityType, entityId])

  const toggle = async () => {
    setLoading(true)
    try {
      if (isBookmarked) {
        await fetch("/api/bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType, entityId }),
        })
      } else {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType, entityId }),
        })
      }
      setIsBookmarked(!isBookmarked)
    } catch (error) {
      console.error("Bookmark toggle failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={`gap-2 ${className || ""}`}
    >
      {isBookmarked ? (
        <BookmarkCheck className="h-4 w-4 text-primary" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {isBookmarked ? "Saved" : "Save"}
    </Button>
  )
}
