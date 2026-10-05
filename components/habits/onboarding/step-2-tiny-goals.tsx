"use client"

import { useState } from "react"
import { Button } from "@/components/habits/ui/button"
import { Input } from "@/components/habits/ui/input"
import { Label } from "@/components/habits/ui/label"
import { Card } from "@/components/habits/ui/card"
import { Lightbulb, TrendingUp } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"

interface Step2TinyGoalsProps {
  onNext: (data: any) => void
  onBack: () => void
  habitName?: string
}

export function Step2TinyGoals({ onNext, onBack, habitName ="My Habit" }: Step2TinyGoalsProps) {
  const t = useTranslations().habits.app.onboardingStep2
  const [tinyVersion, setTinyVersion] = useState("")
  const [fullVersion, setFullVersion] = useState("")

  const handleContinue = () => {
    if (!tinyVersion || !fullVersion) return

    onNext({
      habitData: {
        tinyHabit: {
          tinyVersion,
          fullVersion,
          currentLevel: "tiny" as const,
          readyToLevelUp: false
        }
      }
    })
  }

  const examples = t.examples

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {t.title}
        </h2>
        <p className="text-muted-foreground">
          {t.subtitle}
        </p>
      </div>

      <Card className="p-6 bg-work/10 border-work/30">
        <div className="flex items-start space-x-3">
          <Lightbulb className="h-5 w-5 text-work flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-work">
              {t.whyTitle}
            </h3>
            <p className="text-sm text-work">
              {t.whyBody}
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tiny-version">
            {t.tinyLabel}
          </Label>
          <Input
            id="tiny-version"
            value={tinyVersion}
            onChange={(e) => setTinyVersion(e.target.value)}
            placeholder={examples.default.tiny}
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground">
            {t.tinyExamples}
          </p>
        </div>

        <div className="flex items-center space-x-4 py-2">
          <div className="h-px flex-1 bg-secondary" />
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <div className="h-px flex-1 bg-secondary" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="full-version">
            {t.fullLabel}
          </Label>
          <Input
            id="full-version"
            value={fullVersion}
            onChange={(e) => setFullVersion(e.target.value)}
            placeholder={examples.default.full}
            className="text-lg"
          />
          <p className="text-xs text-muted-foreground">
            {t.fullExamples}
          </p>
        </div>
      </div>

      <Card className="p-4 bg-nutrition/10 border-nutrition/30">
        <p className="text-sm text-nutrition">
          <strong>{t.pathLabel}</strong> {t.pathBody}
        </p>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button
          variant="ghost"
          onClick={onBack}
        >
          {t.back}
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!tinyVersion || !fullVersion}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t.continue}
        </Button>
      </div>
    </div>
  )
}
