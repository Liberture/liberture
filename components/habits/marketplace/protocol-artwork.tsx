import { cn } from "@/lib/utils"

export function ProtocolArtwork({ slug, className, loading }: {
  slug: string
  className?: string
  loading?: "lazy" | "eager"
}) {
  return <CoverArtwork src={`/protocols/images/readers/${slug}.webp`} height={320} className={className} loading={loading} />
}

export function CoverArtwork({ src, height, className, loading }: { src: string; height: number; className?: string; loading?: "lazy" | "eager" }) {
  return (
    <img src={src} alt="" width={1200} height={height}
      loading={loading} decoding="async" className={cn("block h-auto w-full", className)} />
  )
}
