"use client"

import { useState } from "react"
import { Button } from "@/components/habits/ui/button"
import { Card } from "@/components/habits/ui/card"
import { User, Sparkles } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage } from "@/lib/i18n-format"

interface Step4IdentityProps {
  onNext: (data: any) => void
  onBack: () => void
  habitCategory?: string
}

const identityMap: Record<string, { identity: string, description: string, milestones: string[] }> = {
  exercise: {
    identity: "athlete",
    description: "Someone who moves their body and values physical strength",
    milestones: [
"Day 3: You're building the foundation",
"Day 7: Athletes show up consistently",
"Day 21: Your body is adapting",
"Day 66: You've become an athlete"
    ]
  },
  reading: {
    identity: "reader",
    description: "Someone who values knowledge and feeds their mind",
    milestones: [
"Day 3: You're cultivating curiosity",
"Day 7: Readers make time for growth",
"Day 21: Your mind is expanding",
"Day 66: You've become a reader"
    ]
  },
  meditation: {
    identity: "meditator",
    description: "Someone who values inner peace and mental clarity",
    milestones: [
"Day 3: You're learning to be present",
"Day 7: Meditators prioritize calm",
"Day 21: Your mind is quieting",
"Day 66: You've become a meditator"
    ]
  },
  health: {
    identity: "healthy person",
    description: "Someone who takes care of their wellbeing",
    milestones: [
"Day 3: You're honoring your body",
"Day 7: Healthy people make it a priority",
"Day 21: Health is becoming your norm",
"Day 66: You've become a healthy person"
    ]
  },
  morning_routine: {
    identity: "morning person",
    description: "Someone who owns their mornings and starts with intention",
    milestones: [
"Day 3: You're building momentum",
"Day 7: Morning people control their day",
"Day 21: Your mornings are transformed",
"Day 66: You've become a morning person"
    ]
  },
  personal: {
    identity: "dedicated person",
    description: "Someone who commits and follows through",
    milestones: [
"Day 3: You're showing up",
"Day 7: Dedicated people keep promises",
"Day 21: Consistency is your strength",
"Day 66: You've proven your dedication"
    ]
  }
}

export function Step4Identity({ onNext, onBack, habitCategory ="personal" }: Step4IdentityProps) {
  const t = useTranslations().habits.app.onboardingStep4
  const identityData = identityMap[habitCategory] || identityMap.personal
  const identityCopy =
    t.identities[(habitCategory in identityMap ? habitCategory : "personal") as keyof typeof t.identities]
  const [accepted, setAccepted] = useState(false)

  const handleContinue = () => {
    onNext({
      habitData: {
        identity: {
          identityType: identityData.identity,
          milestones: identityData.milestones.map((message, index) => ({
            days: [3, 7, 21, 66][index],
            message,
            achieved: false
          }))
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {formatMessage(t.becomingTitle, { identity: identityCopy.identityTitle })}
        </h2>
        <p className="text-muted-foreground">
          {identityCopy.description}
        </p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/10 via-work/10 to-nutrition/10 border-0">
        <div className="flex items-start space-x-3 mb-4">
          <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">
              {t.researchTitle}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t.researchBody}
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-exercise" />
          <span>{t.journeyTitle}</span>
        </h3>

        <div className="space-y-3">
          {identityCopy.milestones.map((milestone, index) => (
            <Card
              key={index}
              className="p-4 bg-card border-l-4 transition-all hover:shadow-md"
              style={{
                borderLeftColor: index === 0 ? '#8B5CF6' : index === 1 ? '#3B82F6' : index === 2 ? '#10B981' : '#F59E0B'
              }}
            >
              <p className="text-sm font-medium text-foreground">
                {milestone}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-6 bg-exercise/10 border-exercise/30">
        <div className="space-y-3">
          <p className="text-exercise font-medium">
            {formatMessage(t.thinkOfYourself, { identity: identityCopy.identity })}
          </p>
          <p className="text-sm text-exercise">
            {t.youWillSay} <strong>{formatMessage(t.iAmQuote, { identity: identityCopy.identity })}</strong>
            <br />
            {t.eachRepetition}
          </p>
        </div>
      </Card>

      <div className="flex items-center justify-center pt-4">
        <Button
          onClick={() => setAccepted(true)}
          disabled={accepted}
          size="lg"
          className={`
            ${accepted
              ? 'bg-nutrition hover:bg-nutrition/20'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }
            transition-all
          `}
        >
          {accepted ? t.accepted : formatMessage(t.acceptButton, { identity: identityCopy.identityTitle })}
        </Button>
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
          disabled={!accepted}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {t.continue}
        </Button>
      </div>
    </div>
  )
}
