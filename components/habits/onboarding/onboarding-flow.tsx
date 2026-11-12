"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/habits/ui/card"
import { Button } from "@/components/habits/ui/button"
import { X } from "lucide-react"
import { OnboardingState, Habit } from "@/lib/habits/types"
import { Step1Emotional } from "./step-1-emotional"
import { StepConnectAssistant } from "./step-connect-assistant"
import { TopographicBackground } from "@/components/habits/patterns/topographic-background"
import { useTranslations } from "@/components/i18n/locale-provider"

interface OnboardingFlowProps {
  onComplete: (habits: Habit[], onboardingData: OnboardingState) => void
  onSkip: () => void
  /** Owner auth, for the connect step's live "Connected" check. */
  apiKey: string
}

export function OnboardingFlow({ onComplete, onSkip, apiKey }: OnboardingFlowProps) {
  const [page, setPage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const app = useTranslations().habits.app
  return (
    <div className="topo-pattern lb-see-through min-h-screen flex items-center justify-center p-4">
      <TopographicBackground />
      <Card className="w-full max-w-2xl overflow-hidden shadow-2xl">
        <div role="progressbar" aria-label={app.onboardingFlow.welcomeTitle} aria-valuemin={0} aria-valuemax={6} aria-valuenow={page} className="h-1 bg-secondary">
          <div className="onboarding-progress-fill h-full motion-safe:transition-[width]" style={{ width: `${(page / 6) * 100}%` }} />
        </div>
        <CardContent className="p-6 sm:p-8">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSkip}
              aria-label={app.onboardingFlow.skipAriaLabel}
              className="-mr-2 -mt-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {page === 1 ? (
            <StepConnectAssistant apiKey={apiKey} onNext={() => setPage(2)} />
          ) : (
            <Step1Emotional page={page} onPageChange={setPage}
              onStart={habits => onComplete(habits, { completed: true, currentStep: 6, skipped: false })} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
