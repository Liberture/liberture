"use client"

import { useAuth } from "@/lib/auth-context"
import { BosLevelCard } from "./bos-level-card"
import { PillarGrid } from "./pillar-grid"
import { ActiveProtocol } from "./active-protocol"
import { QuickActions } from "./quick-actions"
import { RecentActivity } from "./recent-activity"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
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
            <span className="text-sm text-gray-400">Welcome back, {user?.name || "Operator"}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - BOS Level & Active Protocol */}
        <div className="lg:col-span-1 space-y-6">
          <BosLevelCard />
          <ActiveProtocol />
        </div>

        {/* Center Column - Pillar Grid */}
        <div className="lg:col-span-2 space-y-6">
          <PillarGrid />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickActions />
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  )
}
