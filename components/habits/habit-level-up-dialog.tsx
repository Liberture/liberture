"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/habits/ui/dialog"
import { Button } from "@/components/habits/ui/button"
import { Card } from "@/components/habits/ui/card"
import { TrendingUp, Sparkles, Target } from "lucide-react"
import { TinyHabitConfig } from "@/lib/habits/types"
import { NeuralPathwayViz } from "./neural-pathway-viz"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"

interface HabitLevelUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habitName: string
  tinyHabit: TinyHabitConfig
  currentStreak: number
  onLevelUp: (newLevel: "tiny" |"medium" |"full") => void
}

export function HabitLevelUpDialog({
  open,
  onOpenChange,
  habitName,
  tinyHabit,
  currentStreak,
  onLevelUp
}: HabitLevelUpDialogProps) {
  const t = useTranslations().habits.app.habitLevelUpDialog
  const [selectedLevel, setSelectedLevel] = useState<"tiny" |"medium" |"full" | null>(null)

  const handleConfirm = () => {
    if (selectedLevel) {
      onLevelUp(selectedLevel)
      onOpenChange(false)
    }
  }

  const getNextLevel = (): "medium" |"full" | null => {
    if (tinyHabit.currentLevel ==="tiny") return "medium"
    if (tinyHabit.currentLevel ==="medium") return "full"
    return null
  }

  const nextLevel = getNextLevel()
  const recommendedLevel = nextLevel || tinyHabit.currentLevel

  const levels = [
    {
      id: "tiny" as const,
      label: t.levels.tiny.label,
      description: tinyHabit.tinyVersion,
      color: "#3B82F6",
      icon: Target,
      reason: t.levels.tiny.reason
    },
    ...(tinyHabit.mediumVersion ? [{
      id: "medium" as const,
      label: t.levels.medium.label,
      description: tinyHabit.mediumVersion,
      color: "#F59E0B",
      icon: TrendingUp,
      reason: t.levels.medium.reason
    }] : []),
    {
      id: "full" as const,
      label: t.levels.full.label,
      description: tinyHabit.fullVersion,
      color: "#10B981",
      icon: Sparkles,
      reason: t.levels.full.reason
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <Sparkles className="h-6 w-6 text-exercise" />
            <span>{t.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Celebration */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 via-work/10 to-nutrition/10 border-0">
            <div className="text-center space-y-3">
              <h3 className="text-3xl font-bold text-foreground">
                🎉 {plural(t.streak, currentStreak)}
              </h3>
              <p className="text-lg text-muted-foreground">
                {formatMessage(t.proven, { name: habitName })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.pathway}
              </p>
            </div>
          </Card>

          {/* Neural Pathway Progress */}
          <NeuralPathwayViz currentStreak={currentStreak} />

          {/* The Choice */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                {t.chooseTitle}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.chooseBody}
              </p>
            </div>

            <div className="space-y-3">
              {levels.map((level) => {
                const Icon = level.icon
                const isRecommended = level.id === recommendedLevel
                const isSelected = selectedLevel === level.id

                return (
                  <Card
                    key={level.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-offset-2' : ''
                    } ${isRecommended ? 'border-2 border-exercise/30 ' : ''}`}
                    style={{
                      borderColor: isSelected ? level.color : undefined,
                      backgroundColor: isSelected ? `${level.color}10` : undefined
                    }}
                    onClick={() => setSelectedLevel(level.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className="p-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: `${level.color}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: level.color }} />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-foreground">
                            {level.label}
                          </h4>
                          {isRecommended && (
                            <span className="px-2 py-0.5 bg-exercise/10 text-exercise text-xs font-medium rounded-full">
                              {t.recommended}
                            </span>
                          )}
                        </div>

                        <p className="text-lg text-muted-foreground font-medium">
"{level.description}"
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {level.reason}
                        </p>
                      </div>

                      <div className="flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-transparent' : 'border-border'
                          }`}
                          style={{
                            backgroundColor: isSelected ? level.color : 'transparent'
                          }}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-foreground" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Recommendation */}
          {nextLevel && (
            <Card className="p-4 bg-work/10 border-work/30">
              <p className="text-sm text-work">
                <strong>💡 {t.insightLabel}</strong>{" "}
                {formatMessage(t.insightBody, {
                  streak: currentStreak,
                  version: (nextLevel ==="medium" ? tinyHabit.mediumVersion : tinyHabit.fullVersion) ?? "",
                })}
              </p>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.decideLater}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedLevel}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t.confirm}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
