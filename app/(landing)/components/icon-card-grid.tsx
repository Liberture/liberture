import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type IconCardItem = {
  title: string
  description: string
  icon: LucideIcon
  cardClassName?: string
  iconClassName?: string
  iconWrapperClassName?: string
}

type IconCardGridProps = {
  items: IconCardItem[]
  gridClassName?: string
  defaultCardClassName?: string
}

export function IconCardGrid({ items, gridClassName, defaultCardClassName }: IconCardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", gridClassName)}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.title}
            className={cn(
              "p-6 rounded-2xl bg-card/50 border border-border/50 transition-colors",
              defaultCardClassName,
              item.cardClassName,
            )}
          >
            {item.iconWrapperClassName ? (
              <div className={item.iconWrapperClassName}>
                <Icon className={cn("h-6 w-6", item.iconClassName)} />
              </div>
            ) : (
              <Icon className={cn("h-10 w-10 mb-4", item.iconClassName)} />
            )}
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        )
      })}
    </div>
  )
}
