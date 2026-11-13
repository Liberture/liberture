"use client"

import * as React from "react"
import * as Primitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

// Dialogs supply their own outer border and padding through the modal shell.
type Variant = "panel" | "embedded"
const VariantContext = React.createContext<Variant>("panel")

export function Tabs({ variant = "panel", className, ...props }: React.ComponentProps<typeof Primitive.Root> & { variant?: Variant }) {
  return (
    <VariantContext.Provider value={variant}>
      <Primitive.Root data-slot="tabs" className={cn("min-w-0", className)} {...props} />
    </VariantContext.Provider>
  )
}

export function TabsList({ className, ...props }: React.ComponentProps<typeof Primitive.List>) {
  return (
    <Primitive.List data-slot="tabs-list" className={cn("custom-scrollbar relative z-[1] -mb-px flex min-w-0 max-w-full items-end gap-1 overflow-x-auto", className)} {...props} />
  )
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger data-slot="tabs-trigger" className={cn(
      "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-t-lg border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground",
      "data-[state=active]:border-border data-[state=active]:border-b-card data-[state=active]:bg-card data-[state=active]:text-primary",
      "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring disabled:opacity-50 [&_svg]:size-4",
      className,
    )} {...props} />
  )
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof Primitive.Content>) {
  const variant = React.useContext(VariantContext)
  return (
    <Primitive.Content data-slot="tabs-content" className={cn(
      "min-w-0 focus-visible:outline-ring",
      variant === "panel" && "rounded-b-xl rounded-tr-xl border border-border bg-card p-4 sm:p-5",
      className,
    )} {...props} />
  )
}

export function TabOptions<T extends string>({ ids, icons, labels, label }: {
  ids: readonly T[]
  icons: Record<T, React.ComponentType<{ className?: string }>>
  labels: Record<T, string>
  label: string
}) {
  return <TabsList aria-label={label}>{ids.map(id => {
    const Icon: React.ComponentType<{ className?: string }> = icons[id]
    return <TabsTrigger key={id} value={id}><Icon className="size-4" />{labels[id]}</TabsTrigger>
  })}</TabsList>
}
