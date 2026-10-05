import { cn } from "@/lib/utils"

/**
 * Port of Liberture's AnimatedBackground — drifting gradient orbs only (the
 * upstream rotating ring and square grid are left out on purpose). Upstream uses Framer Motion; the same motion
 * is expressed as CSS keyframes in globals.css so no dependency is added.
 */
export function AnimatedBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      <span
        className="lb-orb left-1/4 top-1/4 h-96 w-96 bg-primary/20"
        style={{ animationDelay: "0s" }}
      />
      <span
        className="lb-orb bottom-1/4 right-1/4 h-96 w-96 bg-sleep/20"
        style={{ animationDelay: "1.4s" }}
      />
      <span
        className="lb-orb right-1/3 top-2/3 h-72 w-72 bg-mind/15"
        style={{ animationDelay: "2.8s" }}
      />
    </div>
  )
}
