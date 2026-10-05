import { cn } from "@/lib/utils"

/**
 * Liberture's mark: six pillar-coloured dots on a hexagon, slowly rotating
 * (a CSS port of LibertureLogo in /root/liberture, which uses framer-motion).
 * Purely decorative next to the wordmark; the rotation stops for people who
 * ask for reduced motion.
 */

const PILLAR_COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#EC4899", "#F59E0B", "#EAB308"]
const HEX = [
  [-0.5, -0.866],
  [0.5, -0.866],
  [1, 0],
  [0.5, 0.866],
  [-0.5, 0.866],
  [-1, 0],
]

interface LibertureLogoProps {
  size?: number
  animate?: boolean
  className?: string
}

export function LibertureLogo({ size = 36, animate = true, className }: LibertureLogoProps) {
  const center = size / 2
  const r = size * 0.3
  const dot = size * 0.08
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden className={cn("shrink-0", className)}>
      <g className={animate ? "lb-logo-spin" : undefined} style={{ transformOrigin: `${center}px ${center}px` }}>
        {PILLAR_COLORS.map((color, i) => (
          <circle
            key={color}
            cx={center + r * HEX[i][0]}
            cy={center + r * HEX[i][1]}
            r={dot}
            fill={color}
            style={{ filter: `drop-shadow(0 0 ${dot * 0.6}px ${color})` }}
          />
        ))}
      </g>
    </svg>
  )
}
