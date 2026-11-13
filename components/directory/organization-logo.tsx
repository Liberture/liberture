import Image from "next/image"
import { cn } from "@/lib/utils"

export function OrganizationLogo({ src, name, className }: { src: string | null; name: string; className?: string }) {
  if (!src || !(/^(?:https?:\/\/|\/(?!\/))/.test(src))) return null
  return <Image src={src} alt={name} width={160} height={80} unoptimized
    className={cn("h-16 w-auto max-w-full object-contain object-left", className)} />
}
