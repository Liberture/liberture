"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Droplet, TrendingUp, Brain, AlertCircle, CheckCircle, Utensils, X, Info } from "lucide-react"
import { GameEngine, GameTime } from "@/components/games/GameEngine"
import { GameScene } from "@/components/games/GameScene"
import { Button } from "@/components/ui/button"

interface HydrationMetrics {
  hydrationLevel: number // 0-100%
  energyLevel: number // 0-100
  cognitivePerformance: number // 0-100
  waterIntake: number // ml
  foodWaterIntake: number // ml from food
  electrolytes: number // 0-100
  consecutiveGoodDays: number
}

interface WaterLog {
  time: string
  amount: number
  type: string
  category: "water" | "food"
  emoji?: string
}

interface WaterType {
  id: string
  name: string
  description: string
  electrolytes: number // 0-100
  effectiveness: number // hydration multiplier
  color: string
}

interface FoodItem {
  id: string
  name: string
  waterContent: number // ml per serving
  calories: number
  description: string
  emoji: string
}

const WATER_TYPES: WaterType[] = [
  {
    id: "tap",
    name: "Tap Water",
    description: "Regular tap water - minimal electrolytes",
    electrolytes: 20,
    effectiveness: 0.6,
    color: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  },
  {
    id: "mineral",
    name: "Mineral Water",
    description: "Rich in sodium, magnesium, calcium",
    electrolytes: 85,
    effectiveness: 1.0,
    color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
  },
  {
    id: "bottled",
    name: "Filtered/Bottled",
    description: "Purified but lacks minerals",
    electrolytes: 40,
    effectiveness: 0.75,
    color: "from-blue-400/20 to-blue-400/5 border-blue-400/30",
  },
]

const FOOD_ITEMS: FoodItem[] = [
  { id: "watermelon", name: "Watermelon", waterContent: 180, calories: 80, description: "92% water", emoji: "🍉" },
  { id: "cucumber", name: "Cucumber", waterContent: 150, calories: 15, description: "95% water", emoji: "🥒" },
  { id: "orange", name: "Orange", waterContent: 120, calories: 60, description: "87% water", emoji: "🍊" },
  { id: "strawberries", name: "Strawberries", waterContent: 140, calories: 50, description: "91% water", emoji: "🍓" },
  { id: "lettuce", name: "Lettuce Salad", waterContent: 160, calories: 25, description: "96% water", emoji: "🥗" },
  { id: "soup", name: "Soup", waterContent: 220, calories: 120, description: "High water", emoji: "🍲" },
  { id: "yogurt", name: "Yogurt", waterContent: 90, calories: 150, description: "75% water", emoji: "🥛" },
  { id: "grapes", name: "Grapes", waterContent: 130, calories: 70, description: "81% water", emoji: "🍇" },
  { id: "celery", name: "Celery", waterContent: 140, calories: 10, description: "95% water", emoji: "🥬" },
  { id: "tomato", name: "Tomato", waterContent: 135, calories: 20, description: "94% water", emoji: "🍅" },
  { id: "peach", name: "Peach", waterContent: 125, calories: 60, description: "89% water", emoji: "🍑" },
  { id: "pineapple", name: "Pineapple", waterContent: 130, calories: 80, description: "86% water", emoji: "🍍" },
  { id: "broccoli", name: "Broccoli", waterContent: 120, calories: 35, description: "91% water", emoji: "🥦" },
  { id: "carrot", name: "Carrots", waterContent: 110, calories: 40, description: "88% water", emoji: "🥕" },
  { id: "apple", name: "Apple", waterContent: 115, calories: 95, description: "86% water", emoji: "🍎" },
  { id: "melon", name: "Cantaloupe", waterContent: 160, calories: 55, description: "90% water", emoji: "🍈" },
]

// Quick access foods (most hydrating)
const QUICK_FOODS = ["watermelon", "cucumber", "lettuce"]

export default function HydrationGamePage() {
  // Game state
  const [metrics, setMetrics] = useState<HydrationMetrics>({
    hydrationLevel: 50,
    energyLevel: 50,
    cognitivePerformance: 50,
    waterIntake: 0,
    foodWaterIntake: 0,
    electrolytes: 50,
    consecutiveGoodDays: 0,
  })
  const [waterLog, setWaterLog] = useState<WaterLog[]>([])
  const [selectedWaterType, setSelectedWaterType] = useState<string>("tap")
  const [showWaterTypeModal, setShowWaterTypeModal] = useState(false)
  const [showFoodModal, setShowFoodModal] = useState(false)
  const [pendingFood, setPendingFood] = useState<FoodItem | null>(null)
  const [showElectrolyteWarning, setShowElectrolyteWarning] = useState(false)
  const [showIntroModal, setShowIntroModal] = useState(true)
  const [hasSeenIntro, setHasSeenIntro] = useState(false)
  const [characterState, setCharacterState] = useState<"standing" | "sleeping" | "eating">("standing")
  const [feedback, setFeedback] = useState<Array<{ type: "good" | "bad" | "warning", message: string }>>([])
  const [drinkCount, setDrinkCount] = useState(0)

  // Load intro seen state from localStorage
  useEffect(() => {
    const seen = localStorage.getItem('hydration-intro-seen')
    if (seen === 'true') {
      setHasSeenIntro(true)
      setShowIntroModal(false)
    }
  }, [])

  const skipIntro = () => {
    setShowIntroModal(false)
    setHasSeenIntro(true)
    localStorage.setItem('hydration-intro-seen', 'true')
  }

  // Automated light schedule
  const lightSchedule = { morningBright: 7, eveningDim: 19, nightOff: 21 }
  const bedtime = 22

  const calculateLightLevel = (hour: number): number => {
    if (hour >= lightSchedule.nightOff || hour < lightSchedule.morningBright) return 0
    if (hour >= lightSchedule.morningBright && hour < 12) return 100
    if (hour >= 12 && hour < lightSchedule.eveningDim) return 100
    if (hour >= lightSchedule.eveningDim && hour < lightSchedule.nightOff) return 30
    return 50
  }

  // Get current water type
  const currentWaterType = WATER_TYPES.find((w) => w.id === selectedWaterType) || WATER_TYPES[0]

  // Drink water function
  const drinkWater = (time: GameTime, amount: number = 250) => {
    const timeStr = `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`
    
    setWaterLog((prev) => [...prev, { time: timeStr, amount, type: currentWaterType.name, category: "water" }])
    setDrinkCount((prev) => prev + 1)
    
    // Calculate effective hydration based on water type and electrolytes
    const effectiveAmount = amount * currentWaterType.effectiveness
    const hydrationBoost = (effectiveAmount / 250) * 15
    const electrolyteBoost = currentWaterType.electrolytes / 10
    
    setMetrics((prev) => ({
      ...prev,
      hydrationLevel: Math.min(100, prev.hydrationLevel + hydrationBoost),
      waterIntake: prev.waterIntake + amount,
      electrolytes: Math.min(100, prev.electrolytes + electrolyteBoost),
      energyLevel: Math.min(100, prev.energyLevel + (hydrationBoost * 0.4)),
      cognitivePerformance: Math.min(100, prev.cognitivePerformance + (hydrationBoost * 0.5)),
    }))

    // Show electrolyte warning after 3 drinks of tap water
    if (selectedWaterType === "tap" && drinkCount >= 2 && !showElectrolyteWarning) {
      setShowElectrolyteWarning(true)
    }

    // Feedback
    const messages: Array<{ type: "good" | "bad" | "warning", message: string }> = []
    
    if (currentWaterType.effectiveness === 1.0) {
      messages.push({ type: "good", message: `+${amount}ml mineral water! Perfect hydration! 💎` })
    } else if (currentWaterType.effectiveness < 0.7) {
      messages.push({ type: "warning", message: `+${amount}ml but low electrolytes. Consider mineral water.` })
    } else {
      messages.push({ type: "good", message: `+${amount}ml water! 💧` })
    }

    setFeedback(messages)
    setTimeout(() => setFeedback([]), 3000)
  }

  // Eat food function with confirmation
  const selectFood = (food: FoodItem) => {
    setPendingFood(food)
  }

  const confirmEatFood = (time: GameTime) => {
    if (!pendingFood) return
    
    setCharacterState("eating")
    
    const timeStr = `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`
    const waterFromFood = pendingFood.waterContent
    
    // Add to water log
    setWaterLog((prev) => [...prev, { 
      time: timeStr, 
      amount: waterFromFood, 
      type: pendingFood.name, 
      category: "food",
      emoji: pendingFood.emoji 
    }])
    
    setMetrics((prev) => ({
      ...prev,
      hydrationLevel: Math.min(100, prev.hydrationLevel + (waterFromFood / 250) * 10),
      foodWaterIntake: prev.foodWaterIntake + waterFromFood,
      energyLevel: Math.min(100, prev.energyLevel + 8),
    }))

    setFeedback([
      { 
        type: "good", 
        message: `${pendingFood.emoji} ${pendingFood.name}: +${waterFromFood}ml water from food!` 
      }
    ])

    setTimeout(() => {
      setCharacterState("standing")
      setFeedback([])
    }, 3000)

    setPendingFood(null)
    setShowFoodModal(false)
  }

  const quickEatFood = (time: GameTime, foodId: string) => {
    const food = FOOD_ITEMS.find(f => f.id === foodId)
    if (!food) return
    
    setCharacterState("eating")
    
    const timeStr = `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`
    const waterFromFood = food.waterContent
    
    setWaterLog((prev) => [...prev, { 
      time: timeStr, 
      amount: waterFromFood, 
      type: food.name, 
      category: "food",
      emoji: food.emoji 
    }])
    
    setMetrics((prev) => ({
      ...prev,
      hydrationLevel: Math.min(100, prev.hydrationLevel + (waterFromFood / 250) * 10),
      foodWaterIntake: prev.foodWaterIntake + waterFromFood,
      energyLevel: Math.min(100, prev.energyLevel + 8),
    }))

    setFeedback([
      { 
        type: "good", 
        message: `${food.emoji} ${food.name}: +${waterFromFood}ml water from food!` 
      }
    ])

    setTimeout(() => {
      setCharacterState("standing")
      setFeedback([])
    }, 3000)
  }

  // Handle time changes
  const handleTimeChange = (time: GameTime) => {
    const shouldBeSleeping = time.hour >= bedtime || time.hour < 6
    if (shouldBeSleeping && characterState !== "eating") {
      setCharacterState("sleeping")
    } else if (!shouldBeSleeping && characterState === "sleeping") {
      setCharacterState("standing")
    }

    // Gradual dehydration and electrolyte depletion
    if (!shouldBeSleeping && time.minute % 5 === 0 && characterState !== "eating") {
      setMetrics((prev) => {
        const newHydration = Math.max(0, prev.hydrationLevel - 1)
        const newElectrolytes = Math.max(0, prev.electrolytes - 0.5)
        const newEnergy = newHydration > 30 && newElectrolytes > 20 
          ? prev.energyLevel 
          : Math.max(0, prev.energyLevel - 2)
        const newCognitive = newHydration > 20 && newElectrolytes > 15
          ? prev.cognitivePerformance 
          : Math.max(0, prev.cognitivePerformance - 3)
        
        return {
          ...prev,
          hydrationLevel: newHydration,
          electrolytes: newElectrolytes,
          energyLevel: newEnergy,
          cognitivePerformance: newCognitive,
        }
      })

      // Warnings
      if (metrics.hydrationLevel < 40) {
        setFeedback([{ type: "warning", message: "Hydration dropping! Time to drink water." }])
      }
      if (metrics.electrolytes < 25) {
        setFeedback([{ type: "warning", message: "⚡ Low electrolytes! Switch to mineral water." }])
      }
    }

    // Morning evaluation
    if (time.hour === 6 && time.minute === 0) {
      evaluateDay()
    }

    // Meal times
    if ((time.hour === 8 || time.hour === 13 || time.hour === 19) && time.minute === 0) {
      setFeedback([{ 
        type: "good", 
        message: `🍽️ Meal time! Food can provide 20-30% of daily water intake.` 
      }])
    }
  }

  const evaluateDay = () => {
    const totalWater = metrics.waterIntake + metrics.foodWaterIntake
    const targetIntake = 2500
    const achieved = totalWater >= targetIntake * 0.8
    
    if (achieved && metrics.electrolytes > 40) {
      setFeedback([{ 
        type: "good", 
        message: `Excellent! ${(totalWater / 1000).toFixed(1)}L total (${(metrics.foodWaterIntake / 1000).toFixed(1)}L from food) ✓` 
      }])
      setMetrics((prev) => ({ ...prev, consecutiveGoodDays: prev.consecutiveGoodDays + 1 }))
    } else {
      setFeedback([{ 
        type: "bad", 
        message: `Only ${(totalWater / 1000).toFixed(1)}L today. Target: 2.5L total.` 
      }])
      setMetrics((prev) => ({ ...prev, consecutiveGoodDays: 0 }))
    }

    // Reset
    setMetrics((prev) => ({
      ...prev,
      waterIntake: 0,
      foodWaterIntake: 0,
      hydrationLevel: 50,
      energyLevel: 50,
      cognitivePerformance: 50,
      electrolytes: 50,
    }))
    setWaterLog([])
    setDrinkCount(0)
  }

  return (
    <div className="min-h-screen">
      <GameEngine onTimeChange={handleTimeChange}>
        {(time, controls) => (
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold mb-1">Learn to Drink Water</h1>
                <p className="text-sm text-muted-foreground">
                  Master hydration with proper water quality and food-based water intake
                </p>
              </div>
              <button
                onClick={() => setShowIntroModal(true)}
                className="px-3 py-1.5 text-sm rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors"
              >
                ℹ️ Info
              </button>
            </div>

            {/* Electrolyte Warning Modal */}
            <AnimatePresence>
              {showElectrolyteWarning && (
                <motion.div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowElectrolyteWarning(false)}
                >
                  <motion.div
                    className="bg-card border border-border rounded-2xl p-6 max-w-lg"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-xl font-bold mb-2">💧 Dead Water Alert!</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Tap water without electrolytes passes through without hydrating cells properly.
                        </p>
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-3">
                          <p className="text-xs text-muted-foreground">
                            Sodium helps water cross cell membranes. Without minerals, water doesn't hydrate effectively.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => setShowElectrolyteWarning(false)} className="w-full" size="sm">
                      Got it! I'll use mineral water
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Dashboard Layout - 3 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              
              {/* LEFT COLUMN - Game Scene + Metrics + Progress */}
              <div className="lg:col-span-1 space-y-4">
                {/* Game Scene (Smaller) */}
                <div className="bg-card/30 border border-border/50 rounded-xl overflow-hidden">
                  <div className="scale-75 origin-top">
                    <GameScene
                      time={time}
                      lightLevel={calculateLightLevel(time.hour)}
                      characterState={characterState}
                    />
                  </div>
                </div>

                {/* Metrics Dashboard */}
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard title="Hydration" value={metrics.hydrationLevel} icon={<Droplet className="h-4 w-4" />} color="cyan" />
                  <MetricCard title="Electrolytes" value={metrics.electrolytes} icon={<Droplet className="h-4 w-4" />} color="yellow" />
                  <MetricCard title="Energy" value={metrics.energyLevel} icon={<TrendingUp className="h-4 w-4" />} color="green" />
                  <MetricCard title="Cognitive" value={metrics.cognitivePerformance} icon={<Brain className="h-4 w-4" />} color="purple" />
                </div>

                {/* Today's Progress */}
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Droplet className="h-5 w-5 text-cyan-500" />
                      <span className="font-semibold">Today's Intake</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {((metrics.waterIntake + metrics.foodWaterIntake) / 1000).toFixed(1)}L
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {(metrics.foodWaterIntake / 1000).toFixed(1)}L from food • Target: 2.5L
                  </div>
                  <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((metrics.waterIntake + metrics.foodWaterIntake) / 2500) * 100)}%` }}
                    />
                  </div>
                  {metrics.consecutiveGoodDays > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      🔥 {metrics.consecutiveGoodDays} day streak
                    </div>
                  )}
                </div>

                {/* Feedback Messages */}
                <AnimatePresence>
                  {feedback.length > 0 && (
                    <motion.div className="space-y-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {feedback.map((item, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                            item.type === "good" ? "bg-green-500/10 border border-green-500/30" :
                            item.type === "bad" ? "bg-red-500/10 border border-red-500/30" :
                            "bg-yellow-500/10 border border-yellow-500/30"
                          }`}
                        >
                          {item.type === "good" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                          <span>{item.message}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* MIDDLE COLUMN - Drink Water Controls */}
              <div className="lg:col-span-1 space-y-4">
                
                {/* Drink Water Section */}
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-cyan-500" />
                    Drink Water
                  </h3>
                  
                  {/* Water Type Dropdown */}
                  <button
                    onClick={() => setShowWaterTypeModal(true)}
                    className={`w-full p-3 rounded-lg bg-gradient-to-b ${currentWaterType.color} border mb-3 text-left hover:opacity-80 transition-opacity`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold mb-0.5">{currentWaterType.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ⚡{currentWaterType.electrolytes}% • 💧{(currentWaterType.effectiveness * 100).toFixed(0)}%
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary">Change</span>
                    </div>
                  </button>

                  {/* Drink Button */}
                  <Button
                    size="lg"
                    onClick={() => drinkWater(time)}
                    disabled={characterState === "sleeping"}
                    className="w-full gap-2 text-base"
                  >
                    <Droplet className="h-5 w-5" />
                    Drink 250ml
                  </Button>
                </div>

                {/* Quick Foods */}
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-green-500" />
                    Quick Foods
                  </h3>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {QUICK_FOODS.map((foodId) => {
                      const food = FOOD_ITEMS.find(f => f.id === foodId)
                      if (!food) return null
                      return (
                        <button
                          key={food.id}
                          onClick={() => quickEatFood(time, food.id)}
                          disabled={characterState === "sleeping"}
                          className="p-2 rounded-lg bg-card/50 border border-border/50 hover:border-border hover:scale-[1.02] transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="text-2xl mb-1">{food.emoji}</div>
                          <div className="text-xs font-semibold truncate">{food.name}</div>
                          <div className="text-xs text-cyan-400">+{food.waterContent}ml</div>
                        </button>
                      )
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowFoodModal(true)}
                    disabled={characterState === "sleeping"}
                    className="w-full text-xs"
                  >
                    More Foods...
                  </Button>
                </div>

                {/* Water/Food Log */}
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <h3 className="text-sm font-semibold mb-3">Intake Log</h3>
                  
                  {waterLog.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      No intake logged yet
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {waterLog.slice().reverse().map((log, i) => (
                        <div 
                          key={i} 
                          className={`p-2 rounded-lg flex items-center justify-between text-xs ${
                            log.category === "water" 
                              ? "bg-cyan-500/10 border border-cyan-500/30" 
                              : "bg-green-500/10 border border-green-500/30"
                          }`}
                        >
                          <span className="text-muted-foreground">{log.time}</span>
                          <div className="flex items-center gap-1">
                            {log.emoji && <span className="text-sm">{log.emoji}</span>}
                            <span className="font-semibold">{log.amount}ml</span>
                          </div>
                          <span className={`text-[10px] ${log.category === "water" ? "text-cyan-400" : "text-green-400"}`}>
                            {log.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN - Empty for now */}
              <div className="lg:col-span-2 space-y-4">
              </div>

            </div>

            {/* Intro Modal (Hydration Science) */}
            <AnimatePresence>
              {showIntroModal && (
                <motion.div
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-card border border-border rounded-2xl p-8 max-w-2xl w-full"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                  >
                    <div className="text-center mb-6">
                      <h2 className="text-3xl font-bold mb-2">💧 Hydration Science</h2>
                      <p className="text-muted-foreground">Learn the secrets to optimal hydration</p>
                    </div>

                    <div className="space-y-6 mb-6">
                      <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Droplet className="h-5 w-5 text-cyan-500" />
                          Water Quality Matters
                        </h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-cyan-500 mt-0.5">•</span>
                            <span><strong>Mineral water is best:</strong> Contains sodium, magnesium, and potassium for optimal cell absorption</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-cyan-500 mt-0.5">•</span>
                            <span><strong>Electrolytes are essential:</strong> Water without minerals = "dead water" that passes through without hydrating</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-cyan-500 mt-0.5">•</span>
                            <span><strong>Tap water needs minerals:</strong> Add a pinch of quality salt to improve absorption</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Utensils className="h-5 w-5 text-green-500" />
                          Food Provides 20-30% of Water
                        </h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span><strong>Fruits & vegetables:</strong> 80-95% water content (watermelon, cucumber, lettuce)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span><strong>Target 2.5-3L total:</strong> From both drinking water and food combined</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span><strong>Don't rely only on drinking:</strong> Food-based water is absorbed differently and provides nutrients</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <Brain className="h-5 w-5 text-purple-500" />
                          Daily Goals
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-semibold mb-1">Total Daily Intake</div>
                            <div className="text-muted-foreground">2.5-3L total</div>
                          </div>
                          <div>
                            <div className="font-semibold mb-1">From Drinking</div>
                            <div className="text-muted-foreground">1.8-2L water</div>
                          </div>
                          <div>
                            <div className="font-semibold mb-1">From Food</div>
                            <div className="text-muted-foreground">0.5-0.8L food</div>
                          </div>
                          <div>
                            <div className="font-semibold mb-1">Timing</div>
                            <div className="text-muted-foreground">Spread throughout day</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {!hasSeenIntro && (
                        <Button onClick={skipIntro} variant="outline" className="flex-1">
                          Skip
                        </Button>
                      )}
                      <Button onClick={() => {
                        skipIntro()
                      }} className="flex-1">
                        {hasSeenIntro ? "Close" : "Got it!"}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Water Type Selection Modal */}
            <AnimatePresence>
              {showWaterTypeModal && (
                <Modal onClose={() => setShowWaterTypeModal(false)} title="Choose Water Type">
                  <div className="space-y-3">
                    {WATER_TYPES.map((water) => (
                      <button
                        key={water.id}
                        onClick={() => {
                          setSelectedWaterType(water.id)
                          setShowWaterTypeModal(false)
                        }}
                        className={`w-full p-4 rounded-xl bg-gradient-to-b ${water.color} border text-left hover:scale-[1.01] transition-transform ${
                          selectedWaterType === water.id ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold">{water.name}</h3>
                          {selectedWaterType === water.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{water.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">Electrolytes</div>
                            <div className="font-semibold">{water.electrolytes}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Effectiveness</div>
                            <div className="font-semibold">{(water.effectiveness * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Tip:</strong> Mineral water provides the best hydration due to electrolytes (sodium, magnesium, potassium) that help water enter your cells.
                    </p>
                  </div>
                </Modal>
              )}
            </AnimatePresence>

            {/* Food Selection Modal */}
            <AnimatePresence>
              {showFoodModal && (
                <Modal onClose={() => {
                  setShowFoodModal(false)
                  setPendingFood(null)
                }} title="Choose Hydrating Food">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
                    {FOOD_ITEMS.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => selectFood(food)}
                        className={`p-3 rounded-xl border text-center hover:scale-[1.02] transition-all ${
                          pendingFood?.id === food.id 
                            ? "bg-green-500/20 border-green-500" 
                            : "bg-card/50 border-border/50 hover:border-border"
                        }`}
                      >
                        <div className="text-3xl mb-1">{food.emoji}</div>
                        <div className="text-xs font-semibold mb-1 truncate">{food.name}</div>
                        <div className="text-xs text-cyan-400 mb-0.5">+{food.waterContent}ml</div>
                        <div className="text-xs text-muted-foreground">{food.description}</div>
                      </button>
                    ))}
                  </div>

                  {/* Confirmation */}
                  {pendingFood && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-green-500/10 border border-green-500/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{pendingFood.emoji}</span>
                          <div>
                            <div className="font-semibold">{pendingFood.name}</div>
                            <div className="text-sm text-muted-foreground">
                              +{pendingFood.waterContent}ml water • {pendingFood.calories} cal
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => confirmEatFood(time)} 
                          className="flex-1"
                          disabled={characterState === "sleeping"}
                        >
                          Confirm
                        </Button>
                        <Button 
                          onClick={() => setPendingFood(null)} 
                          variant="outline" 
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Did you know?</strong> Food provides 20-30% of daily water intake. Fruits and vegetables are 80-95% water!
                    </p>
                  </div>
                </Modal>
              )}
            </AnimatePresence>

          </div>
        )}
      </GameEngine>
    </div>
  )
}

// Modal Component
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-card border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
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
  color: "cyan" | "green" | "purple" | "yellow"
}) {
  const colorClasses = {
    cyan: "text-cyan-500 bg-cyan-500",
    green: "text-green-500 bg-green-500",
    purple: "text-purple-500 bg-purple-500",
    yellow: "text-yellow-500 bg-yellow-500",
  }

  return (
    <div className="p-3 rounded-lg bg-card/50 border border-border/50">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={colorClasses[color].split(" ")[0]}>{icon}</div>
        <div className="text-xs text-muted-foreground">{title}</div>
      </div>
      <div className="text-xl font-bold mb-1.5">{value}%</div>
      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
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
