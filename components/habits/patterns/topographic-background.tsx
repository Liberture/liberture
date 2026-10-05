import { cn } from "@/lib/utils"

const LAYERS = [
  "topo-layer topo-vortex",
  "topo-layer topo-island",
  "topo-layer topo-micro",
  "topo-layer topo-ripple",
  "topo-layer topo-triad",
  "topo-layer topo-folded",
] as const

interface TopographicBackgroundProps {
  className?: string
}

/**
 * Fixed, non-interactive contour-map backdrop. Pair with `topo-pattern` on the
 * nearest positioned ancestor. `fixed` rather than `absolute` so the layers stay
 * put while the app's scroll containers move underneath them.
 */
export function TopographicBackground({ className }: TopographicBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
    >
      {LAYERS.map((layer) => (
        <span key={layer} className={layer} />
      ))}
    </div>
  )
}
