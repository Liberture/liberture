"use client"

import { useState } from "react"
import { Card } from "@/components/habits/ui/card"
import { Button } from "@/components/habits/ui/button"
import { Textarea } from "@/components/habits/ui/textarea"
import { Label } from "@/components/habits/ui/label"
import { Moon, TrendingUp, Heart, Target } from "lucide-react"
import { Habit, HabitCompletion } from "@/lib/habits/types"
import { format } from "date-fns"
import { TopographicBackground } from "@/components/habits/patterns/topographic-background"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface EveningReflectionProps {
  habits: Habit[]
  completions: HabitCompletion[]
  onSaveReflection: (data: {
    emotions: string[]
    reflection: string
    tomorrowPlan: string
  }) => void
  onDismiss: () => void
}

export function EveningReflection({
  habits,
  completions,
  onSaveReflection,
  onDismiss
}: EveningReflectionProps) {
  const t = useTranslations().habits.app.eveningReflection
  const dateLocale = useDateLocale()
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [reflection, setReflection] = useState("")
  const [tomorrowPlan, setTomorrowPlan] = useState("")

  const today = format(new Date(),"yyyy-MM-dd")
  const todayCompletions = completions.filter(c => c.date === today && c.completed)

  const activeHabits = habits.filter(h => !h.archived)
  const completedCount = todayCompletions.length
  const totalCount = activeHabits.length
  const successRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const emotions = [
    { id: "energized", label: t.emotions.energized, emoji: "⚡", color: "#F59E0B" },
    { id: "proud", label: t.emotions.proud, emoji: "💪", color: "#8B5CF6" },
    { id: "calm", label: t.emotions.calm, emoji: "🧘", color: "#10B981" },
    { id: "focused", label: t.emotions.focused, emoji: "🎯", color: "#3B82F6" },
    { id: "grateful", label: t.emotions.grateful, emoji: "🙏", color: "#EC4899" },
    { id: "accomplished", label: t.emotions.accomplished, emoji: "🏆", color: "#6366F1" },
  ]

  const toggleEmotion = (emotionId: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotionId)
        ? prev.filter(e => e !== emotionId)
        : [...prev, emotionId]
    )
  }

  const handleSave = () => {
    onSaveReflection({
      emotions: selectedEmotions,
      reflection,
      tomorrowPlan
    })
  }

  return (
    <div className="topo-pattern lb-see-through lb-wash fixed inset-0 z-50 overflow-auto">
      <TopographicBackground />
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Moon className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                {t.title}
              </h1>
              <p className="text-muted-foreground">
                {format(new Date(),"EEEE, MMMM d", { locale: dateLocale })}
              </p>
            </div>

            {/* Today's Summary */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-work/10 border-0">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold text-foreground">
                    {t.todaysResults}
                  </span>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">
                      {completedCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.completed}
                    </div>
                  </div>

                  <div className="text-2xl text-muted-foreground">/</div>

                  <div className="text-center">
                    <div className="text-4xl font-bold text-muted-foreground">
                      {totalCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.total}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {formatMessage(t.successRate, { percent: successRate })}
                  </div>
                  {successRate >= 70 && (
                    <p className="text-sm text-nutrition mt-1">
                      {t.excellent}
                    </p>
                  )}
                  {successRate >= 40 && successRate < 70 && (
                    <p className="text-sm text-work mt-1">
                      {t.goodEffort}
                    </p>
                  )}
                  {successRate < 40 && successRate > 0 && (
                    <p className="text-sm text-exercise mt-1">
                      {t.newOpportunity}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Emotional Check-in */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold flex items-center space-x-2">
                <Heart className="h-5 w-5 text-mind" />
                <span>{t.feelQuestion}</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                {t.selectAll}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {emotions.map((emotion) => {
                  const isSelected = selectedEmotions.includes(emotion.id)

                  return (
                    <button
                      key={emotion.id}
                      onClick={() => toggleEmotion(emotion.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-transparent shadow-lg'
                          : 'border-border hover:border-border '
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${emotion.color}20` : undefined,
                        borderColor: isSelected ? emotion.color : undefined
                      }}
                    >
                      <div className="text-3xl mb-2">{emotion.emoji}</div>
                      <div className="text-sm font-medium text-foreground">
                        {emotion.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Reflection */}
            <div className="space-y-2">
              <Label htmlFor="reflection" className="text-lg font-semibold">
                {t.obstaclesLabel}
              </Label>
              <Textarea
                id="reflection"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={t.obstaclesPlaceholder}
                rows={3}
              />
            </div>

            {/* Tomorrow's Plan */}
            <div className="space-y-2">
              <Label htmlFor="tomorrow" className="text-lg font-semibold flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-work" />
                <span>{t.tomorrowLabel}</span>
              </Label>
              <Textarea
                id="tomorrow"
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder={t.tomorrowPlaceholder}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {t.planningNote}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="ghost"
                onClick={onDismiss}
                className="text-muted-foreground"
              >
                {t.skipToday}
              </Button>
              <Button
                onClick={handleSave}
                size="lg"
                disabled={selectedEmotions.length === 0}
                className="bg-gradient-to-r from-primary/10 to-primary/10 hover:from-primary/10 hover:to-primary/10"
              >
                {t.complete}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
