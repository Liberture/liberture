"use client"

import { LibertureLogo } from "@/components/branding/LibertureLogo"

export default function LogoTestPage() {
  return (
    <div className="min-h-screen bg-background p-12">
      <h1 className="text-4xl font-bold mb-12 text-center">Logo Animation Options</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
        {/* Option 1: Current (broken) */}
        <div className="p-8 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold mb-6">Option 1: Current (Broken)</h2>
          <div className="flex justify-center bg-background/50 rounded-xl p-12">
            <LibertureLogo size={120} animate={true} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Problem: Dots snap back to vertical instantly, then start orbit animation
          </p>
        </div>

        {/* Option 2: Smooth Return */}
        <div className="p-8 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold mb-6">Option 2: Smooth Return</h2>
          <div className="flex justify-center bg-background/50 rounded-xl p-12">
            <LogoOption2 size={120} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Dots smoothly transition back to vertical line before starting next orbit
          </p>
        </div>

        {/* Option 3: No Return (Continuous) */}
        <div className="p-8 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold mb-6">Option 3: Continuous Orbit</h2>
          <div className="flex justify-center bg-background/50 rounded-xl p-12">
            <LogoOption3 size={120} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Dots orbit continuously, never return to vertical (simplest)
          </p>
        </div>

        {/* Option 4: Pulsing Vertical */}
        <div className="p-8 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold mb-6">Option 4: Pulsing Vertical</h2>
          <div className="flex justify-center bg-background/50 rounded-xl p-12">
            <LogoOption4 size={120} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Stays vertical, dots gently pulse in place (subtle)
          </p>
        </div>

        {/* Option 5: Slow Orbit with Pause */}
        <div className="p-8 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold mb-6">Option 5: Orbit with Pause</h2>
          <div className="flex justify-center bg-background/50 rounded-xl p-12">
            <LogoOption5 size={120} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Orbits, pauses at vertical for 1s, then orbits again (rhythmic)
          </p>
        </div>

        {/* Option 6: Wave Pattern */}
        <div className="p-8 rounded-2xl bg-card border border-border">
          <h2 className="text-xl font-semibold mb-6">Option 6: Vertical Wave</h2>
          <div className="flex justify-center bg-background/50 rounded-xl p-12">
            <LogoOption6 size={120} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Dots stay in vertical line but wave up and down
          </p>
        </div>
      </div>
    </div>
  )
}

// Option 2: Smooth return to vertical
function LogoOption2({ size }: { size: number }) {
  const { motion } = require("framer-motion")
  const PILLAR_COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#EC4899", "#F59E0B", "#EAB308"]
  const dotSize = size * 0.12
  const spacing = size * 0.15
  
  const getEllipsePath = (index: number, progress: number) => {
    const centerY = size / 2
    const radiusX = size * 0.35
    const radiusY = size * 0.15
    const stagger = (index / 6) * Math.PI * 2
    const totalAngle = progress * Math.PI * 2 + stagger
    const x = size / 2 + radiusX * Math.cos(totalAngle)
    const y = centerY + radiusY * Math.sin(totalAngle)
    return { x, y }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {PILLAR_COLORS.map((color, index) => {
        const startY = spacing + index * spacing
        const positions = Array.from({ length: 100 }, (_, i) => getEllipsePath(index, i / 100))
        
        return (
          <motion.circle
            key={index}
            r={dotSize}
            fill={color}
            animate={{
              cx: [...positions.map(p => p.x), size / 2],
              cy: [...positions.map(p => p.y), startY],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ filter: `drop-shadow(0 0 ${dotSize * 0.5}px ${color})` }}
          />
        )
      })}
    </svg>
  )
}

// Option 3: Continuous orbit (no return)
function LogoOption3({ size }: { size: number }) {
  const { motion } = require("framer-motion")
  const PILLAR_COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#EC4899", "#F59E0B", "#EAB308"]
  const dotSize = size * 0.12
  
  const getEllipsePath = (index: number, progress: number) => {
    const centerY = size / 2
    const radiusX = size * 0.35
    const radiusY = size * 0.15
    const stagger = (index / 6) * Math.PI * 2
    const totalAngle = progress * Math.PI * 2 + stagger
    const x = size / 2 + radiusX * Math.cos(totalAngle)
    const y = centerY + radiusY * Math.sin(totalAngle)
    return { x, y }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {PILLAR_COLORS.map((color, index) => (
        <motion.circle
          key={index}
          r={dotSize}
          fill={color}
          animate={{
            cx: Array.from({ length: 100 }, (_, i) => getEllipsePath(index, i / 100).x),
            cy: Array.from({ length: 100 }, (_, i) => getEllipsePath(index, i / 100).y),
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ filter: `drop-shadow(0 0 ${dotSize * 0.5}px ${color})` }}
        />
      ))}
    </svg>
  )
}

// Option 4: Pulsing vertical
function LogoOption4({ size }: { size: number }) {
  const { motion } = require("framer-motion")
  const PILLAR_COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#EC4899", "#F59E0B", "#EAB308"]
  const dotSize = size * 0.12
  const spacing = size * 0.15

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {PILLAR_COLORS.map((color, index) => {
        const startY = spacing + index * spacing
        return (
          <motion.circle
            key={index}
            r={dotSize}
            cx={size / 2}
            fill={color}
            animate={{
              cy: [startY, startY - 5, startY],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.1,
              ease: "easeInOut",
            }}
            style={{ filter: `drop-shadow(0 0 ${dotSize * 0.5}px ${color})` }}
          />
        )
      })}
    </svg>
  )
}

// Option 5: Orbit with pause
function LogoOption5({ size }: { size: number }) {
  const { motion } = require("framer-motion")
  const PILLAR_COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#EC4899", "#F59E0B", "#EAB308"]
  const dotSize = size * 0.12
  const spacing = size * 0.15
  
  const getEllipsePath = (index: number, progress: number) => {
    const centerY = size / 2
    const radiusX = size * 0.35
    const radiusY = size * 0.15
    const stagger = (index / 6) * Math.PI * 2
    const totalAngle = progress * Math.PI * 2 + stagger
    const x = size / 2 + radiusX * Math.cos(totalAngle)
    const y = centerY + radiusY * Math.sin(totalAngle)
    return { x, y }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {PILLAR_COLORS.map((color, index) => {
        const startY = spacing + index * spacing
        const positions = Array.from({ length: 80 }, (_, i) => getEllipsePath(index, i / 80))
        
        return (
          <motion.circle
            key={index}
            r={dotSize}
            fill={color}
            animate={{
              cx: [...positions.map(p => p.x), size / 2, size / 2],
              cy: [...positions.map(p => p.y), startY, startY],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.8, 0.9, 1],
            }}
            style={{ filter: `drop-shadow(0 0 ${dotSize * 0.5}px ${color})` }}
          />
        )
      })}
    </svg>
  )
}

// Option 6: Vertical wave
function LogoOption6({ size }: { size: number }) {
  const { motion } = require("framer-motion")
  const PILLAR_COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#EC4899", "#F59E0B", "#EAB308"]
  const dotSize = size * 0.12
  const spacing = size * 0.15

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {PILLAR_COLORS.map((color, index) => {
        const startY = spacing + index * spacing
        return (
          <motion.circle
            key={index}
            r={dotSize}
            cx={size / 2}
            fill={color}
            animate={{
              cy: [startY, startY - 10, startY + 10, startY],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
            style={{ filter: `drop-shadow(0 0 ${dotSize * 0.5}px ${color})` }}
          />
        )
      })}
    </svg>
  )
}
