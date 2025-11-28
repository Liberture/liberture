import { Card, CardContent } from "@/components/ui/card"
import { Brain, Moon, Flame, Heart, Dumbbell, Wallet } from "lucide-react"

const pillars = [
  {
    name: "Work",
    icon: Brain,
    score: 78,
    trend: "+5",
    color: "indigo",
    description: "Focus & Mental Clarity",
    metrics: ["Focus: 82%", "Memory: 74%", "Processing: 78%"],
  },
  {
    name: "Sleep",
    icon: Moon,
    score: 85,
    trend: "+3",
    color: "cyan",
    description: "Sleep & Restoration",
    metrics: ["Sleep: 7.5h", "HRV: 65ms", "Sleep: 88%"],
  },
  {
    name: "Nutrition",
    icon: Flame,
    score: 72,
    trend: "-2",
    color: "green",
    description: "Nutrition & Energy",
    metrics: ["Calories: 2100", "Protein: 145g", "Hydration: 85%"],
  },
  {
    name: "Mind",
    icon: Heart,
    score: 81,
    trend: "+7",
    color: "pink",
    description: "Emotional Resilience",
    metrics: ["Mood: Balanced", "Stress: Low", "Mindfulness: 20m"],
  },
  {
    name: "Exercise",
    icon: Dumbbell,
    score: 68,
    trend: "+1",
    color: "orange",
    description: "Movement & Strength",
    metrics: ["Steps: 8,234", "Active: 45m", "Strength: 72%"],
  },
  {
    name: "Finance",
    icon: Wallet,
    score: 74,
    trend: "+4",
    color: "yellow",
    description: "Wealth & Abundance",
    metrics: ["Savings: 22%", "Invest: Active", "Budget: On Track"],
  },
]

const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  indigo: {
    bg: "bg-indigo-900/50",
    border: "border-indigo-500/50",
    text: "text-indigo-400",
    glow: "shadow-indigo-500/20",
  },
  cyan: {
    bg: "bg-cyan-900/50",
    border: "border-cyan-500/50",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20",
  },
  green: {
    bg: "bg-green-900/50",
    border: "border-green-500/50",
    text: "text-green-400",
    glow: "shadow-green-500/20",
  },
  pink: {
    bg: "bg-pink-900/50",
    border: "border-pink-500/50",
    text: "text-pink-400",
    glow: "shadow-pink-500/20",
  },
  orange: {
    bg: "bg-orange-900/50",
    border: "border-orange-500/50",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  yellow: {
    bg: "bg-yellow-900/50",
    border: "border-yellow-500/50",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
  },
}

export function PillarGrid() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Optimization Pillars</h2>
        <span className="text-sm text-gray-400">System Health: 76%</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillars.map((pillar) => {
          const colors = colorClasses[pillar.color]
          const Icon = pillar.icon

          return (
            <Card
              key={pillar.name}
              className={`${colors.bg} ${colors.border} border backdrop-blur-sm shadow-xl ${colors.glow} rounded-2xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl ${colors.bg} ${colors.border} border`}>
                    <Icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${colors.text}`}>{pillar.score}</p>
                    <p className={`text-xs ${pillar.trend.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                      {pillar.trend}%
                    </p>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-100 mb-1">{pillar.name}</h3>
                <p className="text-xs text-gray-400 mb-3">{pillar.description}</p>

                <div className="space-y-1">
                  {pillar.metrics.map((metric, i) => (
                    <p key={i} className="text-xs text-gray-500">
                      {metric}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
