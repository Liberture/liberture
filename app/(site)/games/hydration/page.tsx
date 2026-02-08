"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Droplet, TrendingUp, Brain, AlertCircle, CheckCircle } from "lucide-react"
import { GameEngine, GameTime } from "@/components/games/GameEngine"
import { GameScene } from "@/components/games/GameScene"
import { Button } from "@/components/ui/button"

interface HydrationMetrics {
  hydrationLevel: number // 0-100%
  energyLevel: number // 0-100
  cognitivePerformance: number // 0-100
  waterIntake: number // ml
  consecutiveGoodDays: number
}

interface WaterLog {
  time: string
  amount: number
}

export default function HydrationGamePage() {
  // Game state
  const [metrics, setMetrics] = useState<HydrationMetrics>({
    hydrationLevel: 50,
    energyLevel: 50,
    cognitivePerformance: 50,
    waterIntake: 0,
    consecutiveGoodDays: 0,
  })
  const [waterLog, setWaterLog] = useState<WaterLog[]>([])
  const [lastDrinkHour, setLastDrinkHour] = useState<number>(6)
  const [characterState, setCharacterState] = useState<"standing" | "sleeping">("standing")
  const [feedback, setFeedback] = useState<Array<{ type: "good" | "bad" | "warning", message: string }>>([])

  // Automated light schedule (from sleep game optimal settings)
  const lightSchedule = {
    morningBright: 7,
    eveningDim: 19,
    nightOff: 21,
  }

  // Automated bedtime
  const bedtime = 22

  const calculateLightLevel = (hour: number): number => {
    if (hour >= lightSchedule.nightOff || hour < lightSchedule.morningBright) return 0
    if (hour >= lightSchedule.morningBright && hour < 12) return 100
    if (hour >= 12 && hour < lightSchedule.eveningDim) return 100
    if (hour >= lightSchedule.eveningDim && hour < lightSchedule.nightOff) return 30
    return 50
  }

  // Drink water function
  const drinkWater = (time: GameTime, amount: number = 250) => {
    const timeStr = `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`
    
    setWaterLog((prev) => [...prev, { time: timeStr, amount }])
    setLastDrinkHour(time.hour)
    
    // Update metrics immediately
    setMetrics((prev) => ({
      ...prev,
      hydrationLevel: Math.min(100, prev.hydrationLevel + 15),
      waterIntake: prev.waterIntake + amount,
      energyLevel: Math.min(100, prev.energyLevel + 5),
      cognitivePerformance: Math.min(100, prev.cognitivePerformance + 8),
    }))

    // Positive feedback
    setFeedback([
      { type: "good", message: `+${amount}ml water! Keep it up! 💧` }
    ])

    setTimeout(() => setFeedback([]), 3000)
  }

  // Handle time changes
  const handleTimeChange = (time: GameTime) => {
    const shouldBeSleeping = time.hour >= bedtime || time.hour < 6
    setCharacterState(shouldBeSleeping ? "sleeping" : "standing")

    // Gradual dehydration over time (when awake)
    if (!shouldBeSleeping && time.minute % 5 === 0) {
      setMetrics((prev) => {
        const newHydration = Math.max(0, prev.hydrationLevel - 1)
        const newEnergy = newHydration > 30 ? prev.energyLevel : Math.max(0, prev.energyLevel - 2)
        const newCognitive = newHydration > 20 ? prev.cognitivePerformance : Math.max(0, prev.cognitivePerformance - 3)
        
        return {
          ...prev,
          hydrationLevel: newHydration,
          energyLevel: newEnergy,
          cognitivePerformance: newCognitive,
        }
      })

      // Warnings for dehydration
      if (metrics.hydrationLevel < 40) {
        setFeedback([
          { type: "warning", message: "Hydration dropping! Time to drink water." }
        ])
      }
      if (metrics.hydrationLevel < 20) {
        setFeedback([
          { type: "bad", message: "⚠️ Severe dehydration! Drink water immediately!" }
        ])
      }
    }

    // Morning reset (6 AM)
    if (time.hour === 6 && time.minute === 0) {
      evaluateDay(time)
    }

    // Hourly hydration tips
    if (time.minute === 0) {
      if (time.hour === 7) {
        setFeedback([{ type: "good", message: "☀️ Morning! Drink 500ml water to rehydrate after sleep." }])
      }
      if (time.hour === 12) {
        setFeedback([{ type: "good", message: "🥤 Midday hydration check! Have you had 1L today?" }])
      }
      if (time.hour === 18) {
        setFeedback([{ type: "warning", message: "🌙 Reduce water intake 2h before bed to avoid sleep disruption." }])
      }
    }
  }

  const evaluateDay = (time: GameTime) => {
    const targetIntake = 2500 // 2.5L recommended
    const achieved = metrics.waterIntake >= targetIntake * 0.8 // 80% of target
    
    let warnings: Array<{ type: "good" | "bad" | "warning", message: string }> = []

    if (achieved) {
      warnings.push({ type: "good", message: `Great hydration! You drank ${(metrics.waterIntake / 1000).toFixed(1)}L today! ✓` })
      setMetrics((prev) => ({
        ...prev,
        consecutiveGoodDays: prev.consecutiveGoodDays + 1,
      }))
    } else {
      warnings.push({ 
        type: "bad", 
        message: `Only ${(metrics.waterIntake / 1000).toFixed(1)}L today. Target: 2.5L.` 
      })
      setMetrics((prev) => ({
        ...prev,
        consecutiveGoodDays: 0,
      }))
    }

    setFeedback(warnings)
    
    // Reset for new day
    setMetrics((prev) => ({
      ...prev,
      waterIntake: 0,
      hydrationLevel: 50,
      energyLevel: 50,
      cognitivePerformance: 50,
    }))
    setWaterLog([])
  }

  return (
    <div className="min-h-screen pb-20">
      <GameEngine onTimeChange={handleTimeChange}>
        {(time, controls) => (
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">Learn to Drink Water</h1>
              <p className="text-muted-foreground">
                Master hydration: drink throughout the day and see how it impacts energy and cognition
              </p>
            </div>

            {/* Game Scene */}
            <GameScene
              time={time}
              lightLevel={calculateLightLevel(time.hour)}
              characterState={characterState}
            />

            {/* Hydration Action Button */}
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={() => drinkWater(time)}
                disabled={characterState === "sleeping"}
                className="gap-2 text-lg px-8 py-6"
              >
                <Droplet className="h-6 w-6" />
                Drink Water (250ml)
              </Button>
            </div>

            {/* Metrics Dashboard */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                title="Hydration"
                value={metrics.hydrationLevel}
                icon={<Droplet className="h-5 w-5" />}
                color="cyan"
                unit="%"
              />
              <MetricCard
                title="Energy"
                value={metrics.energyLevel}
                icon={<TrendingUp className="h-5 w-5" />}
                color="green"
                unit="%"
              />
              <MetricCard
                title="Cognitive"
                value={metrics.cognitivePerformance}
                icon={<Brain className="h-5 w-5" />}
                color="purple"
                unit="%"
              />
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-5 w-5 text-cyan-500" />
                  <div className="text-xs text-muted-foreground">Today</div>
                </div>
                <div className="text-3xl font-bold">
                  {(metrics.waterIntake / 1000).toFixed(1)}L
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Target: 2.5L
                </div>
              </div>
            </div>

            {/* Feedback Messages */}
            {feedback.length > 0 && (
              <motion.div
                className="mt-6 space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {feedback.map((item, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      item.type === "good" ? "bg-green-500/10 border border-green-500/30" :
                      item.type === "bad" ? "bg-red-500/10 border border-red-500/30" :
                      "bg-yellow-500/10 border border-yellow-500/30"
                    }`}
                  >
                    {item.type === "good" ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                    <span className="text-sm">{item.message}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Water Log */}
            <div className="mt-8 p-6 rounded-2xl bg-card/50 border border-border/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Droplet className="h-5 w-5 text-cyan-500" />
                Today's Water Intake
                {metrics.consecutiveGoodDays > 0 && (
                  <span className="text-sm text-muted-foreground ml-auto">
                    🔥 {metrics.consecutiveGoodDays} day streak
                  </span>
                )}
              </h3>
              
              {waterLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No water logged yet today. Click "Drink Water" to start!
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {waterLog.map((log, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center"
                    >
                      <div className="text-xs text-muted-foreground">{log.time}</div>
                      <div className="text-sm font-semibold">{log.amount}ml</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Daily Progress</span>
                  <span>{((metrics.waterIntake / 2500) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (metrics.waterIntake / 2500) * 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20">
              <h3 className="font-semibold mb-3">💧 Optimal Hydration Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Drink 2.5-3L (10-12 cups) of water daily</li>
                <li>• Start your day with 500ml of water upon waking</li>
                <li>• Drink consistently throughout the day, not all at once</li>
                <li>• Reduce water intake 2 hours before bed to avoid sleep disruption</li>
                <li>• Monitor urine color: pale yellow = well hydrated</li>
                <li>• Increase intake during exercise, hot weather, or high altitude</li>
              </ul>
            </div>
          </div>
        )}
      </GameEngine>
    </div>
  )
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon, 
  color,
  unit = "%"
}: { 
  title: string
  value: number
  icon: React.ReactNode
  color: "cyan" | "green" | "purple"
  unit?: string
}) {
  const colorClasses = {
    cyan: "text-cyan-500 bg-cyan-500",
    green: "text-green-500 bg-green-500",
    purple: "text-purple-500 bg-purple-500",
  }

  return (
    <div className="p-4 rounded-lg bg-card/50 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <div className={colorClasses[color].split(" ")[0]}>{icon}</div>
        <div className="text-xs text-muted-foreground">{title}</div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}{unit}</div>
      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
        <motion.div
          className={colorClasses[color].split(" ")[1]}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  )
}
