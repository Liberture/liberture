"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Trophy, BarChart3, CalendarCheck, CalendarDays, Store, ListTodo } from "lucide-react"

export type ActiveView = "habits" | "todos" | "calendar" | "stats" | "catalog" | "challenges"
export type DiscoverTab = "catalog" | "coach"

/**
 * Nav order and icons. One list drives the mobile bottom bar, the desktop
 * segmented control and the swipe order, so they can never disagree. Labels
 * and titles come from translations, keyed by id.
 */
export const VIEWS: Array<{ id: ActiveView; icon: typeof CalendarCheck }> = [
  { id: "habits", icon: CalendarCheck },
  { id: "todos", icon: ListTodo },
  { id: "calendar", icon: CalendarDays },
  { id: "stats", icon: BarChart3 },
  { id: "catalog", icon: Store },
  { id: "challenges", icon: Trophy },
]

const VIEW_ORDER: ActiveView[] = VIEWS.map((v) => v.id)

export function useTrackerView(coachConfigured: boolean) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const segment = pathname.split("/tracker/")[1]?.split("/")[0] as ActiveView
  const activeView = VIEW_ORDER.includes(segment) ? segment : "habits"
  const switchActiveView = useCallback((view: ActiveView, tab?: DiscoverTab) => {
    const url = new URL(window.location.href)
    url.pathname = "/tracker/" + view
    url.searchParams.delete("morning")
    if (view === "catalog" && tab === "coach") url.searchParams.set("tab","coach")
    else url.searchParams.delete("tab")
    router.push(url.pathname + url.search + url.hash, { scroll: false })
  }, [router])
  const setDiscoverTab = useCallback((tab: DiscoverTab) => switchActiveView("catalog",tab), [switchActiveView])
  return { activeView, discoverTab: (coachConfigured && params.get("tab") === "coach" ? "coach" : "catalog") as DiscoverTab,
    setDiscoverTab, switchActiveView, viewOrder: VIEW_ORDER, morningRequested: activeView === "habits" && params.get("morning") === "1" }
}
