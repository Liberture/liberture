"use client"

import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

/**
 * One small animated illustration per landing feature, so each card shows its
 * idea instead of a generic icon. Plain SVG on a 160×96 canvas, animated with
 * framer-motion only while on screen, and still for people who ask for
 * reduced motion.
 */

const COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#EC4899", "#F59E0B", "#EAB308"]
const W = 160
const H = 96

function useAnimate() {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { margin: "-40px" })
  const reduce = useReducedMotion()
  return { ref, play: inView && !reduce }
}

function Canvas({ children, label, svgRef }: { children: React.ReactNode; label: string; svgRef: React.Ref<SVGSVGElement> }) {
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-24 w-40" role="img" aria-label={label} fill="none">
      {children}
    </svg>
  )
}

const hex = (cx: number, cy: number, r: number, i: number) => {
  const a = (Math.PI / 3) * i - Math.PI / 2
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

/** Six pillars: a hexagon of the six pillar colours, linked and slowly turning. */
export function PillarsArt() {
  const { ref, play } = useAnimate()
  const pts = COLORS.map((_, i) => hex(80, 48, 32, i))
  return (
    <Canvas svgRef={ref} label="Six connected pillars">
      <motion.g
        style={{ originX: 0.5, originY: 0.5 }}
        animate={play ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      >
        <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} stroke="white" strokeOpacity={0.15} />
        {pts.map((p, i) => (
          <line key={`l${i}`} x1={80} y1={48} x2={p.x} y2={p.y} stroke={COLORS[i]} strokeOpacity={0.35} />
        ))}
        {pts.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={6}
            fill={COLORS[i]}
            style={{ filter: `drop-shadow(0 0 6px ${COLORS[i]})` }}
            initial={{ r: 6 }}
            animate={play ? { r: [6, 8, 6] } : { r: 6 }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          />
        ))}
      </motion.g>
      <circle cx={80} cy={48} r={5} fill="white" fillOpacity={0.9} />
    </Canvas>
  )
}

/** Streaks and level-ups: a week of days filling in, then the flame grows. */
export function StreakArt() {
  const { ref, play } = useAnimate()
  return (
    <Canvas svgRef={ref} label="A streak filling day by day">
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i}>
          <rect x={12 + i * 18} y={58} width={14} height={14} rx={3} fill="white" fillOpacity={0.06} stroke="white" strokeOpacity={0.12} />
          <motion.rect
            x={12 + i * 18}
            y={58}
            width={14}
            height={14}
            rx={3}
            fill="#10B981"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={play ? { opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.4] } : { opacity: 1, scale: 1 }}
            transition={{ duration: 5, times: [0, 0.08, 0.9, 1], repeat: Infinity, delay: i * 0.35 }}
            style={{ originX: 0.5, originY: 0.5 }}
          />
        </g>
      ))}
      <g transform="translate(-14 -6) scale(0.9)">
        <motion.path
          d="M140 50c-7-6-9-14-5-22 1 6 5 8 7 8-1-8 3-14 9-18-2 8 3 12 4 18 2-2 3-4 3-7 4 6 4 14-1 20-4 4-11 4-17 1z"
          fill="#F59E0B"
          style={{ originX: 0.5, originY: 1, filter: "drop-shadow(0 0 8px #F59E0B)" }}
          animate={play ? { scale: [0.85, 1.1, 0.85] } : { scale: 1 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </g>
      <text x={12} y={40} fill="white" fillOpacity={0.85} fontSize={18} fontWeight={700} fontFamily="inherit">
        7
      </text>
      <text x={26} y={40} fill="white" fillOpacity={0.5} fontSize={10} fontFamily="inherit">
        days in a row
      </text>
    </Canvas>
  )
}

/** Pillar balance: a radar of the six pillars, its shape shifting as the week does. */
export function BalanceArt() {
  const { ref, play } = useAnimate()
  const shape = (vals: number[]) => vals.map((v, i) => hex(80, 50, 38 * v, i)).map((p) => `${p.x},${p.y}`).join(" ")
  const a = shape([0.9, 0.5, 0.7, 0.4, 0.8, 0.6])
  const b = shape([0.6, 0.85, 0.5, 0.75, 0.55, 0.9])
  const c = shape([0.75, 0.7, 0.9, 0.6, 0.7, 0.45])
  return (
    <Canvas svgRef={ref} label="Balance across the six pillars">
      {[1, 0.66, 0.33].map((s) => (
        <polygon key={s} points={shape([s, s, s, s, s, s])} stroke="white" strokeOpacity={0.1} />
      ))}
      {COLORS.map((col, i) => {
        const p = hex(80, 50, 38, i)
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill={col} />
      })}
      <motion.polygon
        points={a}
        fill="#8B5CF6"
        fillOpacity={0.3}
        stroke="#A78BFA"
        strokeWidth={1.5}
        initial={{ points: a }}
        animate={play ? { points: [a, b, c, a] } : { points: a }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
    </Canvas>
  )
}

/** Protocols: steps ticked off one after another. */
export function ProtocolArt() {
  const { ref, play } = useAnimate()
  return (
    <Canvas svgRef={ref} label="Protocol steps being checked off">
      {[0, 1, 2].map((i) => {
        const y = 18 + i * 26
        return (
          <g key={i}>
            <rect x={28} y={y} width={18} height={18} rx={5} stroke="white" strokeOpacity={0.25} />
            <motion.path
              d={`M32 ${y + 9} l4 4 l7 -8`}
              stroke="#10B981"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={play ? { pathLength: [0, 1, 1, 0] } : { pathLength: 1 }}
              transition={{ duration: 4.5, times: [0, 0.15, 0.85, 1], repeat: Infinity, delay: i * 0.6 }}
            />
            <rect x={54} y={y + 4} width={[76, 60, 68][i]} height={4} rx={2} fill="white" fillOpacity={0.35} />
            <rect x={54} y={y + 11} width={[48, 70, 40][i]} height={3} rx={1.5} fill="white" fillOpacity={0.15} />
          </g>
        )
      })}
    </Canvas>
  )
}

/** Voice check-ins: a mic, its sound bars, and the reply landing. */
export function VoiceArt() {
  const { ref, play } = useAnimate()
  return (
    <Canvas svgRef={ref} label="Talking to your assistant">
      <rect x={18} y={24} width={16} height={28} rx={8} fill="#8B5CF6" style={{ filter: "drop-shadow(0 0 8px #8B5CF6)" }} />
      <path d="M12 44a14 14 0 0 0 28 0M26 58v8M18 66h16" stroke="white" strokeOpacity={0.6} strokeWidth={2} strokeLinecap="round" />
      {Array.from({ length: 7 }, (_, i) => (
        <motion.rect
          key={i}
          x={52 + i * 7}
          y={30}
          width={4}
          height={36}
          rx={2}
          fill="#06B6D4"
          style={{ originX: 0.5, originY: 0.5 }}
          animate={play ? { scaleY: [0.2, 1, 0.35, 0.8, 0.2] } : { scaleY: 0.5 }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
        />
      ))}
      <motion.g
        animate={play ? { opacity: [0, 1, 1, 0], y: [6, 0, 0, -4] } : { opacity: 1, y: 0 }}
        transition={{ duration: 4, times: [0, 0.15, 0.85, 1], repeat: Infinity, delay: 0.8 }}
      >
        <rect x={104} y={22} width={46} height={26} rx={8} fill="white" fillOpacity={0.1} stroke="white" strokeOpacity={0.2} />
        <path d="M112 35l4 4 7-8" stroke="#10B981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <rect x={127} y={33} width={16} height={4} rx={2} fill="white" fillOpacity={0.4} />
      </motion.g>
    </Canvas>
  )
}

/** Analytics: two trend lines drawing in over a grid. */
export function AnalyticsArt() {
  const { ref, play } = useAnimate()
  const lines = [
    { d: "M10 74 L40 60 L70 64 L100 40 L130 34 L150 20", color: "#06B6D4" },
    { d: "M10 80 L40 76 L70 58 L100 62 L130 50 L150 46", color: "#EC4899" },
  ]
  return (
    <Canvas svgRef={ref} label="Trends across your habits">
      {[24, 44, 64, 84].map((y) => (
        <line key={y} x1={8} x2={152} y1={y} y2={y} stroke="white" strokeOpacity={0.07} />
      ))}
      {lines.map((l, i) => (
        <motion.path
          key={i}
          d={l.d}
          stroke={l.color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 4px ${l.color})` }}
          initial={{ pathLength: 0 }}
          animate={play ? { pathLength: [0, 1, 1, 0] } : { pathLength: 1 }}
          transition={{ duration: 5, times: [0, 0.4, 0.9, 1], repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
        />
      ))}
      <motion.circle
        cx={150}
        cy={20}
        r={4}
        fill="#06B6D4"
        initial={{ r: 4 }}
        animate={play ? { opacity: [0, 0, 1, 1, 0], r: [2, 2, 5, 4, 2] } : { opacity: 1 }}
        transition={{ duration: 5, times: [0, 0.38, 0.45, 0.9, 1], repeat: Infinity }}
      />
    </Canvas>
  )
}
