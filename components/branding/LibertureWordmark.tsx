"use client"

interface LibertureWordmarkProps {
  height?: number
  className?: string
}

const PILLAR_COLORS = [
  "#8B5CF6", // Cognition - purple
  "#06B6D4", // Recovery - cyan
  "#10B981", // Fueling - green
  "#EC4899", // Mental - pink
  "#F59E0B", // Physicality - orange
  "#EAB308", // Finance - yellow
]

// Hexagon positions relative to center (cx, cy) with radius r
function hexPositions(cx: number, cy: number, r: number) {
  return [
    { x: cx - 0.5 * r, y: cy - 0.866 * r },
    { x: cx + 0.5 * r, y: cy - 0.866 * r },
    { x: cx + r, y: cy },
    { x: cx + 0.5 * r, y: cy + 0.866 * r },
    { x: cx - 0.5 * r, y: cy + 0.866 * r },
    { x: cx - r, y: cy },
  ]
}

export function LibertureWordmark({ height = 32, className = "" }: LibertureWordmarkProps) {
  // Original viewBox is 400x80, scale proportionally
  const scale = height / 80
  const width = 400 * scale

  // Hex mark: center at (30, 40), radius 16, dot radius 4
  const dots = hexPositions(30, 40, 16)
  const dotR = 4

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Liberture"
    >
      <defs>
        <filter id="wm-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {dots.map((pos, i) => (
        <circle
          key={i}
          cx={pos.x.toFixed(2)}
          cy={pos.y.toFixed(2)}
          r={dotR}
          fill={PILLAR_COLORS[i]}
          filter="url(#wm-glow)"
        />
      ))}
      <text
        x="62"
        y="50"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="36"
        fontWeight="700"
        fill="#ffffff"
      >
        Liberture
      </text>
    </svg>
  )
}
