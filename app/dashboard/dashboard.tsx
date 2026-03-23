"use client"

import { useAuth } from "@/lib/auth-context"
import { BosLevelCard } from "./bos-level-card"
import { BookmarksSection } from "./bookmarks-section"
import { CreatorStudio } from "./creator-studio"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <BosLevelCard />

          {/* Wizard Placeholder */}
          <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl border-dashed">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-6 w-6 text-primary/50 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Liberture Wizard</p>
              <p className="text-xs text-gray-600 mt-1">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Creator Studio - only shows for admins */}
          <CreatorStudio />

          {/* Bookmarks */}
          <BookmarksSection />
        </div>
      </div>
    </div>
  )
}
