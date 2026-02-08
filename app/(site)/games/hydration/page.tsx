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
  { id: "soup", name: "Soup", waterContent: 220, calories: 120, description: "High water content", emoji: "🍲" },
  { id: "yogurt", name: "Yogurt", waterContent: 90, calories: 150, description: "75% water", emoji: "🥛" },
  { id: "chicken", name: "Grilled Chicken", waterContent: 65, calories: 250, description: "65% water", emoji: "🍗" },
  { id: "rice", name: "Cooked Rice", waterContent: 70, calories: 200, description: "Absorbs water", emoji: "🍚" },
  { id: "bread", name: "Bread", waterContent: 35, calories: 150, description: "35% water", emoji: "🍞" },
]

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
  const [showElectrolyteWarning, setShowElectrolyteWarning] = useState(false)
  const [characterState, setCharacterState] = useState<"standing" | "sleeping" | "eating">("standing")
  const [feedback, setFeedback] = useState<Array<{ type: "good" | "bad" | "warning", message: string }>>([])
  const [drinkCount, setDrinkCount] = useState(0)

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
    
    setWaterLog((prev) => [...prev, { time: timeStr, amount, type: currentWaterType.name }])
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

  // Eat food function
  const eatFood = (time: GameTime, food: FoodItem) => {
    setCharacterState("eating")
    
    const waterFromFood = food.waterContent
    
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

    setShowFoodModal(false)
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
    <div className="min-h-screen pb-20">
      <GameEngine onTimeChange={handleTimeChange}>
        {(time, controls) => (
          <div className="container mx-auto px-4 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">Learn to Drink Water</h1>
              <p className="text-muted-foreground">
                Master hydration with proper water quality and food-based water intake
              </p>
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
                    className="bg-card border border-border rounded-2xl p-8 max-w-2xl"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <AlertCircle className="h-8 w-8 text-yellow-500 flex-shrink-0" />
                      <div>
                        <h3 className="text-2xl font-bold mb-2">💧 Dead Water Alert!</h3>
                        <p className="text-muted-foreground mb-4">
                          You've been drinking tap water without electrolytes. While it adds volume, 
                          your cells can't absorb it properly without minerals like sodium, potassium, and magnesium.
                        </p>
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                          <h4 className="font-semibold mb-2">Why Electrolytes Matter:</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• Sodium helps water cross cell membranes</li>
                            <li>• Potassium regulates fluid balance</li>
                            <li>• Magnesium supports 300+ enzymatic reactions</li>
                            <li>• Without minerals, water passes through without hydrating</li>
                          </ul>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          💡 <strong>Tip:</strong> Switch to mineral water or add a pinch of sea salt to your water!
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => {
                      setShowElectrolyteWarning(false)
                      setShowWaterTypeModal(true)
                    }} className="w-full">
                      Choose Better Water Quality
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Game Scene */}
            <GameScene
              time={time}
              lightLevel={calculateLightLevel(time.hour)}
              characterState={characterState}
            />

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <Button
                size="lg"
                onClick={() => drinkWater(time)}
                disabled={characterState === "sleeping"}
                className="gap-2 text-lg px-8 py-6"
              >
                <Droplet className="h-6 w-6" />
                Drink {currentWaterType.name} (250ml)
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowWaterTypeModal(true)}
                className="gap-2"
              >
                <Info className="h-5 w-5" />
                Change Water Type
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowFoodModal(true)}
                disabled={characterState === "sleeping"}
                className="gap-2"
              >
                <Utensils className="h-5 w-5" />
                Eat Food
              </Button>
            </div>

            {/* Water Type Modal */}
            <AnimatePresence>
              {showWaterTypeModal && (
                <Modal onClose={() => setShowWaterTypeModal(false)} title="Choose Water Type">
                  <div className="grid grid-cols-1 gap-4">
                    {WATER_TYPES.map((water) => (
                      <button
                        key={water.id}
                        onClick={() => {
                          setSelectedWaterType(water.id)
                          setShowWaterTypeModal(false)
                        }}
                        className={`p-6 rounded-2xl bg-gradient-to-b ${water.color} border text-left hover:scale-105 transition-transform ${
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
                </Modal>
              )}
            </AnimatePresence>

            {/* Food Modal */}
            <AnimatePresence>
              {showFoodModal && (
                <Modal onClose={() => setShowFoodModal(false)} title="Eat Food (Hydration from Food)">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {FOOD_ITEMS.map((food) => (
                      <button
                        key={food.id}
                        onClick={() => eatFood(time, food)}
                        className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-border hover:scale-105 transition-all text-center"
                      >
                        <div className="text-4xl mb-2">{food.emoji}</div>
                        <div className="font-semibold text-sm mb-1">{food.name}</div>
                        <div className="text-xs text-cyan-400 mb-1">+{food.waterContent}ml</div>
                        <div className="text-xs text-muted-foreground">{food.description}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Did you know?</strong> Food provides 20-30% of daily water intake. 
                      Fruits and vegetables are 80-95% water!
                    </p>
                  </div>
                </Modal>
              )}
            </AnimatePresence>

            {/* Metrics Dashboard */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard title="Hydration" value={metrics.hydrationLevel} icon={<Droplet className="h-5 w-5" />} color="cyan" />
              <MetricCard title="Electrolytes" value={metrics.electrolytes} icon={<Droplet className="h-5 w-5" />} color="yellow" />
              <MetricCard title="Energy" value={metrics.energyLevel} icon={<TrendingUp className="h-5 w-5" />} color="green" />
              <MetricCard title="Cognitive" value={metrics.cognitivePerformance} icon={<Brain className="h-5 w-5" />} color="purple" />
              <div className="p-4 rounded-lg bg-card/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="h-5 w-5 text-cyan-500" />
                  <div className="text-xs text-muted-foreground">Today</div>
                </div>
                <div className="text-2xl font-bold">
                  {((metrics.waterIntake + metrics.foodWaterIntake) / 1000).toFixed(1)}L
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(metrics.foodWaterIntake / 1000).toFixed(1)}L from food
                </div>
              </div>
            </div>

            {/* Feedback Messages */}
            {feedback.length > 0 && (
              <motion.div className="mt-6 space-y-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {feedback.map((item, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg flex items-center gap-2 ${
                      item.type === "good" ? "bg-green-500/10 border border-green-500/30" :
                      item.type === "bad" ? "bg-red-500/10 border border-red-500/30" :
                      "bg-yellow-500/10 border border-yellow-500/30"
                    }`}
                  >
                    {item.type === "good" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span className="text-sm">{item.message}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Water Log */}
            <div className="mt-8 p-6 rounded-2xl bg-card/50 border border-border/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Droplet className="h-5 w-5 text-cyan-500" />
                  Today's Intake Log
                </span>
                {metrics.consecutiveGoodDays > 0 && (
                  <span className="text-sm text-muted-foreground">🔥 {metrics.consecutiveGoodDays} day streak</span>
                )}
              </h3>
              
              {waterLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No water logged yet. Start drinking!
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {waterLog.map((log, i) => (
                    <div key={i} className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-center">
                      <div className="text-xs text-muted-foreground">{log.time}</div>
                      <div className="text-sm font-semibold">{log.amount}ml</div>
                      <div className="text-xs text-cyan-400">{log.type}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Daily Progress (Target: 2.5L)</span>
                  <span>{(((metrics.waterIntake + metrics.foodWaterIntake) / 2500) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((metrics.waterIntake + metrics.foodWaterIntake) / 2500) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20">
              <h3 className="font-semibold mb-3">💧 Advanced Hydration Science</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Electrolytes are essential:</strong> Water without minerals = "dead water" that passes through without hydrating</li>
                <li>• <strong>Mineral water is best:</strong> Contains sodium, magnesium, potassium for optimal absorption</li>
                <li>• <strong>Food provides 20-30% of water:</strong> Watermelon, cucumber, and lettuce are 90%+ water</li>
                <li>• <strong>Target 2.5-3L total:</strong> From both drinking water and food combined</li>
                <li>• <strong>Add sea salt if needed:</strong> Pinch of quality salt improves tap water absorption</li>
              </ul>
            </div>
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
        className="bg-card border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
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
    <div className="p-4 rounded-lg bg-card/50 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <div className={colorClasses[color].split(" ")[0]}>{icon}</div>
        <div className="text-xs text-muted-foreground">{title}</div>
      </div>
      <div className="text-2xl font-bold mb-1">{value}%</div>
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
