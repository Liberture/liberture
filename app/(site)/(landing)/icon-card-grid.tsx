import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type IconCardItem = {
  title: string
  description?: string
  icon: LucideIcon
  cardClassName?: string
  iconClassName?: string
  iconWrapperClassName?: string
  contentClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

type IconCardGridProps = {
  items: IconCardItem[]
  gridClassName?: string
  defaultCardClassName?: string
  cardBaseClassName?: string
  defaultIconClassName?: string
  defaultTitleClassName?: string
  defaultDescriptionClassName?: string
}

export function IconCardGrid({
  items,
  gridClassName,
  defaultCardClassName,
  cardBaseClassName = "p-6 rounded-2xl bg-card/50 border border-border/50 transition-colors",
  defaultIconClassName = "h-10 w-10 mb-4",
  defaultTitleClassName = "text-lg font-semibold mb-2",
  defaultDescriptionClassName = "text-sm text-muted-foreground",
}: IconCardGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6", gridClassName)}>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.title}
            className={cn(
              cardBaseClassName,
              defaultCardClassName,
              item.cardClassName,
            )}
          >
            <div className={item.contentClassName}>
              {item.iconWrapperClassName ? (
                <div className={item.iconWrapperClassName}>
                  <Icon className={cn("h-6 w-6", item.iconClassName)} />
                </div>
              ) : (
                <Icon className={cn(defaultIconClassName, item.iconClassName)} />
              )}
              <h3 className={cn(defaultTitleClassName, item.titleClassName)}>{item.title}</h3>
              {item.description ? (
                <p className={cn(defaultDescriptionClassName, item.descriptionClassName)}>
                  {item.description}
                </p>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
