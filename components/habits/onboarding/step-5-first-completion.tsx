"use client"

import { useState } from "react"
import { Button } from "@/components/habits/ui/button"
import { Card } from "@/components/habits/ui/card"
import { Zap, CheckCircle2, Bell } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

// Graceful fallback for confetti
const triggerConfetti = () => {
  // Try to load canvas-confetti dynamically
  try {
    import('canvas-confetti').then((confettiModule) => {
      const confetti = confettiModule.default
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        })
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        })
      }, 250)
    }).catch(() => {
      console.log('Confetti not available')
    })
  } catch {
    console.log('Confetti not available')
  }
}

interface Step5FirstCompletionProps {
  onNext: (data: any) => void
  onBack: () => void
  habitData: any
}

export function Step5FirstCompletion({ onNext, onBack, habitData }: Step5FirstCompletionProps) {
  const t = useTranslations().habits.app.onboardingStep5
  const [completed, setCompleted] = useState(false)
  const [enableNotifications, setEnableNotifications] = useState(false)

  const handleComplete = () => {
    setCompleted(true)
    // Trigger confetti celebration
    triggerConfetti()
  }

  const handleFinish = () => {
    onNext({
      enableNotifications,
      firstCompletionDate: new Date().toISOString()
    })
  }

  const tinyVersion = habitData.tinyHabit?.tinyVersion || t.defaultTinyHabit

  return (
    <div className="space-y-6">
      {!completed ? (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {t.title}
            </h2>
            <p className="text-muted-foreground">
              {t.subtitle}
            </p>
          </div>

          <Card className="p-6 bg-gradient-to-br from-exercise/10 to-destructive/10 border-0">
            <div className="flex items-start space-x-3">
              <Zap className="h-6 w-6 text-exercise flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-exercise">
                  {t.whyNowTitle}
                </h3>
                <p className="text-sm text-exercise">
                  {t.whyNowBody}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-center py-8">
            <Card className="p-8 bg-gradient-to-br from-primary/10 to-work/10 border-2 border-primary/30">
              <div className="text-center space-y-4">
                <p className="text-lg text-muted-foreground">
                  {t.yourTinyHabit}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {tinyVersion}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t.rememberSmall}
                </p>
              </div>
            </Card>
          </div>

          <div className="flex items-center justify-center">
            <Button
              onClick={handleComplete}
              size="lg"
              className="bg-gradient-to-r from-nutrition/10 to-nutrition/10 hover:from-nutrition/10 hover:to-nutrition/10 text-lg px-8 py-6"
            >
              <CheckCircle2 className="h-6 w-6 mr-2" />
              {t.iDidIt}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t.takeSeconds}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <div className="h-20 w-20 bg-nutrition/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-nutrition" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              {t.congratulations}
            </h2>
            <p className="text-xl text-muted-foreground">
              {formatMessage(t.youBecame, {
                identity: habitData.identity?.identityType
                  ? t.identityByCategory[habitData.category as keyof typeof t.identityByCategory] ?? habitData.identity.identityType
                  : t.defaultIdentity,
              })}
            </p>
          </div>

          <Card className="p-6 bg-gradient-to-br from-nutrition/10 to-nutrition/10 border-nutrition/30">
            <div className="space-y-3">
              <h3 className="font-semibold text-nutrition">
                {t.brainTitle}
              </h3>
              <ul className="space-y-2 text-sm text-nutrition">
                <li className="flex items-start space-x-2">
                  <span className="text-nutrition">•</span>
                  <span>{t.brainDopamine}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-nutrition">•</span>
                  <span>{t.brainNeural}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-nutrition">•</span>
                  <span>{t.brainProof}</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-4 border-2 border-dashed border-border">
            <div className="flex items-start space-x-3">
              <Bell className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-2">
                  {t.reminderTitle}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {formatMessage(t.reminderBody, { time: habitData.time || '08:00' })}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={enableNotifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnableNotifications(true)}
                  >
                    {t.remindYes}
                  </Button>
                  <Button
                    variant={!enableNotifications ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnableNotifications(false)}
                  >
                    {t.remindNo}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={onBack}
            >
              {t.back}
            </Button>
            <Button
              onClick={handleFinish}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t.startJourney}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
