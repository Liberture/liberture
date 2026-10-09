"use client"

import { useCallback, useEffect, useState } from "react"
import { BarChart3, CalendarCheck, CalendarDays, Compass, ListTodo } from "lucide-react"

export type ActiveView = "habits" | "todos" | "calendar" | "stats" | "discover"
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
  { id: "discover", icon: Compass },
]

const VIEW_ORDER: ActiveView[] = VIEWS.map((v) => v.id)

interface RequestedView {
  view: ActiveView
  tab: DiscoverTab
  /** `?view=morning` asks for the morning dashboard explicitly. */
  morning: boolean
}

/**
 * Reads `?view=` (and `?tab=` for Discover). Old links keep working:
 * `market` → Discover/Catalog (PWA shortcut, assistant infoUrl) and `coach` →
 * Discover/Coach.
 */
function readRequestedView(): RequestedView {
  const fallback: RequestedView = { view: "habits", tab: "catalog", morning: false }
  if (typeof window === "undefined") return fallback
  const params = new URLSearchParams(window.location.search)
  const requested = params.get("view")
  const tab: DiscoverTab = params.get("tab") === "coach" ? "coach" : "catalog"
  if (requested === "market") return { ...fallback, view: "discover", tab: "catalog" }
  if (requested === "coach") return { ...fallback, view: "discover", tab: "coach" }
  if (requested === "morning") return { ...fallback, morning: true }
  if (VIEW_ORDER.includes(requested as ActiveView)) return { ...fallback, view: requested as ActiveView, tab }
  return fallback
}

/**
 * The active top-level view, the Discover sub-tab, and their URL. The URL is
 * written with history.replaceState — Next's shallow way to change the query
 * without a navigation or a scroll — so a refresh (or a shared link) lands on
 * the same screen.
 */
export function useTrackerView(coachConfigured: boolean) {
  const [initial] = useState(readRequestedView)
  const [activeView, setActiveView] = useState<ActiveView>(initial.view)
  const [discoverTab, setDiscoverTab] = useState<DiscoverTab>(initial.tab)

  // Without a coach there is no Coach tab to be on.
  const effectiveTab: DiscoverTab = coachConfigured ? discoverTab : "catalog"

  const switchActiveView = useCallback((nextView: ActiveView, tab?: DiscoverTab) => {
    if (tab) setDiscoverTab(tab)
    setActiveView(nextView)
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set("view", activeView)
    // The requested tab, not the effective one: the coach status arrives
    // asynchronously and must not strip `tab=coach` before it does.
    if (activeView === "discover" && discoverTab === "coach") url.searchParams.set("tab", "coach")
    else url.searchParams.delete("tab")
    const next = `${url.pathname}${url.search}${url.hash}`
    if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, "", next)
    }
  }, [activeView, discoverTab])

  return {
    activeView,
    discoverTab: effectiveTab,
    setDiscoverTab,
    switchActiveView,
    viewOrder: VIEW_ORDER,
    /** True when the page was opened with `?view=morning`. */
    morningRequested: initial.morning,
  }
}
