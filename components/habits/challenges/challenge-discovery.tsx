import Link from "@/components/i18n/localized-link"
import { ArrowRight } from "lucide-react"
import type { HabitsDictionary } from "@/lib/translations"
import { ChallengeStepArt } from "./cashew-match"

type DiscoveryCopy = HabitsDictionary["challengeDiscovery"]

/** Shared public introduction; the full version is rendered by the server page. */
export function ChallengeDiscovery({ copy, full = false }: { copy: DiscoveryCopy; full?: boolean }) {
  const Heading = full ? "h1" : "h2"
  return <section id="challenges" className="relative scroll-mt-20 px-4 py-16">
    <div className="mx-auto max-w-6xl">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">{copy.eyebrow}</p>
        <Heading className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</Heading>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">{copy.intro}</p>
      </header>
      {full && <h2 className="mt-12 text-center text-2xl font-semibold">{copy.stepsHeading}</h2>}
      <ol className="mt-8 grid gap-5 md:grid-cols-3">
        {copy.steps.map((step, index) => <li key={step.title} className="rounded-2xl border border-border/60 bg-card/90 p-5 shadow-lg shadow-black/10">
          <ChallengeStepArt step={(["invite", "play", "finish"] as const)[index]} />
          <h3 className="mt-4 text-lg font-semibold"><span className="mr-2 text-primary" aria-hidden>{index + 1}.</span>{step.title}</h3>
          {full && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>}
        </li>)}
      </ol>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={full ? "/tracker/challenges/new" : "/challenges"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {full ? copy.create : copy.learnMore}<ArrowRight className="size-4" aria-hidden />
        </Link>
        {full && <Link href="/tracker/challenges" className="inline-flex min-h-11 items-center justify-center rounded-lg border bg-card px-6 py-3 font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">{copy.browse}</Link>}
      </div>
    </div>
  </section>
}
