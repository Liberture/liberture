"use client"

import { useTracker } from "./use-tracker"

/**
 * Where the site's primary call-to-action should point.
 *
 * Before setup: the wizard, with whatever the surrounding copy calls it.
 * After setup: the tracker — someone who already has habits running doesn't
 * need to be invited to start over.
 *
 * Falls back to the "start" state until localStorage has been read, so server
 * and client markup agree on first paint.
 */
export function useTrackerEntry(startLabel: string, resumeLabel = "Dashboard") {
  const { state, hydrated } = useTracker()
  const setUp = hydrated && state.onboarded

  return {
    href: setUp ? "/tracker" : "/get-started",
    label: setUp ? resumeLabel : startLabel,
    setUp,
  }
}
