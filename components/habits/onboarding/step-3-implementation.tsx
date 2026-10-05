"use client"

import { useState } from "react"
import { Button } from "@/components/habits/ui/button"
import { Input } from "@/components/habits/ui/input"
import { Label } from "@/components/habits/ui/label"
import { Card } from "@/components/habits/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/habits/ui/select"
import { Brain, ArrowRight } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface Step3ImplementationProps {
  onNext: (data: any) => void
  onBack: () => void
  habitName?: string
}

export function Step3Implementation({ onNext, onBack, habitName }: Step3ImplementationProps) {
  const t = useTranslations().habits.app.onboardingStep3
  const commonTriggers = [...t.triggers, t.customTrigger]
  const habitLabel = habitName || t.defaultHabitName
  const [trigger, setTrigger] = useState("")
  const [customTrigger, setCustomTrigger] = useState("")
  const [behavior, setBehavior] = useState("")

  const handleContinue = () => {
    const finalTrigger = trigger === t.customTrigger ? customTrigger : trigger
    if (!finalTrigger || !behavior) return

    onNext({
      habitData: {
        implementationIntention: {
          trigger: finalTrigger,
          behavior,
          obstacles: []
        }
      }
    })
  }

  const isCustom = trigger === t.customTrigger

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

      <Card className="p-6 bg-primary/10 border-primary/30">
        <div className="flex items-start space-x-3">
          <Brain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-primary">
              {t.researchTitle}
            </h3>
            <p className="text-sm text-primary">
              {t.researchBody}
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6 bg-gradient-to-r from-work/10 to-primary/10 border-0">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-foreground">{t.ifLabel}</span>
              <div className="flex-1 space-y-2">
                <Label htmlFor="trigger" className="text-xs text-muted-foreground">
                  {t.chooseTrigger}
                </Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger id="trigger" className="bg-card">
                    <SelectValue placeholder={t.selectTriggerPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {commonTriggers.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isCustom && (
              <div className="pl-12">
                <Input
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  placeholder={t.customTriggerPlaceholder}
                  className="bg-card"
                />
              </div>
            )}

            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-foreground">{t.thenLabel}</span>
              <div className="flex-1 space-y-2">
                <Label htmlFor="behavior" className="text-xs text-muted-foreground">
                  {t.iWill}
                </Label>
                <Input
                  id="behavior"
                  value={behavior}
                  onChange={(e) => setBehavior(e.target.value)}
                  placeholder={formatMessage(t.behaviorPlaceholder, { habit: habitLabel })}
                  className="bg-card text-lg"
                />
              </div>
            </div>
          </div>
        </Card>

        {trigger && behavior && (
          <Card className="p-4 bg-nutrition/10 border-nutrition/30">
            <p className="text-sm font-medium text-nutrition">
              {t.yourIntention}
            </p>
            <p className="text-nutrition mt-2">
{formatMessage(t.intentionSummary, { trigger: trigger === t.customTrigger ? customTrigger : trigger, behavior })}
            </p>
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button
          variant="ghost"
          onClick={onBack}
        >
          {t.back}
        </Button>
        <Button
          onClick={handleContinue}
          disabled={(!trigger || trigger === t.customTrigger && !customTrigger) || !behavior}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t.continue}
        </Button>
      </div>
    </div>
  )
}
