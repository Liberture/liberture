"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface GameTime {
  hour: number // 0-23
  minute: number // 0-59
  day: number // 1-365
}

interface GameEngineProps {
  children: (time: GameTime, controls: GameControls) => React.ReactNode
  onTimeChange?: (time: GameTime) => void
}

interface GameControls {
  isPlaying: boolean
  speed: number
  play: () => void
  pause: () => void
  reset: () => void
  setSpeed: (speed: number) => void
}

const SPEEDS = [
  { value: 1, label: "1x" },
  { value: 5, label: "5x" },
  { value: 10, label: "10x" },
  { value: 30, label: "30x" },
  { value: 60, label: "1 min/sec" },
]

export function GameEngine({ children, onTimeChange }: GameEngineProps) {
  const [time, setTime] = useState<GameTime>({ hour: 6, minute: 0, day: 1 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(5) // 5x speed by default

  // Time advancement logic
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setTime((prev) => {
        let newMinute = prev.minute + speed
        let newHour = prev.hour
        let newDay = prev.day

        // Handle minute overflow
        if (newMinute >= 60) {
          newHour += Math.floor(newMinute / 60)
          newMinute = newMinute % 60
        }

        // Handle hour overflow
        if (newHour >= 24) {
          newDay += Math.floor(newHour / 24)
          newHour = newHour % 24
        }

        const newTime = { hour: newHour, minute: newMinute, day: newDay }
        onTimeChange?.(newTime)
        return newTime
      })
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [isPlaying, speed, onTimeChange])

  const reset = useCallback(() => {
    setTime({ hour: 6, minute: 0, day: 1 })
    setIsPlaying(false)
  }, [])

  const controls: GameControls = {
    isPlaying,
    speed,
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    reset,
    setSpeed,
  }

  return (
    <div className="relative min-h-screen">
      {/* Time Controls - Fixed at top */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-3 max-w-6xl">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Time Display */}
            <div className="flex items-center gap-4">
              <div className="text-sm font-mono">
                <span className="text-muted-foreground">Day</span>{" "}
                <span className="font-bold">{time.day}</span>
              </div>
              <div className="text-2xl font-mono font-bold">
                {String(time.hour).padStart(2, "0")}:
                {String(time.minute).padStart(2, "0")}
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isPlaying ? "default" : "outline"}
                onClick={() => setIsPlaying(!isPlaying)}
                className="gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Play
                  </>
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed:</span>
              {SPEEDS.map((s) => (
                <Button
                  key={s.value}
                  size="sm"
                  variant={speed === s.value ? "default" : "ghost"}
                  onClick={() => setSpeed(s.value)}
                  className="min-w-[60px]"
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="pt-32">{children(time, controls)}</div>
    </div>
  )
}

// Utility functions
export function getTimeOfDay(hour: number): "night" | "morning" | "afternoon" | "evening" {
  if (hour >= 5 && hour < 12) return "morning"
  if (hour >= 12 && hour < 17) return "afternoon"
  if (hour >= 17 && hour < 21) return "evening"
  return "night"
}

export function getSkyColor(hour: number): { sky: string; horizon: string } {
  // Night: 21-5
  if (hour >= 21 || hour < 5) {
    return { sky: "#0f172a", horizon: "#1e293b" }
  }
  // Dawn: 5-7
  if (hour >= 5 && hour < 7) {
    return { sky: "#fbbf24", horizon: "#f59e0b" }
  }
  // Morning: 7-12
  if (hour >= 7 && hour < 12) {
    return { sky: "#3b82f6", horizon: "#60a5fa" }
  }
  // Afternoon: 12-17
  if (hour >= 12 && hour < 17) {
    return { sky: "#0ea5e9", horizon: "#38bdf8" }
  }
  // Dusk: 17-21
  return { sky: "#f97316", horizon: "#fb923c" }
}
