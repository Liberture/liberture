import Image from "next/image"

import { isMobileShot, screenshotSize, screenshotSrc } from "@/lib/guides"
import type { Locale } from "@/lib/habits/i18n"
import { cn } from "@/lib/utils"

/** A screenshot of the populated app, for the docs pages. */
export function DocsScreenshot({ locale, imageKey, alt }: { locale: Locale; imageKey: string; alt: string }) {
  const size = screenshotSize(imageKey)
  const mobile = isMobileShot(imageKey)
  return (
    <figure className={cn("my-6", mobile && "mx-auto max-w-[280px]")}>
      <div className={cn("overflow-hidden border border-white/10 bg-background shadow-xl shadow-black/40", mobile ? "rounded-[1.6rem] border-4 border-white/15" : "rounded-xl")}>
        <Image src={screenshotSrc(locale, imageKey)} alt={alt} width={size.width} height={size.height} sizes={mobile ? "280px" : "(min-width: 1024px) 760px, 100vw"} className="h-auto w-full" />
      </div>
      <figcaption className="sr-only">{alt}</figcaption>
    </figure>
  )
}
