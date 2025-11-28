import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type LandingSectionProps = {
  id?: string
  className?: string
  containerClassName?: string
  withContainer?: boolean
  children: ReactNode
}

type LandingSectionHeaderProps = {
  heading: string
  description?: string
  badge?: string
  align?: "center" | "start"
  className?: string
  headingClassName?: string
  descriptionClassName?: string
}

export function LandingSection({
  id,
  className,
  containerClassName,
  withContainer = true,
  children,
}: LandingSectionProps) {
  const content = withContainer ? (
    <div className={cn("container mx-auto max-w-7xl", containerClassName)}>{children}</div>
  ) : (
    children
  )

  return (
    <section id={id} className={cn("py-20 px-4", className)}>
      {content}
    </section>
  )
}

export function LandingSectionHeader({
  badge,
  heading,
  description,
  align = "center",
  className,
  headingClassName,
  descriptionClassName,
}: LandingSectionHeaderProps) {
  const alignment = align === "center" ? "text-center" : "text-left"
  const descriptionAlignment =
    align === "center" ? "max-w-2xl mx-auto" : "max-w-2xl"

  return (
    <div className={cn("mb-12", alignment, className)}>
      {badge ? (
        <span className="text-primary text-sm font-medium uppercase tracking-wider">{badge}</span>
      ) : null}
      <h2 className={cn("text-3xl md:text-4xl font-bold mt-2 mb-4", headingClassName)}>{heading}</h2>
      {description ? (
        <p
          className={cn(
            "text-muted-foreground",
            descriptionAlignment,
            descriptionClassName,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  )
}
