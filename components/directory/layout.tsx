import type { ReactNode } from "react"
import { IslandRidge, RippleBloom } from "@/components/patterns"

export function DirectoryLayout({ children }: { children: ReactNode }) {
  return <div className="relative min-h-screen overflow-clip px-4 py-12">
    <IslandRidge placement="corner" gradient="neon" size="420px" className="-left-24 -top-16" opacity={0.13} />
    <RippleBloom placement="corner" gradient="plasma" size="380px" className="-right-20 top-1/3" opacity={0.11} />
    <div className="relative mx-auto w-full max-w-6xl">{children}</div>
  </div>
}

export function DirectoryHeader({ title, description, eyebrow }: { title: string; description: string; eyebrow?: string }) {
  return <header className="mx-auto mb-8 max-w-3xl text-center">
    {eyebrow && <span className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</span>}
    <h1 className="mt-2 text-4xl font-bold md:text-5xl">{title}</h1>
    <p className="mt-4 text-lg text-muted-foreground">{description}</p>
  </header>
}

export function DirectoryGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}
