"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HelpTooltip } from "@/components/ui/tooltip"
import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react"
import { format, subDays, startOfDay } from "date-fns"
import { Check, CircleAlert, Loader2, Archive, BookOpen, Rows3, LayoutGrid, CalendarRange } from "lucide-react"

import Link from "@/components/i18n/localized-link"
import { LibertureLogoStatic } from "@/components/branding"
import dynamic from "next/dynamic"
import { HabitGrid } from "@/components/habits/habit-grid"
import { HabitDialog } from "@/components/habits/habit-dialog"
import { useHabitsSession } from "@/components/habits/session-provider"
import { AccountHeader } from "@/components/habits/account-header"
import { takePostLoginIntent } from "@/lib/habits/post-login-intent"
import { TodoList } from "@/components/habits/todo-list"
import { CalendarView } from "@/components/habits/calendar-view"
import { NotificationManager } from "@/components/habits/notification-manager"
import { BackupReminder } from "@/components/habits/backup-reminder"
import { SettingsDialog } from "@/components/habits/settings-dialog"
import { EditTodoDialog } from "@/components/habits/edit-todo-dialog"
import { OnboardingFlow } from "@/components/habits/onboarding/onboarding-flow"
import { progressStarterHabits } from "@/lib/habits/starter-progression"
import { HabitsTour } from "./onboarding/habits-tour"
import { MorningDashboard } from "@/components/habits/morning-dashboard"
import { HabitMatrix } from "@/components/habits/habit-matrix"
import { DailyTracker } from "@/components/habits/daily-tracker"
import { DiscoverView } from "@/components/habits/discover-view"
import { SwipeViews } from "@/components/habits/swipe-views"
import { TopographicBackground } from "@/components/habits/patterns/topographic-background"
import { AppToaster, notify } from "@/components/habits/ui/toast"
import { defaultRange, type DateRange } from "@/components/habits/date-range-filter"
import { HabitLogModals, type LogTarget } from "@/components/habits/tracker/habit-log-modals"
import { StatsView } from "@/components/habits/tracker/stats-view"
import type { SettingsTab } from "@/components/habits/settings/settings-tabs"
import { DesktopNav, MobileNav } from "@/components/habits/tracker/tracker-nav"
import { useTrackerData } from "@/components/habits/tracker/use-tracker-data"
import { useTrackerActions } from "@/components/habits/tracker/use-tracker-actions"
import { useTrackerView, type ActiveView } from "@/components/habits/tracker/use-tracker-view"
import { isReadingHabit } from "@/lib/habits/reading-passages"
import type { UserPreferences } from "@/lib/habits/types"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"
import { AssistantStartCard } from "@/components/habits/assistant/assistant-start"
import { assistantKind, useAssistantConnections } from "@/components/habits/assistant/use-assistant-connections"


type HabitsLayout = NonNullable<UserPreferences["habitsLayout"]>

/** Day / Week everywhere; Matrix needs the width, so desktop only. */
const LAYOUTS: Array<{ id: HabitsLayout; icon: typeof Rows3; desktopOnly?: boolean }> = [
  { id: "day", icon: Rows3 },
  { id: "week", icon: LayoutGrid },
  { id: "matrix", icon: CalendarRange, desktopOnly: true },
]

/**
 * The signed-in app shell: header, one responsive view track (Habits · Todos ·
 * Calendar · Stats · Discover), the bottom bar on phones, and every dialog —
 * each rendered once. Data and sync live in useTrackerData, writes in
 * useTrackerActions, view/URL state in useTrackerView.
 */
const TrackerContentContext = createContext<((view: ActiveView) => React.ReactNode) | null>(null)
export function TrackerSection({ view }: { view: ActiveView }) {
  const render = useContext(TrackerContentContext)
  return <>{render?.(view)}</>
}

export function HabitTracker({ children }: { children: React.ReactNode }) {
  const { auth, authHeaders, logout: onLogout } = useHabitsSession()
  const apiKey = auth.apiKey ?? ""
  const isNostrAuth = auth.pubkey !== null
  const nostrPubkey = auth.pubkey
  const t = useTranslations().habits.app.habitTracker
  const data = useTrackerData({ apiKey, draftOwner: nostrPubkey ?? apiKey, authHeaders, staleCopyMessage: t.staleCopyRejected, accountResetMessage: t.accountResetElsewhere })
  const actions = useTrackerActions(data)
  const {
    habits, completions, todos, projects, calendarEvents, storageData, onboardingState,
    isLoading, isSaving, isDirty, saveFailed, cachedLocally, saveResult,
    preferences, updatePreferences, updateProfile, habitsRef,
  } = data
  const isMobile = useMobile()

  // An account whose assistant connected before the tracker was ever opened
  // (connect in ChatGPT/Claude, sign up on the approve page) skips the wizard:
  // setup happens in that assistant's first chat. Wait briefly for the check
  // so the wizard doesn't flash; if it fails, fall back to the wizard.
  const connections = useAssistantConnections()
  const connectedKinds = useMemo(
    () => (connections ?? []).map((c) => assistantKind(c.name)).filter((k): k is "chatgpt" | "claude" => k !== null),
    [connections],
  )
  const [connectionCheckTimedOut, setConnectionCheckTimedOut] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setConnectionCheckTimedOut(true), 2000)
    return () => window.clearTimeout(timer)
  }, [])
  useEffect(() => {
    if (isLoading || onboardingState.completed || !connections?.length) return
    actions.handOffOnboarding()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when the check lands
  }, [isLoading, onboardingState.completed, connections])

  /** Whether this instance has a coach configured, even when disconnected. */
  const [coachConfigured, setCoachConfigured] = useState(false)
  const { activeView, discoverTab, setDiscoverTab, switchActiveView, viewOrder, morningRequested } = useTrackerView(coachConfigured)

  const [habitDialog, setHabitDialog] = useState<{ habitId?: string } | null>(null)
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null)
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<string | null>(null)
  const tourStartedOn = useRef("")
  const [tourIds, setTourIds] = useState<string[] | null>(null)
  const [showMorningDashboard, setShowMorningDashboard] = useState(false)
  const [dates, setDates] = useState<Date[]>([])
  const welcomeShown = useRef(false)
  // Stats period, shared by the summary and the detailed charts. Last 7 days.
  const [statsRange, setStatsRange] = useState<DateRange>(() => defaultRange())
  const [logTarget, setLogTarget] = useState<LogTarget | null>(null)

  const openSettings = useCallback((tab?: SettingsTab) => setSettingsTab(tab ?? "profile"), [])

  // Asked once per session. The coach is an optional deployment that most
  // instances will not have, so the tab stays hidden until we know it is there.
  useEffect(() => {
    let cancelled = false
    fetch("/api/agent/status", { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { configured?: boolean; available?: boolean } | null) => {
        if (!cancelled) setCoachConfigured(Boolean(body?.configured ?? body?.available))
      })
      .catch(() => {
        if (!cancelled) setCoachConfigured(false)
      })
    return () => {
      cancelled = true
    }
  }, [authHeaders])

  // Came from the landing page's "Connect your assistant": new users get the
  // wizard, whose first step is connecting; everyone else lands on Settings →
  // Assistants.
  useEffect(() => {
    if (isLoading) return
    if (takePostLoginIntent() !== "connect" || !onboardingState.completed) return
    try {
      localStorage.setItem("habit-tracker-settings-tab", "assistants")
    } catch {}
    setSettingsTab("assistants")
  }, [isLoading, onboardingState.completed])

  // Nostr migration state: fetch the link status for legacy API-key users.
  const [linkedNostrPubkey, setLinkedNostrPubkey] = useState<string | null>(null)
  useEffect(() => {
    if (!isNostrAuth && apiKey) {
      fetch("/api/auth/nostr/status", { headers: authHeaders })
        .then((r) => r.json())
        .then((body) => {
          if (body.linkedNpub) setLinkedNostrPubkey(body.linkedNpub)
        })
        .catch(() => {
          // Ignore errors, just means we can't show status
        })
    }
  }, [apiKey, authHeaders, isNostrAuth])

  const handleNostrMigration = useCallback((_pubkey: string, npub: string) => {
    setLinkedNostrPubkey(npub)
  }, [])

  // The server needs the zone to know what "today" is for assistants (MCP).
  // Filled in once, from the browser, if the account has never had one.
  useEffect(() => {
    if (isLoading || !storageData || storageData.preferences?.timeZone) return
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (timeZone) updatePreferences({ timeZone })
    } catch {}
  }, [isLoading, storageData, updatePreferences])

  // Keep the visible date window anchored to the current day. Rechecked on a
  // timer and whenever the tab wakes so a new day slides in without a reload;
  // identity is preserved when the day hasn't changed to avoid re-renders.
  useEffect(() => {
    const syncDates = () => {
      const today = startOfDay(new Date())
      setDates((prev) => {
        if (prev.length > 0 && prev[0].getTime() === today.getTime()) return prev
        return Array.from({ length: 7 }, (_, i) => subDays(today, i))
      })
    }
    syncDates()
    const interval = setInterval(syncDates, 60_000)
    const onWake = () => {
      if (document.visibilityState === "visible") syncDates()
    }
    document.addEventListener("visibilitychange", onWake)
    window.addEventListener("focus", onWake)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onWake)
      window.removeEventListener("focus", onWake)
    }
  }, [])

  const { setHabits, markDirty } = data
  useEffect(() => {
    if (isLoading || !dates[0] || !habits.some(habit => habit.tinyHabit)) return
    const updated = progressStarterHabits(habits, completions, format(dates[0], "yyyy-MM-dd"))
    if (updated.some((habit, index) => habit !== habits[index])) {
      setHabits(updated)
      markDirty()
    }
  }, [habits, completions, dates, isLoading, setHabits, markDirty])

  useEffect(() => {
    if (isLoading || !onboardingState.completed || welcomeShown.current || tourIds !== null || showMorningDashboard) return
    const timer = window.setTimeout(() => {
      welcomeShown.current = true
      notify.info(t.welcomeMessage)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [isLoading, onboardingState.completed, tourIds, showMorningDashboard, t.welcomeMessage])

  // Morning dashboard: once per day between 05:00 and 11:00 unless turned off
  // in Preferences or already dismissed today (saved, so it follows the
  // account). `?view=morning` opens it explicitly, at any hour.
  const morningHandledRef = useRef(false)
  useEffect(() => {
    if (tourIds !== null || isLoading || !onboardingState.completed || habits.length === 0) return
    const today = format(new Date(), "yyyy-MM-dd")
    if (morningRequested && !morningHandledRef.current) {
      morningHandledRef.current = true
      setShowMorningDashboard(true)
      return
    }
    if (tourStartedOn.current === today || !preferences.morningDashboard || preferences.morningDashboardDismissedOn === today) return
    let legacyDismissed = false
    try {
      legacyDismissed = localStorage.getItem("morning-dashboard-shown") === today
    } catch {}
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 11 && !legacyDismissed) setShowMorningDashboard(true)
    // `dates` changes on day rollover, so a tab left open overnight
    // re-evaluates the morning dashboard for the new day.
  }, [tourIds, isLoading, onboardingState.completed, habits.length, dates, morningRequested, preferences.morningDashboard, preferences.morningDashboardDismissedOn])

  const dismissMorningDashboard = useCallback(() => {
    setShowMorningDashboard(false)
    updatePreferences({ morningDashboardDismissedOn: format(new Date(), "yyyy-MM-dd") })
  }, [updatePreferences])

  const habitsLayout: HabitsLayout = preferences.habitsLayout
  // Matrix needs a wide screen; a phone falls back to the week grid.
  const effectiveLayout: HabitsLayout = tourIds !== null ? "day" : isMobile && habitsLayout === "matrix" ? "week" : habitsLayout

  const layoutContent = useRef<HTMLDivElement>(null)
  const layoutExit = useRef<Animation | null>(null)
  useEffect(() => () => layoutExit.current?.cancel(), [])
  const [slideDirection, setSlideDirection] = useState<"up" | "down" | null>(null)

  // The time-of-day filter and "show archived" are Habits-view controls only;
  // Stats and Calendar get their own unfiltered lists.
  const habitsViewHabits = useMemo(
    () => showArchived
      ? habits
      : habits.filter((h) => !h.archived && (!timeOfDayFilter || h.timeOfDay === timeOfDayFilter)),
    [habits, showArchived, timeOfDayFilter],
  )
  const sortedHabitsViewHabits = useMemo(
    () => [...habitsViewHabits].sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00")),
    [habitsViewHabits],
  )
  const archivedCount = useMemo(() => habits.filter((h) => h.archived).length, [habits])
  const calendarHabits = useMemo(() => habits.filter((h) => !h.archived), [habits])

  const openAddDialog = useCallback(() => setHabitDialog({}), [])
  const openHabitEditor = useCallback((habitId: string) => setHabitDialog({ habitId }), [])
  const openDiscover = useCallback(() => switchActiveView("catalog", "catalog"), [switchActiveView])
  const selectView = useCallback((view: ActiveView) => switchActiveView(view), [switchActiveView])

  /** "Log data" on a habit row: always the data-entry modal for that day. */
  const openHabitData = useCallback((habitId: string, date: Date) => {
    setLogTarget({ kind: "data", habitId, date })
  }, [])
  const closeLog = useCallback(() => setLogTarget(null), [])

  /**
   * Completing a habit from any view. Three cases, in order of specificity:
   * a reading habit opens the reading modal, a habit that collects data opens
   * the entry modal, and everything else toggles as it always did.
   *
   * Reading is checked first because a habit carrying both is conceptually a
   * reading habit — the passage is the point, and the modal carries its own
   * completion action either way. Both modals stay reachable once the habit is
   * already done, which is why neither branch checks completion state.
   */
  const { toggleCompletionForDay } = actions
  const toggleOrLogForDay = useCallback((habitId: string, date: Date) => {
    const habit = habitsRef.current.find((h) => h.id === habitId)
    if (isReadingHabit(habit?.readingContent)) {
      setLogTarget({ kind: "reading", habitId, date })
      return
    }
    if (habit?.dataEntry?.enabled) {
      setLogTarget({ kind: "data", habitId, date })
      return
    }
    toggleCompletionForDay(habitId, date)
  }, [habitsRef, toggleCompletionForDay])

  /** Calendar day panel: dates arrive as "yyyy-MM-dd". */
  const toggleHabitOnDay = useCallback(
    (habitId: string, day: string) => toggleOrLogForDay(habitId, new Date(`${day}T00:00:00`)),
    [toggleOrLogForDay],
  )
  const toggleToday = useCallback((habitId: string) => toggleOrLogForDay(habitId, new Date()), [toggleOrLogForDay])

  if (isLoading) {
    return (
      <div className="topo-pattern lb-see-through flex items-center justify-center h-screen">
        <TopographicBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t.loadingHabits}</p>
        </div>
      </div>
    )
  }

  // New users: the wizard — unless an assistant is already connected (handed off above).
  if (activeView !== "challenges" && !onboardingState.completed && (connections?.length || (connections === null && !connectionCheckTimedOut))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t.loadingHabits}</p>
      </div>
    )
  }
  if (activeView !== "challenges" && !onboardingState.completed) {
    return (
      <OnboardingFlow
        onComplete={(selected, onboarding) => {
          actions.handleOnboardingComplete(selected, onboarding)
          switchActiveView("habits")
          tourStartedOn.current = format(new Date(), "yyyy-MM-dd")
          setTourIds(selected.map(habit => habit.id))
        }}
        onSkip={actions.handleOnboardingSkip}
      />
    )
  }

  const pending = isSaving || (isDirty && !saveFailed)
  const statusKind = pending ? "saving" : saveResult?.kind
  const StatusIcon = statusKind === "saving" ? Loader2 : statusKind === "saved" ? Check : CircleAlert
  const statusLabel = statusKind === "saving" ? t.saving : statusKind === "saved" ? t.saved
    : isDirty ? (cachedLocally ? t.saveFailedCached : t.saveFailedKeepOpen) : t.saveFailed
  const saveStatus = statusKind && (
    <HelpTooltip label={statusLabel}><span className="inline-flex size-full" aria-hidden>
      <StatusIcon className={cn("size-full", pending && "animate-spin")} />
    </span></HelpTooltip>
  )

  const editingHabit = habitDialog?.habitId ? habits.find((h) => h.id === habitDialog.habitId) : undefined
  const editingTodo = editingTodoId ? todos.find((item) => item.id === editingTodoId) : undefined

  const renderView = (view: ActiveView) => {
    if (view === "habits") {
      return (
        <Tabs value={effectiveLayout} orientation="horizontal" variant="embedded"
          className="flex min-h-full flex-col gap-3"
          onValueChange={value => {
            const next = LAYOUTS.findIndex(layout => layout.id === value)
            if (next < 0) return
            layoutExit.current?.cancel()
            const direction = next > LAYOUTS.findIndex(layout => layout.id === effectiveLayout) ? "up" : "down"
            const selectLayout = () => {
              setSlideDirection(direction)
              updatePreferences({ habitsLayout: LAYOUTS[next].id })
            }
            const panel = layoutContent.current
            if (!panel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
              selectLayout()
              return
            }
            const exit = panel.animate([
              { opacity: 1, transform: "translateY(0)" },
              { opacity: 0, transform: `translateY(${direction === "up" ? "-" : ""}2rem)` },
            ], { duration: 130, easing: "ease-in", fill: "forwards" })
            layoutExit.current = exit
            exit.onfinish = () => {
              if (layoutExit.current !== exit) return
              layoutExit.current = null
              selectLayout()
            }
          }}>
          <TabsList aria-label={t.layoutLabel}
            className="sticky top-0 z-10 mb-0 w-fit shrink-0 self-center items-center rounded-xl border border-border bg-card p-1 shadow-sm">
            {LAYOUTS.filter(layout => !layout.desktopOnly || !isMobile).map(({ id, icon: Icon }) => (
              <TabsTrigger key={id} value={id} aria-label={t.layouts[id]}
                className="h-9 gap-2 rounded-lg px-3 data-[state=active]:border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Icon aria-hidden className="shrink-0" />
                <span>{t.layouts[id]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className={cn("min-w-0 space-y-4 md:space-y-6", effectiveLayout !== "day" && "lg:flex lg:flex-1 lg:flex-col")}>
            {onboardingState.handedOffToAssistant && !onboardingState.assistantCardDismissed && (
              <AssistantStartCard connected={connectedKinds} onDismiss={actions.dismissAssistantCard} />
            )}

            <BackupReminder habits={habits} lastBackupAt={storageData?.lastBackupAt} onExport={actions.exportData} />

            <TabsContent value={effectiveLayout} className={effectiveLayout !== "day" ? "lg:flex lg:flex-1 lg:flex-col" : undefined}>
              <div ref={layoutContent} key={effectiveLayout} data-slide={slideDirection} className={cn("habit-layout-content space-y-4 md:space-y-6", effectiveLayout !== "day" && "lg:flex lg:flex-1 lg:flex-col")}>
                {effectiveLayout === "day" ? (
                  <DailyTracker key={tourIds !== null ? "tour" : "tracker"}
                    habits={habits}
                    completions={completions}
                    displayName={storageData?.profile?.name}
                    onToggleCompletion={toggleOrLogForDay}
                    onLogData={openHabitData}
                    onEditHabit={openHabitEditor}
                    onAddHabit={openAddDialog}
                    onBrowse={openDiscover}
                    timeOfDayFilter={timeOfDayFilter}
                    onTimeOfDayFilterChange={setTimeOfDayFilter}
                    weekStartsOn={preferences.weekStartsOn}
                  />
                ) : effectiveLayout === "matrix" ? (
                  <HabitMatrix
                    habits={sortedHabitsViewHabits}
                    completions={completions}
                    // Not the plain toggle: a habit with data fields or a reading
                    // passage has to open its modal here too, the same as the day view.
                    onToggleCompletion={toggleOrLogForDay}
                    weekStartsOn={preferences.weekStartsOn}
                  />
                ) : (
                  <HabitGrid
                    habits={sortedHabitsViewHabits}
                    dates={dates}
                    completions={completions}
                    onCellClick={toggleOrLogForDay}
                    onAddHabit={openAddDialog}
                    onEditHabit={openHabitEditor}
                    onUnarchiveHabit={actions.unarchiveHabit}
                    weekStartsOn={preferences.weekStartsOn}
                  />
                )}

                {archivedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowArchived(!showArchived)}
                    aria-pressed={showArchived}
                    className="flex items-center gap-2 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground md:text-sm"
                  >
                    <Archive className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
                    <span className="md:hidden">
                      {formatMessage(showArchived ? t.hideArchivedShort : t.showArchivedShort, { count: archivedCount })}
                    </span>
                    <span className="hidden md:inline">
                      {formatMessage(showArchived ? t.hideArchived : t.showArchived, { count: archivedCount })}
                    </span>
                  </button>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      )
    }
    if (view === "stats") {
      return (
        <StatsView
          habits={habits}
          completions={completions}
          todos={todos}
          onToggleCompletion={toggleOrLogForDay}
          range={statsRange}
          onRangeChange={setStatsRange}
          weekStartsOn={preferences.weekStartsOn}
        />
      )
    }
    if (view === "todos") {
      return (
        <div className="md:max-w-4xl">
          <TodoList
            todos={todos}
            projects={projects}
            onToggleComplete={actions.toggleTodoComplete}
            onRemove={actions.removeTodo}
            onAddTodo={actions.addTodo}
            onCreateTodo={actions.createTodo}
            onAddProject={actions.addProject}
            onUpdateProject={actions.updateProject}
            onDeleteProject={actions.deleteProject}
            onEdit={(todo) => setEditingTodoId(todo.id)}
            onScheduleTodo={actions.scheduleTodo}
          />
        </div>
      )
    }
    if (view === "calendar") {
      return (
        <CalendarView
          events={calendarEvents}
          todos={todos}
          habits={calendarHabits}
          accountCreatedAt={data.accountCreatedAt}
          completions={completions}
          onAddEvent={actions.addCalendarEvent}
          onRemoveEvent={actions.removeCalendarEvent}
          onUpdateEvent={actions.updateCalendarEvent}
          projects={projects}
          onAddProject={actions.addProject}
          onCreateTodo={actions.createTodoFromCalendar}
          onUpdateTodo={actions.updateTodo}
          onDeleteTodo={actions.removeTodo}
          onToggleHabit={toggleHabitOnDay}
          weekStartsOn={preferences.weekStartsOn}
          timeFormat={preferences.timeFormat}
        />
      )
    }
    return (
      <DiscoverView
        apiKey={apiKey}
        habits={habits}
        coachConfigured={coachConfigured}
        tab={discoverTab}
        onTabChange={setDiscoverTab}
        onAdoptProtocol={actions.adoptCatalogProtocol}
        onAdoptHabit={actions.adoptCatalogHabit}
        onAdoptCustom={actions.adoptCustomHabit}
        onRecommendations={actions.recordCoachRecommendations}
        storedRecommendations={storageData?.coachRecommendations}
        onRespondToSuggestion={actions.respondToSuggestion}
      />
    )
  }

  return (
    <TrackerContentContext.Provider value={renderView}>
    <div style={activeView === "habits" ? { "--reminder-bottom": "5rem" } as React.CSSProperties : undefined} className="topo-pattern lb-see-through flex h-dvh flex-col overflow-hidden">
      <TopographicBackground />
      <header className="flex-shrink-0 border-b border-border/50 bg-background px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] md:bg-background/80 md:px-6 md:py-5 md:backdrop-blur-xl">
        {/* Fixed geometry on phones: the name truncates and the action buttons
            keep a constant size, so nothing reflows as views or filters change. */}
        <div className="flex h-12 items-center justify-between gap-2 lg:grid lg:h-auto lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-2">
          <h1 className="sr-only">{t.views[activeView]}</h1>
          <span role="status" className="sr-only">{statusKind && statusLabel}</span>
          <Link href="/" aria-label={t.homeLink} className="inline-flex size-11 shrink-0 items-center justify-center justify-self-start rounded-lg focus-visible:ring-2 focus-visible:ring-ring">
            <LibertureLogoStatic size={34} />
          </Link>
          <DesktopNav className="lg:col-start-2" activeView={activeView} onSelect={selectView} status={saveStatus} />
          <div className="min-w-0 w-full lg:w-auto lg:justify-self-end lg:max-w-full">
            <AccountHeader
              compact={isMobile}
              fallbackName={storageData?.profile?.name}
              onOpenSettings={openSettings}
              onExport={actions.exportData}
              onLogout={onLogout}
            />
          </div>
        </div>
      </header>

      <SwipeViews
        views={viewOrder}
        active={activeView}
        onChange={selectView}
        className="min-h-0 flex-1"
        panelClassName="lb-scroll p-4 pb-[calc(7.25rem+env(safe-area-inset-bottom))] lg:p-6"
        renderView={view => view === activeView ? children : null}
      />

      {activeView === "habits" && tourIds === null && (
        <div className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] right-4 z-30 lg:bottom-6 lg:right-6">
          <HelpTooltip label={t.showTutorial}>
            <button type="button" aria-label={t.showTutorial}
              className="grid size-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-md hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => {
                setTimeOfDayFilter(null)
                tourStartedOn.current = format(new Date(), "yyyy-MM-dd")
                setTourIds(habits.filter(habit => !habit.archived).map(habit => habit.id))
              }}>
              <BookOpen aria-hidden className="size-5" />
            </button>
          </HelpTooltip>
        </div>
      )}

      {tourIds !== null && (
        <HabitsTour weekStartsOn={preferences.weekStartsOn ?? 1} completions={completions} habits={habits.filter(habit => tourIds.includes(habit.id))}
          onClose={() => setTourIds(null)} />
      )}

      <MobileNav activeView={activeView} onSelect={selectView} status={saveStatus} />

      {habitDialog && (!habitDialog.habitId || editingHabit) && (
        <HabitDialog
          key={editingHabit?.id ?? "create"}
          mode={editingHabit ? "edit" : "create"}
          habit={editingHabit}
          completions={completions}
          weekStartsOn={preferences.weekStartsOn ?? 1}
          defaultTime={preferences.defaultReminderTime}
          onCreate={actions.addHabit}
          onUpdate={actions.updateHabit}
          onDelete={actions.deleteHabitById}
          onArchive={actions.archiveHabit}
          onUnarchive={actions.unarchiveHabit}
          onClose={() => setHabitDialog(null)}
        />
      )}

      {editingTodo && (
        <EditTodoDialog
          todo={editingTodo}
          projects={projects}
          onAddProject={actions.addProject}
          onSave={actions.updateTodo}
          onDelete={actions.removeTodo}
          onClose={() => setEditingTodoId(null)}
        />
      )}

      <HabitLogModals
        target={logTarget}
        habits={habits}
        completions={completions}
        onClose={closeLog}
        onSave={actions.saveHabitData}
      />

      {settingsTab && (
        <SettingsDialog
          initialTab={settingsTab}
          preferences={preferences}
          onPreferencesChange={updatePreferences}
          profile={storageData?.profile}
          onProfileChange={updateProfile}
          onExport={actions.exportData}
          lastBackupAt={storageData?.lastBackupAt}
          onImport={actions.importData}
          onClose={() => setSettingsTab(null)}
          habits={habits}
          onDeleteAccount={async () => {
            const deleted = await actions.deleteAccount()
            // Signing out lands on the home page; signing in again starts a new account.
            if (deleted) onLogout()
            return deleted
          }}
          apiKey={apiKey}
          isNostrAuth={isNostrAuth}
          onLogout={onLogout}
          linkedNostrPubkey={linkedNostrPubkey}
          pubkey={nostrPubkey}
          onNostrMigration={handleNostrMigration}
        />
      )}

      {showMorningDashboard && (
        <MorningDashboard
          habits={habits}
          completions={completions}
          profile={storageData?.profile}
          onStartDay={dismissMorningDashboard}
          onDismiss={dismissMorningDashboard}
          onToggleHabit={toggleToday}
          weekStartsOn={preferences.weekStartsOn}
        />
      )}

      <NotificationManager
        showPrompt={activeView !== "challenges"}
        habits={habits}
        completions={completions}
        enabled={!isLoading && preferences.notifications}
        dismissedAt={preferences.notificationPromptDismissedAt}
        onDismiss={() => updatePreferences({ notificationPromptDismissedAt: new Date().toISOString() })}
        preferences={preferences}
        authHeaders={authHeaders}
      />

      <AppToaster />
    </div>
    </TrackerContentContext.Provider>
  )
}
