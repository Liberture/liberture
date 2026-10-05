import type { ReactNode } from "react"

/** Building blocks shared by the /docs pages. Server components. */

export function DocsTitle({ title, lead }: { title: string; lead: string }) {
  return (
    <header className="mb-10">
      <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">{lead}</p>
    </header>
  )
}

export function DocsSection({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <h2 className="mb-4 text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

export function DocsSteps({ steps, extras }: { steps: { title: string; body: string }[]; extras?: Record<number, ReactNode> }) {
  return (
    <ol className="space-y-6">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <p className="font-semibold text-foreground">{step.title}</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">{step.body}</p>
            {extras?.[i]}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function DocsCallout({ title, children, tone = "info" }: { title: string; children: ReactNode; tone?: "info" | "warning" }) {
  return (
    <aside
      className={
        tone === "warning"
          ? "my-6 rounded-xl border border-exercise/30 bg-exercise/10 p-4"
          : "my-6 rounded-xl border border-primary/25 bg-primary/10 p-4"
      }
    >
      <p className={tone === "warning" ? "font-semibold text-exercise" : "font-semibold text-primary"}>{title}</p>
      <div className="mt-1 text-sm leading-relaxed text-foreground/90">{children}</div>
    </aside>
  )
}

export function DocsList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-muted-foreground">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}
