"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { MicroterrainRidge, VortexShell } from "@/components/habits/patterns"
import { screenshotSize, screenshotSrc } from "@/lib/guides"
import type { Dictionary, Locale } from "@/lib/habits/i18n"

/** Screenshots of a populated tracker: desktop today + stats, phone in front. */
export function AppPreview({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.preview
  const reduceMotion = useReducedMotion()
  const reveal = (delay = 0) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.6, delay } }
  const today = screenshotSize("tracker-today")
  const stats = screenshotSize("statistics")
  const phone = screenshotSize("mobile-today")

  return (
    <section className="relative overflow-hidden px-4 py-16">
      <VortexShell placement="corner" gradient="neon" size="440px" className="-left-24 top-0" opacity={0.15} />
      <MicroterrainRidge placement="corner" gradient="plasma" size="460px" className="-right-24 bottom-0" opacity={0.14} />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <span className="text-sm font-medium uppercase tracking-wider text-primary">{t.eyebrow}</span>
          <h2 className="mt-2 text-balance text-3xl font-bold text-foreground md:text-4xl">{t.heading}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">{t.body}</p>
        </div>

        {/* Phones get the phone screenshot alone; the desktop composition starts at sm. */}
        <div className="relative mx-auto max-w-5xl sm:pb-16">
          <motion.figure className="relative hidden overflow-hidden rounded-xl border border-white/15 bg-background shadow-2xl shadow-black/50 sm:block" {...reveal()}>
            <Image src={screenshotSrc(locale, "tracker-today")} alt={t.today} width={today.width} height={today.height} sizes="(min-width: 1024px) 1000px, 100vw" className="h-auto w-full" />
          </motion.figure>
          <motion.figure
            className="absolute -bottom-2 left-[3%] hidden w-[38%] overflow-hidden rounded-xl border border-white/15 bg-background shadow-2xl shadow-black/60 sm:block"
            {...reveal(0.15)}
          >
            <Image src={screenshotSrc(locale, "statistics")} alt={t.stats} width={stats.width} height={stats.height} sizes="400px" className="h-auto w-full" />
          </motion.figure>
          <motion.figure
            className="relative mx-auto w-[64%] max-w-[260px] overflow-hidden rounded-[1.6rem] border-4 border-white/20 bg-background shadow-2xl shadow-black/60 sm:absolute sm:-bottom-4 sm:right-[3%] sm:mx-0 sm:w-[20%] sm:max-w-[220px]"
            {...reveal(0.25)}
          >
            <Image src={screenshotSrc(locale, "mobile-today")} alt={t.mobile} width={phone.width} height={phone.height} sizes="(min-width: 640px) 220px, 260px" className="h-auto w-full" />
          </motion.figure>
        </div>

        <p className="mt-6 text-center">
          <Link href="/guides" className="group inline-flex items-center gap-1.5 font-medium text-primary">
            {t.guides}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </p>
      </div>
    </section>
  )
}
