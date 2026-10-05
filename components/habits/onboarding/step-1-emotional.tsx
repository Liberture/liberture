"use client"

import { useState } from "react"
import { Button } from "@/components/habits/ui/button"
import { Card } from "@/components/habits/ui/card"
import { Dumbbell, Book, Heart, Sunrise, Sparkles, Target } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"

interface Step1EmotionalProps {
  onNext: (data: any) => void
}

const baseCategories = [
  {
    id: "exercise",
    icon: Dumbbell,
    color: "#8B5CF6",
    exampleTime: "07:00"
  },
  {
    id: "reading",
    icon: Book,
    color: "#3B82F6",
    exampleTime: "20:00"
  },
  {
    id: "meditation",
    icon: Heart,
    color: "#10B981",
    exampleTime: "06:30"
  },
  {
    id: "health",
    icon: Sparkles,
    color: "#F59E0B",
    exampleTime: "08:00"
  },
  {
    id: "morning_routine",
    icon: Sunrise,
    color: "#EC4899",
    exampleTime: "06:00"
  },
  {
    id: "personal",
    icon: Target,
    color: "#6366F1",
    exampleTime: "09:00"
  }
]

export function Step1Emotional({ onNext }: Step1EmotionalProps) {
  const t = useTranslations().habits.app.onboardingStep1
  const categories = baseCategories.map((category) => ({
    ...category,
    ...t.categories[category.id as keyof typeof t.categories],
  }))
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[0] | null>(null)
  const [showStory, setShowStory] = useState(false)

  const handleCategorySelect = (category: typeof categories[0]) => {
    setSelectedCategory(category)
    setShowStory(true)
  }

  const handleContinue = () => {
    if (!selectedCategory) return

    onNext({
      emotionalConnection: {
        category: selectedCategory.id,
        story: selectedCategory.story
      },
      habitData: {
        name: selectedCategory.exampleHabit,
        time: selectedCategory.exampleTime,
        color: selectedCategory.color,
        category: selectedCategory.id,
        timeOfDay: selectedCategory.exampleTime <"12:00" ? "morning" : selectedCategory.exampleTime <"17:00" ? "afternoon" : "evening"
      }
    })
  }

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

      {!showStory ? (
        <div className="grid grid-cols-2 gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory?.id === category.id

            return (
              <Card
                key={category.id}
                className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-offset-2' : ''
                }`}
                style={{
                  borderColor: isSelected ? category.color : undefined,
                  backgroundColor: isSelected ? `${category.color}10` : undefined
                }}
                onClick={() => handleCategorySelect(category)}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className="p-3 rounded-full"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: category.color }} />
                  </div>
                  <span className="font-medium text-foreground">
                    {category.name}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {selectedCategory && (
            <>
              <Card className="p-6 bg-gradient-to-br from-primary/10 to-work/10 border-0">
                <div className="flex items-start space-x-4">
                  {(() => {
                    const Icon = selectedCategory.icon
                    return (
                      <div
                        className="p-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: `${selectedCategory.color}20` }}
                      >
                        <Icon className="h-8 w-8" style={{ color: selectedCategory.color }} />
                      </div>
                    )
                  })()}
                  <div className="space-y-2 flex-1">
                    <h3 className="text-xl font-bold text-foreground">
                      {selectedCategory.name}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedCategory.story}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setShowStory(false)}
                >
                  {t.chooseDifferent}
                </Button>
                <Button
                  onClick={handleContinue}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {t.continue}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {!showStory && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t.customizeLater}
          </p>
        </div>
      )}
    </div>
  )
}
