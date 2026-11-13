import { ExternalLink } from "lucide-react"
import type { Source } from "@/lib/habits/protocols/sources"

export function SourceLink({ source }: { source: Pick<Source, "title" | "url"> }) {
  let url: URL
  try {
    url = new URL(source.url ?? "")
  } catch {
    return <span>{source.title}</span>
  }
  if (!["https:", "http:"].includes(url.protocol)) {
    return <span>{source.title}</span>
  }
  return <a href={url.href} target="_blank" rel="noopener noreferrer"
    className="inline-flex items-baseline gap-1 text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
    {source.title}<ExternalLink aria-hidden className="size-3 shrink-0" />
  </a>
}
