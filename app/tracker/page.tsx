"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"

import { useTranslations } from "@/components/i18n/locale-provider"
import { HabitTracker } from "@/components/habits/habit-tracker"
import { useHabitsSession } from "@/components/habits/session-provider"

/** The signed-in habit tracker. Signed-out visitors get the sign-in dialog. */
export default function TrackerPage() {
  const { isChecking, isSignedIn, auth, openSignIn, logout } = useHabitsSession()
  const t = useTranslations().habits.app.shell

  useEffect(() => {
    if (!isChecking && !isSignedIn) openSignIn({ next: null })
  }, [isChecking, isSignedIn, openSignIn])

  if (isChecking || !isSignedIn) {
    return (
      <main className="lb-wash flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {isChecking ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
              <p className="text-muted-foreground">{t.checking}</p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => openSignIn({ next: null })}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t.signIn}
            </button>
          )}
        </div>
      </main>
    )
  }

  const isNostrAuth = auth.type !== "api-key"

  return (
    <main className="lb-wash min-h-screen">
      <HabitTracker apiKey={auth.apiKey ?? ""} isNostrAuth={isNostrAuth} onLogout={logout} />
    </main>
  )
}
