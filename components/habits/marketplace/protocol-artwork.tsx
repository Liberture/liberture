import { cn } from "@/lib/utils"

export function ProtocolArtwork({ slug, className, loading }: {
  slug: string
  className?: string
  loading?: "lazy" | "eager"
}) {
  return (
    <img src={`/protocols/images/readers/${slug}.webp`} alt="" width={1200} height={320}
      loading={loading} decoding="async" className={cn("block h-auto w-full", className)} />
  )
}
