"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { useHabitsSession } from "@/components/habits/session-provider"

/** Sign-up buttons; signed-in visitors get a link to their tracker instead. */
export function GetStartedActions({ create, signIn, openTracker }: { create: string; signIn: string; openTracker: string }) {
  const { isSignedIn, openSignIn } = useHabitsSession()
  const primary = "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"

  if (isSignedIn) {
    return (
      <div className="mt-8">
        <Link href="/tracker" className={primary}>
          {openTracker}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    )
  }
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <button type="button" onClick={() => openSignIn()} className={primary}>
        {create}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => openSignIn()}
        className="inline-flex items-center justify-center rounded-lg border border-border bg-secondary px-6 py-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
      >
        {signIn}
      </button>
    </div>
  )
}
