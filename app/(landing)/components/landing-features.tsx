import { Target, Trophy, BarChart3, Layers, Gamepad2, LineChart } from "lucide-react"
import { IslandRidge, TriadBasins } from "./patterns"
import { translations } from "@/lib/translations"
import { IconCardGrid } from "./icon-card-grid"

const featureIcons = {
  "Six Optimization Pillars": Layers,
  "Gamified Progress": Gamepad2,
  "BOS Level Tracking": BarChart3,
  "Smart Protocols": Target,
  "Achievement System": Trophy,
  "Unified Analytics": LineChart,
}

export function LandingFeatures() {
  const { features } = translations.en.landing
  const featureItems = features.items.map((feature) => {
    const iconKey = feature.title as keyof typeof featureIcons
    const Icon = featureIcons[iconKey] ?? Layers

    return {
      title: feature.title,
      description: feature.description,
      icon: Icon,
      iconClassName: "text-primary",
      iconWrapperClassName: "h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4",
      cardClassName: "backdrop-blur-sm border-border/50 hover:border-border",
    }
  })
  return (
    <section id="features" className="relative overflow-hidden py-20 px-4">
      <TriadBasins
        placement="corner"
        gradient="acidLime"
        size="360px"
        className="-left-10 top-0"
        opacity={0.22}
      />
      <IslandRidge
        placement="corner"
        gradient="magma"
        size="420px"
        className="-right-10 bottom-0 rotate-6"
        opacity={0.2}
      />
      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{features.heading}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{features.description}</p>
        </div>

        <IconCardGrid
          items={featureItems}
          gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          defaultCardClassName="transition-colors"
        />
      </div>
    </section>
  )
}
