"use client"

import { useAuth } from "@/lib/auth-context"
import { BosLevelCard } from "./bos-level-card"
import { BookmarksSection } from "./bookmarks-section"
import { NostrProfile } from "./nostr-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LogOut, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function Dashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-100">Liberture</h1>
              <p className="text-gray-400 text-sm">Biological Operating System</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Welcome back, {user?.name || "Operator"}
            </span>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-cyan-400 flex items-center justify-center text-gray-900 font-bold">
              {user?.name?.charAt(0).toUpperCase() || "O"}
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <BosLevelCard />

          {/* Nostr Profile Section */}
          {user?.nostrPubkey && <NostrProfile />}

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
