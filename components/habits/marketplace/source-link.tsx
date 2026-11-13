import { ExternalLink } from "lucide-react"
import type { Source } from "@/lib/habits/protocols/sources"

export function SourceLink({ source }: { source: Pick<Source, "title" | "url"> }) {
  if (!source.url || !URL.canParse(source.url) || !["https:", "http:"].includes(new URL(source.url).protocol)) {
    return <span>{source.title}</span>
  }
  return <a href={source.url} target="_blank" rel="noopener noreferrer"
    className="inline-flex items-baseline gap-1 text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
    {source.title}<ExternalLink aria-hidden className="size-3 shrink-0" />
  </a>
}
