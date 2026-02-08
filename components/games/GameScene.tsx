"use client"

import { motion } from "framer-motion"
import { GameTime, getSkyColor } from "./GameEngine"

interface GameSceneProps {
  time: GameTime
  children?: React.ReactNode
  lightLevel?: number // 0-100
  characterState?: "standing" | "sitting" | "sleeping" | "eating" | "exercising"
}

export function GameScene({ 
  time, 
  children, 
  lightLevel = 100,
  characterState = "standing" 
}: GameSceneProps) {
  const { sky, horizon } = getSkyColor(time.hour)
  const isNight = time.hour >= 21 || time.hour < 6

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* House Container */}
      <div className="relative aspect-[4/3] bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl">
        
        {/* Room Interior */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-amber-50 to-amber-100"
          style={{ 
            opacity: lightLevel / 100,
            transition: "opacity 1s ease-in-out"
          }}
        />
        
        {/* Dark overlay for night */}
        <div 
          className="absolute inset-0 bg-slate-900"
          style={{ 
            opacity: isNight ? (1 - lightLevel / 100) * 0.8 : 0,
            transition: "opacity 1s ease-in-out"
          }}
        />

        {/* Window showing day/night cycle */}
        <motion.div
          className="absolute top-8 right-8 w-48 h-32 rounded-lg overflow-hidden border-4 border-slate-700 shadow-xl"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {/* Sky gradient */}
          <div 
            className="absolute inset-0 transition-all duration-1000"
            style={{ 
              background: `linear-gradient(to bottom, ${sky}, ${horizon})` 
            }}
          />
          
          {/* Sun */}
          {!isNight && (
            <motion.div
              className="absolute w-12 h-12 rounded-full bg-yellow-300 shadow-lg"
              style={{
                top: "20%",
                right: "20%",
                boxShadow: "0 0 30px rgba(253, 224, 71, 0.8)"
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          
          {/* Moon & Stars */}
          {isNight && (
            <>
              <motion.div
                className="absolute w-10 h-10 rounded-full bg-slate-200"
                style={{
                  top: "15%",
                  right: "15%",
                  boxShadow: "0 0 20px rgba(226, 232, 240, 0.6)"
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${10 + Math.random() * 80}%`,
                  }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ 
                    duration: 2 + Math.random() * 2, 
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </>
          )}
        </motion.div>

        {/* Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-900/40 to-transparent" />

        {/* Character */}
        <div className="absolute bottom-32 left-1/3 transform -translate-x-1/2">
          <Character state={characterState} />
        </div>

        {/* Indoor Lamp */}
        <div className="absolute top-12 left-12">
          <div 
            className="w-6 h-16 bg-amber-700 rounded-full"
            style={{ opacity: lightLevel / 100 }}
          />
          <motion.div
            className="w-12 h-12 rounded-full bg-amber-400 -mt-2 -ml-3"
            style={{ 
              opacity: lightLevel / 200,
              boxShadow: lightLevel > 50 ? "0 0 40px rgba(251, 191, 36, 0.8)" : "none"
            }}
            animate={{ scale: lightLevel > 50 ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Game-specific overlays */}
        {children}
      </div>

      {/* Stats Display Below Scene */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Light Level</div>
          <div className="text-2xl font-bold">{lightLevel}%</div>
        </div>
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Time of Day</div>
          <div className="text-2xl font-bold capitalize">
            {time.hour >= 5 && time.hour < 12 ? "Morning" : 
             time.hour >= 12 && time.hour < 17 ? "Afternoon" :
             time.hour >= 17 && time.hour < 21 ? "Evening" : "Night"}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Character</div>
          <div className="text-2xl font-bold capitalize">{characterState}</div>
        </div>
      </div>
    </div>
  )
}

// Simple character component
function Character({ state }: { state: GameSceneProps["characterState"] }) {
  return (
    <motion.svg
      width="80"
      height="120"
      viewBox="0 0 80 120"
      fill="none"
      animate={{ 
        y: state === "sleeping" ? [0, -2, 0] : [0, -5, 0]
      }}
      transition={{ 
        duration: state === "sleeping" ? 4 : 2, 
        repeat: Infinity 
      }}
    >
      {/* Head */}
      <circle cx="40" cy="20" r="12" fill="#f59e0b" />
      
      {/* Eyes */}
      <circle cx="36" cy="18" r="2" fill="#0f172a" />
      <circle cx="44" cy="18" r="2" fill="#0f172a" />
      
      {/* Body */}
      <motion.ellipse
        cx="40"
        cy="55"
        rx="18"
        ry="25"
        fill="#3b82f6"
        animate={state === "exercising" ? { rx: [18, 20, 18], ry: [25, 23, 25] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      
      {/* Arms */}
      <motion.line
        x1="25"
        y1="45"
        x2="15"
        y2={state === "exercising" ? "35" : "55"}
        stroke="#f59e0b"
        strokeWidth="4"
        strokeLinecap="round"
        animate={state === "exercising" ? { y2: [55, 35, 55] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.line
        x1="55"
        y1="45"
        x2="65"
        y2={state === "exercising" ? "35" : "55"}
        stroke="#f59e0b"
        strokeWidth="4"
        strokeLinecap="round"
        animate={state === "exercising" ? { y2: [55, 35, 55] } : {}}
        transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
      />
      
      {/* Legs */}
      {state !== "sleeping" && (
        <>
          <line x1="32" y1="75" x2="28" y2="110" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <line x1="48" y1="75" x2="52" y2="110" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      
      {/* Sleeping state - horizontal */}
      {state === "sleeping" && (
        <>
          <ellipse cx="40" cy="85" rx="25" ry="18" fill="#3b82f6" />
          <line x1="20" y1="85" x2="10" y2="85" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <line x1="60" y1="85" x2="70" y2="85" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          
          {/* ZZZ */}
          <text x="55" y="50" fill="#94a3b8" fontSize="12" fontWeight="bold">Z</text>
          <text x="60" y="40" fill="#94a3b8" fontSize="14" fontWeight="bold">Z</text>
          <text x="65" y="30" fill="#94a3b8" fontSize="16" fontWeight="bold">Z</text>
        </>
      )}
    </motion.svg>
  )
}
