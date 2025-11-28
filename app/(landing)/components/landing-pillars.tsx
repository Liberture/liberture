import { Brain, Heart, Leaf, Zap, Dumbbell, Wallet } from "lucide-react"
import { translations } from "@/lib/translations"
import { LandingSection, LandingSectionHeader } from "./landing-section"

const pillarIcons = {
  cognition: Brain,
  recovery: Heart,
  fueling: Leaf,
  mental: Zap,
  physicality: Dumbbell,
  finance: Wallet,
}

const pillarStyles = {
  cognition: {
    color: "from-cognition/20 to-cognition/5",
    borderColor: "border-cognition/30",
    textColor: "text-cognition",
  },
  recovery: {
    color: "from-recovery/20 to-recovery/5",
    borderColor: "border-recovery/30",
    textColor: "text-recovery",
  },
  fueling: {
    color: "from-fueling/20 to-fueling/5",
    borderColor: "border-fueling/30",
    textColor: "text-fueling",
  },
  mental: {
    color: "from-mental/20 to-mental/5",
    borderColor: "border-mental/30",
    textColor: "text-mental",
  },
  physicality: {
    color: "from-physicality/20 to-physicality/5",
    borderColor: "border-physicality/30",
    textColor: "text-physicality",
  },
  finance: {
    color: "from-finance/20 to-finance/5",
    borderColor: "border-finance/30",
    textColor: "text-finance",
  },
}

export function LandingPillars() {
  const { pillars } = translations.en.landing
  const pillarContent = translations.en.common.pillars
  return (
    <LandingSection id="pillars" className="bg-card/30">
      <LandingSectionHeader heading={pillars.heading} description={pillars.description} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillarContent.map((pillar) => {
          const Icon = pillarIcons[pillar.id]
          const { color, borderColor, textColor } = pillarStyles[pillar.id]
          return (
            <div
              key={pillar.id}
              className={`p-6 rounded-2xl bg-gradient-to-b ${color} border ${borderColor} hover:scale-105 transition-transform`}
            >
              <Icon className={`h-10 w-10 ${textColor} mb-4`} />
              <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>{pillar.name}</h3>
              <p className="text-sm text-muted-foreground">{pillar.description}</p>
            </div>
          )
        })}
      </div>
    </LandingSection>
  )
}
