"use client"

import { Card } from "@/components/habits/ui/card"
import { Brain, Zap } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/habits/ui/tooltip"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"

interface NeuralPathwayVizProps {
  currentStreak: number
  showLabel?: boolean
  compact?: boolean
}

export function NeuralPathwayViz({ currentStreak, showLabel = true, compact = false }: NeuralPathwayVizProps) {
  const t = useTranslations().habits.app.neuralPathwayViz
  // Neural pathway stages based on neuroscience research
  const stages = [
    { days: 0, label: t.stages.starting.label, description: t.stages.starting.description, color: "#E5E7EB" },
    { days: 1, label: t.stages.weak.label, description: t.stages.weak.description, color: "#FCA5A5" },
    { days: 7, label: t.stages.forming.label, description: t.stages.forming.description, color: "#FDBA74" },
    { days: 21, label: t.stages.strengthening.label, description: t.stages.strengthening.description, color: "#FCD34D" },
    { days: 66, label: t.stages.automatic.label, description: t.stages.automatic.description, color: "#86EFAC" },
  ]

  // Determine current stage
  let currentStage = stages[0]
  for (let i = stages.length - 1; i >= 0; i--) {
    if (currentStreak >= stages[i].days) {
      currentStage = stages[i]
      break
    }
  }

  // Calculate progress within current stage
  const nextStageIndex = stages.findIndex(s => s.days > currentStreak)
  const nextStage = nextStageIndex !== -1 ? stages[nextStageIndex] : stages[stages.length - 1]

  const progressStart = currentStage.days
  const progressEnd = nextStage.days
  const progressPercent = progressEnd > progressStart
    ? Math.min(100, ((currentStreak - progressStart) / (progressEnd - progressStart)) * 100)
    : 100

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4" style={{ color: currentStage.color }} />
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: currentStage.color
                  }}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{currentStage.label}</p>
            <p className="text-xs text-muted-foreground">{currentStage.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-start space-x-3">
        <div
          className="p-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: `${currentStage.color}40` }}
        >
          <Brain className="h-5 w-5" style={{ color: currentStage.color }} />
        </div>

        <div className="flex-1 space-y-3">
          {showLabel && (
            <div>
              <h3 className="font-semibold text-foreground flex items-center space-x-2">
                <span>{t.title}</span>
                {currentStreak >= 66 && <Zap className="h-4 w-4 text-nutrition" />}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentStage.description}
              </p>
            </div>
          )}

          {/* Progress bar with stages */}
          <div className="space-y-2">
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-full"
                style={{
                  width: `${Math.min(100, (currentStreak / 66) * 100)}%`,
                  background: `linear-gradient(to right, #FCA5A5, #FDBA74, #FCD34D, #86EFAC)`
                }}
              />
            </div>

            {/* Stage markers */}
            <div className="flex justify-between text-xs">
              {stages.slice(1).map((stage, index) => (
                <div
                  key={stage.days}
                  className={`flex flex-col items-center ${
                    currentStreak >= stage.days
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground '
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mb-1 ${
                      currentStreak >= stage.days ? 'ring-2 ring-offset-1' : ''
                    }`}
                    style={{
                      backgroundColor: currentStreak >= stage.days ? stage.color : '#D1D5DB'
                    }}
                  />
                  <span className="hidden sm:inline">{stage.label}</span>
                  <span className="text-[10px] text-muted-foreground">{formatMessage(t.daysShort, { count: stage.days })}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current status */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatMessage(t.dayStatus, { day: currentStreak, stage: currentStage.label })}
            </span>
            {currentStreak < 66 && (
              <span className="text-muted-foreground text-xs">
                {plural(t.daysToAutomatic, 66 - currentStreak)}
              </span>
            )}
          </div>

          {/* Educational note */}
          {currentStreak >= 21 && currentStreak < 66 && (
            <p className="text-xs text-work bg-work/10 p-2 rounded">
              {t.myelinNote}
            </p>
          )}

          {currentStreak >= 66 && (
            <p className="text-xs text-nutrition bg-nutrition/10 p-2 rounded">
              {t.automaticNote}
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
