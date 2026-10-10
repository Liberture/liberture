"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/habits/ui/card"
import { Button } from "@/components/habits/ui/button"
import { Progress } from "@/components/habits/ui/progress"
import { X } from "lucide-react"
import { OnboardingState, Habit, StorageData } from "@/lib/habits/types"
import { Step1Emotional } from "./step-1-emotional"
import { Step2TinyGoals } from "./step-2-tiny-goals"
import { Step3Implementation } from "./step-3-implementation"
import { Step4Identity } from "./step-4-identity"
import { Step5FirstCompletion } from "./step-5-first-completion"
import { StepConnectAssistant } from "./step-connect-assistant"
import { TopographicBackground } from "@/components/habits/patterns/topographic-background"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface OnboardingFlowProps {
  onComplete: (habit: Habit, onboardingData: OnboardingState) => void
  onSkip: () => void
  /** Owner auth, for the connect step's live "Connected" check. */
  apiKey: string
  isNostrAuth: boolean
}

// Step 1 connects Claude or ChatGPT; steps 2-6 build the first habit.
const CONNECT_STEP = 1

export function OnboardingFlow({ onComplete, onSkip, apiKey, isNostrAuth }: OnboardingFlowProps) {
  const t = useTranslations().habits.app.onboardingFlow
  const [currentStep, setCurrentStep] = useState(1)
  const [onboardingData, setOnboardingData] = useState<OnboardingState>({
    completed: false,
    currentStep: 1,
    skipped: false
  })
  const [habitData, setHabitData] = useState<Partial<Habit>>({
    id: crypto.randomUUID(),
    color: "#8B5CF6",
    schedule: { type: "daily" }
  })

  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  const handleNext = (data: any) => {
    setOnboardingData({ ...onboardingData, ...data, currentStep: currentStep + 1 })
    setHabitData({ ...habitData, ...data.habitData })

    if (currentStep === totalSteps) {
      // Complete onboarding
      const completeHabit: Habit = {
        id: habitData.id!,
        name: habitData.name || t.defaultHabitName,
        time: habitData.time || "08:00",
        color: habitData.color!,
        schedule: habitData.schedule!,
        priority: habitData.priority || 5,
        category: habitData.category || "personal",
        timeOfDay: habitData.timeOfDay || "morning",
        implementationIntention: habitData.implementationIntention,
        identity: habitData.identity,
        tinyHabit: habitData.tinyHabit,
        createdAt: new Date().toISOString(),
        // Local day; createdAt alone is UTC (see Habit.startDate).
        startDate: new Date().toLocaleDateString("en-CA"),
        streakData: {
          current: 0,
          longest: 0,
          freezesAvailable: 0,
          freezesUsed: 0,
          milestones: [
            { days: 3, celebrated: false },
            { days: 7, celebrated: false },
            { days: 21, celebrated: false },
            { days: 66, celebrated: false },
            { days: 100, celebrated: false }
          ]
        }
      }

      onComplete(completeHabit, { ...onboardingData, completed: true, currentStep: totalSteps })
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  return (
    <div className="topo-pattern lb-see-through min-h-screen flex items-center justify-center p-4">
      <TopographicBackground />
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardContent className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {currentStep === CONNECT_STEP ? t.welcomeTitle : t.buildTitle}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {formatMessage(t.stepOf, { current: currentStep, total: totalSteps })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              aria-label={t.skipAriaLabel}
              className="text-muted-foreground hover:text-muted-foreground "
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <Progress value={progress} className="mb-8" />

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === CONNECT_STEP && (
              <StepConnectAssistant apiKey={apiKey} isNostrAuth={isNostrAuth} onNext={() => handleNext({})} />
            )}
            {currentStep === 2 && (
              <Step1Emotional onNext={handleNext} />
            )}
            {currentStep === 3 && (
              <Step2TinyGoals onNext={handleNext} onBack={handleBack} habitName={habitData.name} />
            )}
            {currentStep === 4 && (
              <Step3Implementation onNext={handleNext} onBack={handleBack} habitName={habitData.name} />
            )}
            {currentStep === 5 && (
              <Step4Identity onNext={handleNext} onBack={handleBack} habitCategory={habitData.category} />
            )}
            {currentStep === 6 && (
              <Step5FirstCompletion onNext={handleNext} onBack={handleBack} habitData={habitData} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
