"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Moon, Lightbulb, UtensilsCrossed, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { GameEngine, GameTime } from "@/components/games/GameEngine"
import { GameScene } from "@/components/games/GameScene"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface SleepMetrics {
  sleepQuality: number // 0-100
  energyLevel: number // 0-100
  recoveryScore: number // 0-100
  consecutiveGoodNights: number
}

export default function SleepGamePage() {
  // User controls
  const [bedtime, setBedtime] = useState(22) // 22:00 (10 PM)
  const [stopEatingTime, setStopEatingTime] = useState(20) // 20:00 (8 PM)
  const [lightSchedule, setLightSchedule] = useState({
    morningBright: 7, // Turn on bright lights at 7 AM
    eveningDim: 19, // Dim lights at 7 PM
    nightOff: 21, // Turn off lights at 9 PM
  })

  // Game state
  const [currentLightLevel, setCurrentLightLevel] = useState(100)
  const [characterState, setCharacterState] = useState<"standing" | "sleeping">("standing")
  const [lastMealTime, setLastMealTime] = useState<number | null>(null)
  const [metrics, setMetrics] = useState<SleepMetrics>({
    sleepQuality: 50,
    energyLevel: 50,
    recoveryScore: 50,
    consecutiveGoodNights: 0,
  })
  const [feedback, setFeedback] = useState<Array<{ type: "good" | "bad" | "warning", message: string }>>([])

  // Calculate light level based on time and user settings
  const calculateLightLevel = (time: GameTime): number => {
    const hour = time.hour
    
    // Night mode (lights should be off)
    if (hour >= lightSchedule.nightOff || hour < lightSchedule.morningBright) {
      return 0
    }
    
    // Morning - bright lights
    if (hour >= lightSchedule.morningBright && hour < 12) {
      return 100
    }
    
    // Afternoon - maintain brightness
    if (hour >= 12 && hour < lightSchedule.eveningDim) {
      return 100
    }
    
    // Evening - dim lights
    if (hour >= lightSchedule.eveningDim && hour < lightSchedule.nightOff) {
      return 30
    }
    
    return 50
  }

  // Handle time changes and update game state
  const handleTimeChange = (time: GameTime) => {
    const newLightLevel = calculateLightLevel(time)
    setCurrentLightLevel(newLightLevel)

    // Check if character should be sleeping
    const shouldBeSleeping = time.hour >= bedtime || time.hour < 6
    setCharacterState(shouldBeSleeping ? "sleeping" : "standing")

    // Calculate sleep quality based on various factors
    if (shouldBeSleeping && time.hour === 6) {
      // Morning - evaluate previous night's sleep
      calculateSleepQuality(time)
    }
  }

  const calculateSleepQuality = (wakeTime: GameTime) => {
    let quality = 100
    let warnings: Array<{ type: "good" | "bad" | "warning", message: string }> = []

    // Factor 1: Bedtime (ideal: 22:00-23:00)
    if (bedtime > 23) {
      quality -= 20
      warnings.push({ type: "bad", message: "Sleeping too late reduces sleep quality" })
    } else if (bedtime >= 22 && bedtime <= 23) {
      warnings.push({ type: "good", message: "Optimal bedtime! ✓" })
    }

    // Factor 2: Last meal timing (should be 3+ hours before bed)
    if (lastMealTime !== null) {
      const hoursSinceMeal = (bedtime - lastMealTime + 24) % 24
      if (hoursSinceMeal < 2) {
        quality -= 30
        warnings.push({ type: "bad", message: "Eating too close to bedtime disrupts sleep" })
      } else if (hoursSinceMeal >= 3) {
        warnings.push({ type: "good", message: "Good meal timing! ✓" })
      } else {
        warnings.push({ type: "warning", message: "Try to stop eating 3h before bed" })
      }
    }

    // Factor 3: Light exposure (lights should be dimmed in evening)
    if (lightSchedule.eveningDim > 20) {
      quality -= 15
      warnings.push({ type: "warning", message: "Dim lights earlier for better melatonin production" })
    } else {
      warnings.push({ type: "good", message: "Good light management! ✓" })
    }

    // Factor 4: Light exposure at night (should be off)
    if (lightSchedule.nightOff > 22) {
      quality -= 15
      warnings.push({ type: "bad", message: "Lights should be off by 9-10 PM" })
    } else {
      warnings.push({ type: "good", message: "Excellent nighttime darkness! ✓" })
    }

    // Update metrics
    const newConsecutiveGoodNights = quality >= 80 
      ? metrics.consecutiveGoodNights + 1 
      : 0

    setMetrics({
      sleepQuality: Math.max(0, Math.min(100, quality)),
      energyLevel: Math.max(0, Math.min(100, quality + 10)),
      recoveryScore: Math.max(0, Math.min(100, quality - 5)),
      consecutiveGoodNights: newConsecutiveGoodNights,
    })

    setFeedback(warnings)
  }

  // Simulate eating (user action)
  const eat = (time: GameTime) => {
    setLastMealTime(time.hour)
    const hoursToBedtime = (bedtime - time.hour + 24) % 24
    
    if (hoursToBedtime < 2) {
      setFeedback([{ type: "warning", message: "Eating close to bedtime may affect sleep!" }])
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <GameEngine onTimeChange={handleTimeChange}>
        {(time, controls) => (
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">Learn to Sleep</h1>
              <p className="text-muted-foreground">
                Master sleep hygiene by controlling bedtime, meals, and light exposure
              </p>
            </div>

            {/* Game Scene + Controls Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Game Scene - Left Side (2/3 width on desktop) */}
              <div className="lg:col-span-2">
                <GameScene
                  time={time}
                  lightLevel={currentLightLevel}
                  characterState={characterState}
                />
              </div>

              {/* Controls Panel - Right Side (1/3 width on desktop) */}
              <div className="lg:col-span-1">
                <div className="p-6 rounded-2xl bg-card/50 border border-border/50 space-y-6 sticky top-20">
                  <h3 className="text-lg font-semibold">Your Controls</h3>

                  {/* Bedtime Control */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-purple-500" />
                        <label className="text-sm font-medium">Bedtime</label>
                      </div>
                      <span className="text-sm font-mono">{String(bedtime).padStart(2, "0")}:00</span>
                    </div>
                    <Slider
                      value={[bedtime]}
                      onValueChange={(v) => setBedtime(v[0])}
                      min={20}
                      max={24}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optimal: 22:00-23:00 (10-11 PM)
                    </p>
                  </div>

                  {/* Stop Eating Time */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-green-500" />
                        <label className="text-sm font-medium">Last Meal</label>
                      </div>
                      <span className="text-sm font-mono">{String(stopEatingTime).padStart(2, "0")}:00</span>
                    </div>
                    <Slider
                      value={[stopEatingTime]}
                      onValueChange={(v) => {
                        setStopEatingTime(v[0])
                        setLastMealTime(v[0])
                      }}
                      min={17}
                      max={22}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Stop eating 3+ hours before bed
                    </p>
                  </div>

                  {/* Light Schedule */}
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <h4 className="text-sm font-semibold">Light Schedule</h4>
                    </div>

                    {/* Morning Bright Lights */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs">Morning (100%)</label>
                        <span className="text-xs font-mono">
                          {String(lightSchedule.morningBright).padStart(2, "0")}:00
                        </span>
                      </div>
                      <Slider
                        value={[lightSchedule.morningBright]}
                        onValueChange={(v) => setLightSchedule({ ...lightSchedule, morningBright: v[0] })}
                        min={5}
                        max={9}
                        step={1}
                      />
                    </div>

                    {/* Evening Dim */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs">Evening (30%)</label>
                        <span className="text-xs font-mono">
                          {String(lightSchedule.eveningDim).padStart(2, "0")}:00
                        </span>
                      </div>
                      <Slider
                        value={[lightSchedule.eveningDim]}
                        onValueChange={(v) => setLightSchedule({ ...lightSchedule, eveningDim: v[0] })}
                        min={17}
                        max={21}
                        step={1}
                      />
                    </div>

                    {/* Night Off */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs">Night (0%)</label>
                        <span className="text-xs font-mono">
                          {String(lightSchedule.nightOff).padStart(2, "0")}:00
                        </span>
                      </div>
                      <Slider
                        value={[lightSchedule.nightOff]}
                        onValueChange={(v) => setLightSchedule({ ...lightSchedule, nightOff: v[0] })}
                        min={20}
                        max={23}
                        step={1}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sleep Metrics Dashboard */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Sleep Quality"
                value={metrics.sleepQuality}
                icon={<Moon className="h-5 w-5" />}
                color="purple"
              />
              <MetricCard
                title="Energy Level"
                value={metrics.energyLevel}
                icon={<TrendingUp className="h-5 w-5" />}
                color="cyan"
              />
              <MetricCard
                title="Recovery Score"
                value={metrics.recoveryScore}
                icon={<TrendingDown className="h-5 w-5" />}
                color="green"
              />
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="h-5 w-5 text-yellow-500" />
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
                <div className="text-3xl font-bold">
                  {metrics.consecutiveGoodNights} 🌙
                </div>
                <div className="text-xs text-muted-foreground mt-1">Good nights</div>
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
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{item.message}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Tips */}
            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20">
              <h3 className="font-semibold mb-3">💡 Sleep Optimization Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Aim for 7-9 hours of sleep, going to bed between 10-11 PM</li>
                <li>• Stop eating 3+ hours before bedtime to improve sleep quality</li>
                <li>• Dim lights in the evening to promote melatonin production</li>
                <li>• Keep your bedroom completely dark during sleep</li>
                <li>• Get bright light exposure in the morning to regulate circadian rhythm</li>
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
  color 
}: { 
  title: string
  value: number
  icon: React.ReactNode
  color: "purple" | "cyan" | "green"
}) {
  const colorClasses = {
    purple: "text-purple-500",
    cyan: "text-cyan-500",
    green: "text-green-500",
  }

  return (
    <div className="p-4 rounded-lg bg-card/50 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <div className={colorClasses[color]}>{icon}</div>
        <div className="text-xs text-muted-foreground">{title}</div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}%</div>
      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${
            color === "purple" ? "bg-purple-500" :
            color === "cyan" ? "bg-cyan-500" :
            "bg-green-500"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  )
}
