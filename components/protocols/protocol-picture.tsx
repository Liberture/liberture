import { protocolImage } from "@/lib/habits/protocols/images"
import { cn } from "@/lib/utils"

/**
 * A protocol's generated picture (public/protocols/images): WebP with a PNG
 * fallback, real alt text and intrinsic size so it's indexable and doesn't
 * shift the layout. Renders nothing for protocols without one.
 */
export function ProtocolPicture({
  slug,
  className,
  loading = "lazy",
}: {
  slug: string
  className?: string
  loading?: "lazy" | "eager"
}) {
  const image = protocolImage(slug)
  if (!image) return null
  return (
    <picture className={cn("block overflow-hidden", className)}>
      <source srcSet={image.webp} type="image/webp" />
      <img src={image.png} alt={image.alt} width={image.width} height={image.height} loading={loading} decoding="async" className="block h-auto w-full" />
    </picture>
  )
}
