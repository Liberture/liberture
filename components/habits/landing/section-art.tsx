"use client"

import { useRef, type ReactNode } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

/**
 * Header drawings for the landing sections that have no artwork of their own
 * (how it works, conversation, recommendations, control, assistants, closing
 * CTA). Same language as feature-art.tsx: plain SVG in the pillar colours,
 * animated with framer-motion only while on screen and still for people who
 * ask for reduced motion. Purely decorative, so hidden from assistive tech.
 *
 * Only transforms, opacity and pathLength are animated: framer-motion reading
 * SVG geometry attributes (r, points) back from the DOM logs console errors.
 */

const PILLARS = ["#8B5CF6", "#06B6D4", "#10B981", "#EC4899", "#F59E0B", "#EAB308"]
const W = 240
const H = 120

function useAnimate() {
  const ref = useRef<SVGSVGElement>(null)
  const inView = useInView(ref, { margin: "-40px" })
  const reduce = useReducedMotion()
  return { ref, play: inView && !reduce }
}

function Canvas({ children, svgRef, className }: { children: ReactNode; svgRef: React.Ref<SVGSVGElement>; className?: string }) {
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className={className ?? "mx-auto mb-6 h-28 w-56 sm:h-32 sm:w-64"}
      aria-hidden
      focusable="false"
      fill="none"
    >
      {children}
    </svg>
  )
}

/** Glow used behind the focal element of each drawing. */
function Glow({ id, color }: { id: string; color: string }) {
  return (
    <radialGradient id={id}>
      <stop offset="0%" stopColor={color} stopOpacity={0.45} />
      <stop offset="100%" stopColor={color} stopOpacity={0} />
    </radialGradient>
  )
}

/** How it works: you → link → chat, with a signal travelling along the path. */
export function HowItWorksArt() {
  const { ref, play } = useAnimate()
  const nodes = [
    { x: 40, color: PILLARS[0] },
    { x: 120, color: PILLARS[1] },
    { x: 200, color: PILLARS[2] },
  ]
  return (
    <Canvas svgRef={ref}>
      <defs>
        <Glow id="hiw-glow" color="#06B6D4" />
        <linearGradient id="hiw-line" x1="0" x2="1">
          <stop offset="0%" stopColor={PILLARS[0]} />
          <stop offset="50%" stopColor={PILLARS[1]} />
          <stop offset="100%" stopColor={PILLARS[2]} />
        </linearGradient>
      </defs>
      <circle cx={120} cy={60} r={56} fill="url(#hiw-glow)" />
      <path d="M40 60 C 70 20, 90 20, 120 60 S 170 100, 200 60" stroke="url(#hiw-line)" strokeWidth={2} strokeOpacity={0.5} strokeDasharray="4 5" />
      <motion.path
        d="M40 60 C 70 20, 90 20, 120 60 S 170 100, 200 60"
        stroke="url(#hiw-line)"
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={play ? { pathLength: [0, 1, 1], opacity: [1, 1, 0] } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 3.2, times: [0, 0.7, 1], repeat: Infinity, ease: "easeInOut" }}
      />
      {nodes.map((n, i) => (
        <g key={n.x}>
          <circle cx={n.x} cy={60} r={17} fill="#0b0d13" stroke={n.color} strokeWidth={1.5} />
          <motion.circle
            cx={n.x}
            cy={60}
            r={17}
            stroke={n.color}
            strokeWidth={1.5}
            style={{ transformOrigin: `${n.x}px 60px` }}
            initial={{ scale: 1, opacity: 0 }}
            animate={play ? { scale: [1, 1.7], opacity: [0.6, 0] } : { scale: 1, opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, delay: i * 1.05, ease: "easeOut" }}
          />
        </g>
      ))}
      {/* person */}
      <circle cx={40} cy={55} r={4.5} stroke={PILLARS[0]} strokeWidth={1.6} />
      <path d="M32 68 a8 7 0 0 1 16 0" stroke={PILLARS[0]} strokeWidth={1.6} strokeLinecap="round" />
      {/* link: two interlocking capsules */}
      <g transform="rotate(-45 120 60)" stroke={PILLARS[1]} strokeWidth={1.8}>
        <rect x={104} y={55.5} width={17} height={9} rx={4.5} />
        <rect x={119} y={55.5} width={17} height={9} rx={4.5} />
      </g>
      {/* chat bubble */}
      <path d="M191 52 h18 a3 3 0 0 1 3 3 v9 a3 3 0 0 1 -3 3 h-10 l-5 4 v-4 h-3 a3 3 0 0 1 -3 -3 v-9 a3 3 0 0 1 3 -3 z" stroke={PILLARS[2]} strokeWidth={1.6} strokeLinejoin="round" />
      {[195, 200, 205].map((x, i) => (
        <motion.circle
          key={x}
          cx={x}
          cy={59.5}
          r={1.4}
          fill={PILLARS[2]}
          initial={{ opacity: 0.4 }}
          animate={play ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </Canvas>
  )
}

/** Conversation: a microphone with a live voice waveform either side. */
export function ConversationArt() {
  const { ref, play } = useAnimate()
  const bars = Array.from({ length: 9 }, (_, i) => i)
  const heights = [14, 26, 18, 34, 22, 30, 16, 24, 12]
  return (
    <Canvas svgRef={ref}>
      <defs>
        <Glow id="conv-glow" color="#8B5CF6" />
      </defs>
      <circle cx={120} cy={60} r={50} fill="url(#conv-glow)" />
      {[-1, 1].map((side) =>
        bars.map((i) => {
          const x = 120 + side * (34 + i * 9)
          const h = heights[i]
          const color = PILLARS[(i + (side > 0 ? 3 : 0)) % PILLARS.length]
          return (
            <motion.rect
              key={`${side}-${i}`}
              x={x - 2}
              y={60 - h / 2}
              width={4}
              height={h}
              rx={2}
              fill={color}
              fillOpacity={0.85 - i * 0.07}
              style={{ transformOrigin: `${x}px 60px` }}
              initial={{ scaleY: 1 }}
              animate={play ? { scaleY: [1, 0.35, 1.15, 0.6, 1] } : { scaleY: 1 }}
              transition={{ duration: 1.4 + (i % 3) * 0.25, repeat: Infinity, delay: i * 0.09, ease: "easeInOut" }}
            />
          )
        })
      )}
      <rect x={109} y={30} width={22} height={38} rx={11} fill="#0b0d13" stroke="#A78BFA" strokeWidth={2} />
      <path d="M101 58 a19 19 0 0 0 38 0" stroke="#A78BFA" strokeWidth={2} strokeLinecap="round" />
      <path d="M120 77 v12 M111 89 h18" stroke="#A78BFA" strokeWidth={2} strokeLinecap="round" />
      <motion.rect
        x={113}
        y={36}
        width={14}
        height={26}
        rx={7}
        fill="#8B5CF6"
        style={{ transformOrigin: "120px 62px" }}
        initial={{ scaleY: 0.6, opacity: 0.7 }}
        animate={play ? { scaleY: [0.3, 0.9, 0.5, 1, 0.3], opacity: [0.5, 0.9, 0.6, 1, 0.5] } : { scaleY: 0.6, opacity: 0.7 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </Canvas>
  )
}

/** Recommendations: a constellation of pillar stars, one picked out and linked. */
export function RecommendationsArt() {
  const { ref, play } = useAnimate()
  const stars = [
    { x: 38, y: 78 },
    { x: 72, y: 34 },
    { x: 112, y: 70 },
    { x: 150, y: 28 },
    { x: 184, y: 74 },
    { x: 214, y: 40 },
  ]
  const pick = 3
  return (
    <Canvas svgRef={ref}>
      <defs>
        <Glow id="rec-glow" color={PILLARS[pick]} />
      </defs>
      <polyline points={stars.map((s) => `${s.x},${s.y}`).join(" ")} stroke="white" strokeOpacity={0.15} strokeDasharray="3 4" />
      <motion.polyline
        points={stars.map((s) => `${s.x},${s.y}`).join(" ")}
        stroke="url(#rec-line)"
        strokeWidth={1.5}
        strokeOpacity={0.6}
        initial={{ pathLength: 0 }}
        animate={play ? { pathLength: [0, 1] } : { pathLength: 1 }}
        transition={{ duration: 2.4, ease: "easeInOut" }}
      />
      <defs>
        <linearGradient id="rec-line" x1="0" x2="1">
          {PILLARS.map((c, i) => (
            <stop key={c} offset={`${(i / (PILLARS.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <circle cx={stars[pick].x} cy={stars[pick].y} r={30} fill="url(#rec-glow)" />
      {stars.map((s, i) => (
        <motion.g
          key={i}
          style={{ transformOrigin: `${s.x}px ${s.y}px` }}
          initial={{ scale: 1, opacity: 0.9 }}
          animate={play ? { scale: [1, 1.25, 1], opacity: [0.75, 1, 0.75] } : { scale: 1, opacity: 0.9 }}
          transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
        >
          <path
            d={`M${s.x} ${s.y - 7} L${s.x + 2} ${s.y - 2} L${s.x + 7} ${s.y} L${s.x + 2} ${s.y + 2} L${s.x} ${s.y + 7} L${s.x - 2} ${s.y + 2} L${s.x - 7} ${s.y} L${s.x - 2} ${s.y - 2} Z`}
            fill={PILLARS[i]}
            style={{ filter: `drop-shadow(0 0 4px ${PILLARS[i]})` }}
          />
        </motion.g>
      ))}
      {/* the picked one gets a ring and an outbound "read more" arrow */}
      <motion.circle
        cx={stars[pick].x}
        cy={stars[pick].y}
        r={13}
        stroke={PILLARS[pick]}
        strokeWidth={1.5}
        style={{ transformOrigin: `${stars[pick].x}px ${stars[pick].y}px` }}
        initial={{ scale: 1, opacity: 0.8 }}
        animate={play ? { scale: [1, 1.5], opacity: [0.8, 0] } : { scale: 1, opacity: 0.8 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
      />
      <path d="M162 16 h14 v14 M176 16 l-12 12" stroke={PILLARS[pick]} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </Canvas>
  )
}

/** Control: a shield holding three switches; two on, one (delete) off. */
export function ControlArt() {
  const { ref, play } = useAnimate()
  const rows = [
    { y: 44, on: true, color: "#10B981" },
    { y: 62, on: true, color: "#10B981" },
    { y: 80, on: false, color: "#F97316" },
  ]
  return (
    <Canvas svgRef={ref}>
      <defs>
        <Glow id="ctl-glow" color="#10B981" />
        <linearGradient id="ctl-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <circle cx={120} cy={62} r={56} fill="url(#ctl-glow)" />
      <motion.path
        d="M120 10 L164 24 V58 C164 86 144 104 120 112 C96 104 76 86 76 58 V24 Z"
        fill="url(#ctl-shield)"
        stroke="#10B981"
        strokeWidth={1.8}
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={play ? { pathLength: 1 } : { pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
      {rows.map((row, i) => {
        const trackX = 110
        const knobOn = trackX + 13
        const knobOff = trackX + 3
        return (
          <g key={row.y}>
            <rect x={88} y={row.y - 1.5} width={16} height={3} rx={1.5} fill="white" fillOpacity={0.25} />
            <rect x={trackX} y={row.y - 6} width={22} height={12} rx={6} fill={row.color} fillOpacity={row.on ? 0.35 : 0.15} stroke={row.color} strokeOpacity={0.7} />
            <motion.circle
              cx={0}
              cy={row.y}
              r={4.5}
              fill={row.on ? row.color : "#94a3b8"}
              initial={{ x: row.on ? knobOn : knobOff }}
              animate={
                play
                  ? { x: row.on ? [knobOff, knobOn, knobOn] : [knobOff, knobOff, knobOff] }
                  : { x: row.on ? knobOn : knobOff }
              }
              transition={{ duration: 1.2, delay: 0.6 + i * 0.25, ease: "easeOut" }}
            />
          </g>
        )
      })}
      {/* a key off to the side: your login key never leaves you */}
      <motion.g
        initial={{ rotate: 0 }}
        animate={play ? { rotate: [0, -10, 0] } : { rotate: 0 }}
        style={{ transformOrigin: "196px 60px" }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx={190} cy={60} r={7} stroke="#EAB308" strokeWidth={1.8} />
        <path d="M197 60 h20 M211 60 v5 M216 60 v4" stroke="#EAB308" strokeWidth={1.8} strokeLinecap="round" />
      </motion.g>
      <g opacity={0.5}>
        <circle cx={40} cy={44} r={3} fill="#8B5CF6" />
        <circle cx={28} cy={70} r={2} fill="#06B6D4" />
        <circle cx={52} cy={86} r={2.5} fill="#EC4899" />
      </g>
    </Canvas>
  )
}

/** Assistants: two chat apps wired into Liberture's hexagon, data flowing both ways. */
export function AssistantsArt() {
  const { ref, play } = useAnimate()
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return { x: 120 + 22 * Math.cos(a), y: 60 + 22 * Math.sin(a) }
  })
  return (
    <Canvas svgRef={ref}>
      <defs>
        <Glow id="as-glow" color="#8B5CF6" />
      </defs>
      <circle cx={120} cy={60} r={48} fill="url(#as-glow)" />
      {/* wires */}
      <path d="M58 60 H96" stroke="#D97757" strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="3 4" />
      <path d="M144 60 H182" stroke="white" strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="3 4" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <motion.circle
            cx={0}
            cy={60}
            r={2.6}
            fill="#D97757"
            initial={{ x: 58, opacity: 0 }}
            animate={play ? { x: [58, 96], opacity: [0, 1, 0] } : { x: 77, opacity: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: "linear" }}
          />
          <motion.circle
            cx={0}
            cy={60}
            r={2.6}
            fill="#e2e8f0"
            initial={{ x: 182, opacity: 0 }}
            animate={play ? { x: [182, 144], opacity: [0, 1, 0] } : { x: 163, opacity: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.25 + i * 0.5, ease: "linear" }}
          />
        </g>
      ))}
      {/* Claude-ish card (left) */}
      <rect x={14} y={38} width={44} height={44} rx={12} fill="#0b0d13" stroke="#D97757" strokeOpacity={0.8} strokeWidth={1.5} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI / 4) * i
        return (
          <path
            key={i}
            d={`M${36 + 4 * Math.cos(a)} ${60 + 4 * Math.sin(a)} L${36 + 11 * Math.cos(a)} ${60 + 11 * Math.sin(a)}`}
            stroke="#D97757"
            strokeWidth={2}
            strokeLinecap="round"
          />
        )
      })}
      {/* ChatGPT-ish card (right) */}
      <rect x={182} y={38} width={44} height={44} rx={12} fill="#0b0d13" stroke="white" strokeOpacity={0.5} strokeWidth={1.5} />
      <motion.g
        style={{ transformOrigin: "204px 60px" }}
        initial={{ rotate: 0 }}
        animate={play ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        {[0, 60, 120].map((deg) => (
          <ellipse key={deg} cx={204} cy={60} rx={11} ry={5} stroke="#e2e8f0" strokeWidth={1.4} transform={`rotate(${deg} 204 60)`} />
        ))}
      </motion.g>
      {/* Liberture hexagon (centre) */}
      <motion.g
        style={{ transformOrigin: "120px 60px" }}
        initial={{ rotate: 0 }}
        animate={play ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      >
        <polygon points={hex.map((p) => `${p.x},${p.y}`).join(" ")} fill="#0b0d13" stroke="white" strokeOpacity={0.25} />
        {hex.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={PILLARS[i]} style={{ filter: `drop-shadow(0 0 4px ${PILLARS[i]})` }} />
        ))}
      </motion.g>
      <text x={120} y={64} textAnchor="middle" fontSize={11} fontWeight={700} fill="white" fillOpacity={0.9}>
        MCP
      </text>
    </Canvas>
  )
}

/** Closing CTA: a sunrise over a ridge, the six pillars rising with it. */
export function SunriseArt() {
  const { ref, play } = useAnimate()
  return (
    <Canvas svgRef={ref} className="mx-auto mb-4 h-28 w-60 sm:h-32 sm:w-72">
      <defs>
        <radialGradient id="sun-core" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
          <stop offset="45%" stopColor="#EC4899" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="sun-ridge" x1="0" x2="1">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <clipPath id="sun-clip">
          <rect x={0} y={0} width={W} height={92} />
        </clipPath>
      </defs>
      <g clipPath="url(#sun-clip)">
        <motion.g
          initial={{ y: 18 }}
          animate={play ? { y: [18, 0] } : { y: 0 }}
          transition={{ duration: 2.2, ease: "easeOut" }}
        >
          <circle cx={120} cy={96} r={60} fill="url(#sun-core)" />
          <circle cx={120} cy={96} r={26} fill="#F59E0B" fillOpacity={0.85} />
          {[36, 46, 58].map((r, i) => (
            <motion.circle
              key={r}
              cx={120}
              cy={96}
              r={r}
              stroke="#F59E0B"
              strokeOpacity={0.35 - i * 0.08}
              style={{ transformOrigin: "120px 96px" }}
              initial={{ scale: 1 }}
              animate={play ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
            />
          ))}
        </motion.g>
      </g>
      {/* rising pillar dots on an arc */}
      {PILLARS.map((c, i) => {
        const a = Math.PI + (Math.PI / (PILLARS.length + 1)) * (i + 1)
        const x = 120 + 88 * Math.cos(a)
        const y = 96 + 70 * Math.sin(a)
        return (
          <motion.circle
            key={c}
            cx={x}
            cy={y}
            r={4.5}
            fill={c}
            style={{ filter: `drop-shadow(0 0 5px ${c})` }}
            initial={{ opacity: 0.9, y: 0 }}
            animate={play ? { opacity: [0, 1], y: [10, 0] } : { opacity: 0.9, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 + i * 0.15, ease: "easeOut" }}
          />
        )
      })}
      <path d="M0 96 C 40 80, 60 100, 96 90 S 160 78, 190 92 S 226 86, 240 94" stroke="url(#sun-ridge)" strokeWidth={2} />
      <path d="M0 106 C 50 96, 80 112, 120 104 S 200 96, 240 108" stroke="url(#sun-ridge)" strokeOpacity={0.45} strokeWidth={1.5} />
      <path d="M0 116 C 60 110, 100 120, 150 114 S 210 110, 240 118" stroke="url(#sun-ridge)" strokeOpacity={0.25} strokeWidth={1.2} />
    </Canvas>
  )
}
