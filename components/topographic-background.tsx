import { cn } from "@/lib/utils"

type TopographicBackgroundProps = {
  className?: string
}

export function TopographicBackground({ className }: TopographicBackgroundProps) {
  const layers = [
    { key: "vortex", className: "topo-layer topo-vortex" },
    { key: "island", className: "topo-layer topo-island" },
    { key: "micro", className: "topo-layer topo-micro" },
    { key: "ripple", className: "topo-layer topo-ripple" },
    { key: "triad", className: "topo-layer topo-triad" },
    { key: "folded", className: "topo-layer topo-folded" },
  ]

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {layers.map((layer) => (
        <span key={layer.key} className={layer.className} />
      ))}
    </div>
  )
}
