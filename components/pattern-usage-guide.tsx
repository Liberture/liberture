import { gradientPalette } from "@/components/patterns"

export function PatternUsageGuide() {
  const gradients = Object.keys(gradientPalette)

  return (
    <section className="py-10 px-4 border-t border-border/40 bg-card/30">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p className="text-foreground font-semibold">Pattern usage quick guide</p>
          <p>
            Use hero with one full-spread pattern plus a secondary corner anchor. Feature or platform sections work best
            with opposing corners, while the footer prefers a single wide, subtle ridge.
          </p>
          <div className="flex flex-wrap gap-3">
            {gradients.map((gradient) => (
              <span
                key={gradient}
                className="px-3 py-1 rounded-full border border-border/50 bg-background/70 text-xs text-foreground"
              >
                {gradient}
              </span>
            ))}
          </div>
          <p className="text-xs">
            Keep opacity light (0.18–0.3), pointer events off, and lean on the gradients above for aggressive color pops.
          </p>
        </div>
      </div>
    </section>
  )
}
