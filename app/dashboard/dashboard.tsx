"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { BosLevelCard } from "./bos-level-card"
import { BookmarksSection } from "./bookmarks-section"
import { NostrProfile } from "./nostr-profile"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Shield } from "lucide-react"

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <BosLevelCard />

          {/* Nostr Profile Section */}
          {user?.nostrPubkey && <NostrProfile />}

          {/* Admin Panel Link - Only for admins */}
          {user?.isAdmin && (
            <Link href="/admin">
              <Card className="bg-gradient-to-br from-violet-900/50 to-purple-900/50 border-violet-500/30 backdrop-blur-sm rounded-2xl hover:border-violet-500/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-violet-200">Admin Panel</p>
                    <p className="text-xs text-violet-400/70">Manage content & users</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Wizard Placeholder */}
          <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl border-dashed">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-6 w-6 text-primary/50 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Liberture Wizard</p>
              <p className="text-xs text-gray-600 mt-1">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content — Bookmarks */}
        <div className="lg:col-span-3">
          <BookmarksSection />
        </div>
      </div>
    </div>
  )
}
