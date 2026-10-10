"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { format, subDays, startOfDay } from "date-fns"
import { Loader2, Sparkles, Archive, Rows3, LayoutGrid, CalendarRange } from "lucide-react"

import { HabitGrid } from "@/components/habits/habit-grid"
import { AddHabitDialog } from "@/components/habits/add-habit-dialog"
import { EditHabitDialog } from "@/components/habits/edit-habit-dialog"
import { AccountHeader } from "@/components/habits/account-header"
import { takePostLoginIntent } from "@/lib/habits/post-login-intent"
import { TodoList } from "@/components/habits/todo-list"
import { CalendarView } from "@/components/habits/calendar-view"
import { NotificationManager } from "@/components/habits/notification-manager"
import { BackupReminder } from "@/components/habits/backup-reminder"
import { SettingsDialog } from "@/components/habits/settings-dialog"
import { EditTodoDialog } from "@/components/habits/edit-todo-dialog"
import { OnboardingFlow } from "@/components/habits/onboarding/onboarding-flow"
import { MorningDashboard } from "@/components/habits/morning-dashboard"
import { HabitMatrix } from "@/components/habits/habit-matrix"
import { DailyTracker } from "@/components/habits/daily-tracker"
import { DiscoverView } from "@/components/habits/discover-view"
import { SwipeViews } from "@/components/habits/swipe-views"
import { TopographicBackground } from "@/components/habits/patterns/topographic-background"
import { AppToaster } from "@/components/habits/ui/toast"
import { defaultRange, type DateRange } from "@/components/habits/date-range-filter"
import { HabitLogModals, type LogTarget } from "@/components/habits/tracker/habit-log-modals"
import { StatsView } from "@/components/habits/tracker/stats-view"
import type { SettingsTab } from "@/components/habits/settings/settings-tabs"
import { DesktopNav, MobileNav } from "@/components/habits/tracker/tracker-nav"
import { useTrackerData } from "@/components/habits/tracker/use-tracker-data"
import { useTrackerActions } from "@/components/habits/tracker/use-tracker-actions"
import { useTrackerView, type ActiveView } from "@/components/habits/tracker/use-tracker-view"
import { isReadingHabit } from "@/lib/habits/reading-passages"
import { getDailyMotivation } from "@/lib/habits/motivational-messages"
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

interface HabitTrackerProps {
  apiKey: string
  isNostrAuth?: boolean
  onLogout: () => void
}

/**
 * The signed-in app shell: header, one responsive view track (Habits · Todos ·
 * Calendar · Stats · Discover), the bottom bar on phones, and every dialog —
 * each rendered once. Data and sync live in useTrackerData, writes in
 * useTrackerActions, view/URL state in useTrackerView.
 */
export function HabitTracker({ apiKey, isNostrAuth = false, onLogout }: HabitTrackerProps) {
  const t = useTranslations().habits.app.habitTracker
  const authHeaders = useMemo<Record<string, string>>(() => {
    const headers: Record<string, string> = {}
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`
    return headers
  }, [apiKey])

  const data = useTrackerData({ apiKey, isNostrAuth, authHeaders, staleCopyMessage: t.staleCopyRejected, accountResetMessage: t.accountResetElsewhere })
  const actions = useTrackerActions(data)
  const {
    habits, completions, todos, projects, calendarEvents, storageData, onboardingState,
    isLoading, isSaving, isDirty, saveFailed, cachedLocally,
    preferences, updatePreferences, updateProfile, habitsRef,
  } = data
  const isMobile = useMobile()

  // An account whose assistant connected before the tracker was ever opened
  // (connect in ChatGPT/Claude, sign up on the approve page) skips the wizard:
  // setup happens in that assistant's first chat. Wait briefly for the check
  // so the wizard doesn't flash; if it fails, fall back to the wizard.
  const connections = useAssistantConnections(apiKey, isNostrAuth)
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

  const [editingHabitForDialog, setEditingHabitForDialog] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [settingsTab, setSettingsTab] = useState<SettingsTab | null>(null)
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [timeOfDayFilter, setTimeOfDayFilter] = useState<string | null>(null)
  const [showMorningDashboard, setShowMorningDashboard] = useState(false)
  const [dates, setDates] = useState<Date[]>([])
  const [motivationalMessage, setMotivationalMessage] = useState<string>("")
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

  // For the header's Nostr profile (picture, name, NIP-05).
  const [nostrPubkey, setNostrPubkey] = useState<string | null>(null)
  useEffect(() => {
    if (!isNostrAuth) return
    try {
      setNostrPubkey(localStorage.getItem("habit-tracker-nostr-pubkey"))
    } catch {
      setNostrPubkey(null)
    }
  }, [isNostrAuth])

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

  // Set motivational message once data is loaded
  useEffect(() => {
    if (!isLoading && habits.length > 0) {
      setMotivationalMessage(getDailyMotivation(habits, completions))
    }
  }, [isLoading, habits, completions, dates])

  // Morning dashboard: once per day between 05:00 and 11:00 unless turned off
  // in Preferences or already dismissed today (saved, so it follows the
  // account). `?view=morning` opens it explicitly, at any hour.
  const morningHandledRef = useRef(false)
  useEffect(() => {
    if (isLoading || !onboardingState.completed || habits.length === 0) return
    const today = format(new Date(), "yyyy-MM-dd")
    if (morningRequested && !morningHandledRef.current) {
      morningHandledRef.current = true
      setShowMorningDashboard(true)
      return
    }
    if (!preferences.morningDashboard || preferences.morningDashboardDismissedOn === today) return
    let legacyDismissed = false
    try {
      legacyDismissed = localStorage.getItem("morning-dashboard-shown") === today
    } catch {}
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 11 && !legacyDismissed) setShowMorningDashboard(true)
    // `dates` changes on day rollover, so a tab left open overnight
    // re-evaluates the morning dashboard for the new day.
  }, [isLoading, onboardingState.completed, habits.length, dates, morningRequested, preferences.morningDashboard, preferences.morningDashboardDismissedOn])

  const dismissMorningDashboard = useCallback(() => {
    setShowMorningDashboard(false)
    updatePreferences({ morningDashboardDismissedOn: format(new Date(), "yyyy-MM-dd") })
  }, [updatePreferences])

  const habitsLayout: HabitsLayout = preferences.habitsLayout
  // Matrix needs a wide screen; a phone falls back to the week grid.
  const effectiveLayout: HabitsLayout = isMobile && habitsLayout === "matrix" ? "week" : habitsLayout

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

  const openAddDialog = useCallback(() => setShowAddDialog(true), [])
  const openHabitEditor = useCallback((habitId: string) => setEditingHabitForDialog(habitId), [])
  const openDiscover = useCallback(() => switchActiveView("discover", "catalog"), [switchActiveView])
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
  if (!onboardingState.completed && (connections?.length || (connections === null && !connectionCheckTimedOut))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">{t.loadingHabits}</p>
      </div>
    )
  }
  if (!onboardingState.completed) {
    return (
      <OnboardingFlow
        onComplete={actions.handleOnboardingComplete}
        onSkip={actions.handleOnboardingSkip}
        apiKey={apiKey}
        isNostrAuth={isNostrAuth}
      />
    )
  }

  const pendingSaveMessage = saveFailed
    ? cachedLocally ? t.saveFailedCached : t.saveFailedKeepOpen
    : cachedLocally ? t.savedLocallySyncing : t.unsavedChanges

  const saveStatus = (
    <>
      {isSaving && (
        <span className="inline-flex items-center gap-1 text-primary">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          {t.saving}
        </span>
      )}
      {!isSaving && isDirty && <span className="text-exercise">{pendingSaveMessage}</span>}
      {!isSaving && !isDirty && <span>{t.saved}</span>}
    </>
  )

  const editingHabit = editingHabitForDialog ? habits.find((h) => h.id === editingHabitForDialog) : undefined
  const editingTodo = editingTodoId ? todos.find((item) => item.id === editingTodoId) : undefined

  const renderView = (view: ActiveView) => {
    if (view === "habits") {
      return (
        <div className="space-y-4 md:space-y-6">
          <div role="group" aria-label={t.layoutLabel} className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 md:inline-flex">
            {LAYOUTS.map(({ id, icon: Icon, desktopOnly }) => (
              <button
                key={id}
                type="button"
                onClick={() => updatePreferences({ habitsLayout: id })}
                aria-pressed={effectiveLayout === id}
                className={cn(
                  "flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors md:flex-none",
                  desktopOnly ? "hidden md:inline-flex" : "inline-flex",
                  effectiveLayout === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" aria-hidden />
                {t.layouts[id]}
              </button>
            ))}
          </div>

          {onboardingState.handedOffToAssistant && !onboardingState.assistantCardDismissed && (
            <AssistantStartCard connected={connectedKinds} onDismiss={actions.dismissAssistantCard} />
          )}

          <BackupReminder habits={habits} lastBackupAt={storageData?.lastBackupAt} onExport={actions.exportData} />

          {motivationalMessage && habits.length > 0 && effectiveLayout !== "day" && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-work/10 p-3 md:gap-3 md:p-4">
              <Sparkles className="h-4 w-4 flex-shrink-0 text-primary md:h-5 md:w-5" aria-hidden />
              <p className="text-xs text-foreground md:text-sm">{motivationalMessage}</p>
            </div>
          )}

          {effectiveLayout === "day" ? (
            <DailyTracker
              habits={habits}
              completions={completions}
              displayName={storageData?.profile?.name}
              motivationalMessage={motivationalMessage}
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
    <div className="topo-pattern lb-see-through flex h-dvh flex-col overflow-hidden">
      <TopographicBackground />
      <header className="flex-shrink-0 border-b border-border/50 bg-background px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] md:bg-background/80 md:px-6 md:py-5 md:backdrop-blur-xl">
        {/* Fixed geometry on phones: the name truncates and the action buttons
            keep a constant size, so nothing reflows as views or filters change. */}
        <div className="flex h-12 items-center justify-between gap-2 md:h-auto md:gap-4">
          <div className="hidden min-w-0 items-center gap-4 md:flex">
            <DesktopNav activeView={activeView} onSelect={selectView} />
            <div className="min-w-0 border-l border-border pl-4">
              <h1 className="truncate text-xl font-bold tracking-tight text-foreground">{t.viewTitles[activeView]}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground" aria-live="polite">{saveStatus}</p>
            </div>
          </div>
          <AccountHeader
            compact={isMobile}
            pubkey={nostrPubkey}
            fallbackName={storageData?.profile?.name}
            onOpenSettings={openSettings}
            onExport={actions.exportData}
            onLogout={onLogout}
          />
        </div>
        <div className="mt-2 flex h-7 items-baseline justify-between gap-3 md:hidden">
          <h1 className="min-w-0 truncate text-xl font-bold text-foreground">{t.views[activeView]}</h1>
          <p className="shrink-0 text-xs text-muted-foreground" aria-live="polite">{saveStatus}</p>
        </div>
      </header>

      <SwipeViews
        views={viewOrder}
        active={activeView}
        onChange={selectView}
        className="min-h-0 flex-1"
        panelClassName="lb-scroll p-4 pb-[calc(7.25rem+env(safe-area-inset-bottom))] md:p-6"
        renderView={renderView}
      />

      <MobileNav activeView={activeView} onSelect={selectView} />

      {showAddDialog && (
        <AddHabitDialog
          onSave={actions.addHabit}
          onClose={() => setShowAddDialog(false)}
          defaultTime={preferences.defaultReminderTime}
        />
      )}

      {editingHabit && (
        <EditHabitDialog
          habit={editingHabit}
          onSave={actions.updateHabit}
          onDelete={actions.deleteHabitById}
          onArchive={actions.archiveHabit}
          onUnarchive={actions.unarchiveHabit}
          onClose={() => setEditingHabitForDialog(null)}
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
  )
}
