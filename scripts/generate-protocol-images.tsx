/**
 * Draws one image per catalog protocol, from scratch, in three formats:
 *   public/protocols/images/<slug>.svg   — the source
 *   public/protocols/images/<slug>.png   — share image (OG/Twitter) + sitemap
 *   public/protocols/images/<slug>.webp  — what the pages show
 *
 * 1200×630. Each one carries the protocol's pillar colours, a contour field
 * seeded by its slug (so no two look alike), an icon for what it is, its
 * name and tagline, and its habits with their times.
 *
 * Re-run after adding or renaming protocols:
 *   pnpm exec tsx --tsconfig tsconfig.json scripts/generate-protocol-images.tsx
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { createElement, type ComponentType } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import sharp from "sharp"
import * as Icons from "lucide-react"

import { CATALOG_PROTOCOLS, type CatalogProtocol } from "@/lib/habits/protocols/catalog"
import { PILLAR_HEX, PILLAR_LABELS, type PillarId } from "@/lib/habits/pillars"
import { PROTOCOL_IMAGE_SIZE } from "@/lib/habits/protocols/images"

const { width: W, height: H } = PROTOCOL_IMAGE_SIZE
const OUT = path.join(process.cwd(), "public", "protocols", "images")

/** What each protocol is about, as a lucide icon name (PascalCase). Falls back to the pillar's icon. */
const ICON_BY_SLUG: Record<string, string> = {
  "deep-work-blocks": "Target",
  "pomodoro-method": "Timer",
  "shutdown-ritual": "Power",
  "time-blocking": "CalendarClock",
  "single-email-block": "Mail",
  "two-minute-rule": "Hourglass",
  "weekly-review": "ClipboardList",
  "digital-minimalism-reset": "Smartphone",
  "attention-principles-reading": "BookOpen",
  "morning-sunlight-exposure": "Sunrise",
  "fixed-wake-time": "AlarmClock",
  "evening-light-dimming": "Lamp",
  "cool-bedroom": "Thermometer",
  "warm-bath-effect": "Bath",
  "caffeine-cutoff": "Coffee",
  "delayed-first-coffee": "Coffee",
  "no-alcohol-before-bed": "WineOff",
  "sleep-opportunity-window": "BedDouble",
  "sleep-principles-reading": "Moon",
  "time-restricted-eating": "Clock8",
  "protein-first-breakfast": "Egg",
  "foundational-supplement-stack": "Pill",
  "blueprint-style-stack": "FlaskConical",
  "hydration-on-waking": "GlassWater",
  "post-meal-walking": "Footprints",
  "cruciferous-sulforaphane": "Salad",
  "no-food-before-bed": "UtensilsCrossed",
  "daily-mindfulness-meditation": "Flower2",
  "nsdr-yoga-nidra": "Waves",
  "physiological-sigh": "Wind",
  "wim-hof-breathing": "Wind",
  "deliberate-cold-exposure": "Snowflake",
  "daily-stoic-reading": "Landmark",
  "identity-habit-reading": "Fingerprint",
  "gratitude-journaling": "NotebookPen",
  "premeditatio-malorum": "ShieldAlert",
  "grease-the-groove": "Dumbbell",
  "daily-walking-baseline": "Footprints",
  "resistance-training-basics": "Dumbbell",
  "zone-2-cardio": "HeartPulse",
  "vo2max-intervals": "Activity",
  rucking: "Backpack",
  "daily-hangs": "Hand",
  "kettlebell-swing-simple": "Weight",
  "strength-mindset-reading": "BookOpen",
  "pay-yourself-first": "PiggyBank",
  "weekly-money-review": "Receipt",
  "automate-investing": "TrendingUp",
  "72-hour-purchase-rule": "ShoppingCart",
  "subscription-audit": "CreditCard",
  "no-spend-days": "Ban",
  "emergency-fund-ladder": "ShieldCheck",
  "spending-awareness-log": "NotebookPen",
}

const PILLAR_FALLBACK_ICON: Record<PillarId, string> = {
  work: "Brain",
  sleep: "Moon",
  nutrition: "Leaf",
  mind: "Sparkles",
  exercise: "Dumbbell",
  finance: "Wallet",
}

/** Brand dot colours, the same six as the logo. */
const LOGO_DOTS = ["#8B5CF6", "#06B6D4", "#10B981", "#EC4899", "#F59E0B", "#EAB308"]

// ---------------------------------------------------------------- helpers

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** Deterministic PRNG per slug, so re-running produces the same image. */
function rng(seed: string): () => number {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Rough Inter advance widths (em) — good enough to wrap lines without a font engine. */
function textWidth(text: string, size: number, bold = false): number {
  let em = 0
  for (const ch of text) {
    if (" .,:;'!|il".includes(ch)) em += 0.28
    else if ("fjrt()-".includes(ch)) em += 0.36
    else if ("mwMW".includes(ch)) em += 0.86
    else if (ch >= "A" && ch <= "Z") em += 0.66
    else if (ch >= "0" && ch <= "9") em += 0.58
    else em += 0.55
  }
  return em * size * (bold ? 1.04 : 1)
}

function wrap(text: string, size: number, maxWidth: number, maxLines: number, bold = false): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (textWidth(next, size, bold) <= maxWidth || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    let last = kept[maxLines - 1]
    while (textWidth(`${last}…`, size, bold) > maxWidth && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "))
    kept[maxLines - 1] = `${last.replace(/[.,;:—-]+$/, "")}…`
    return kept
  }
  return lines
}

/** A lucide icon's inner markup (paths etc.), for a 24×24 box. */
function iconInner(name: string): string {
  const Icon = (Icons as unknown as Record<string, ComponentType<Record<string, unknown>>>)[name]
  if (!Icon) throw new Error(`Unknown lucide icon ${name}`)
  const markup = renderToStaticMarkup(createElement(Icon, { size: 24, strokeWidth: 1.6 }))
  return markup.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")
}

/** Closed wavy rings around a centre: the topographic look of the brand patterns. */
function contourField(random: () => number, cx: number, cy: number, color: string): string {
  const rings: string[] = []
  const lobes = 3 + Math.floor(random() * 3)
  const phase = random() * Math.PI * 2
  const wobble = 0.08 + random() * 0.08
  for (let i = 0; i < 16; i++) {
    const r = 70 + i * 34
    const pts: string[] = []
    for (let k = 0; k <= 72; k++) {
      const a = (k / 72) * Math.PI * 2
      const rr = r * (1 + wobble * Math.sin(lobes * a + phase + i * 0.35) + 0.04 * Math.sin(7 * a + i))
      pts.push(`${(cx + rr * Math.cos(a) * 1.25).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`)
    }
    const opacity = (0.32 - i * 0.017).toFixed(3)
    rings.push(`<polygon points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="1.4"/>`)
  }
  return rings.join("")
}

function scheduleLabel(protocol: CatalogProtocol, i: number): string {
  const h = protocol.habits[i]
  const s = h.schedule
  const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const days = [...(s.days ?? [])].sort((a, b) => a - b)
  const when =
    s.type === "daily" || days.length === 7
      ? "daily"
      : s.type === "times_per_week"
        ? `${s.timesPerWeek}×/week`
        : days.join() === "1,2,3,4,5"
          ? "weekdays"
          : days.length <= 3
            ? days.map((d) => DAY[d]).join(", ")
            : `${days.length} days/week`
  return `${h.time} · ${when}`
}

// ---------------------------------------------------------------- the picture

export function protocolSvg(protocol: CatalogProtocol): string {
  const random = rng(protocol.slug)
  const color = PILLAR_HEX[protocol.pillar]
  const icon = iconInner(ICON_BY_SLUG[protocol.slug] ?? PILLAR_FALLBACK_ICON[protocol.pillar])
  const art = { cx: 930, cy: 300 }

  const title = wrap(protocol.name, 64, 600, 2, true)
  const titleSize = title.length > 1 || textWidth(protocol.name, 64, true) > 560 ? 58 : 64
  const tagline = wrap(protocol.tagline, 27, 590, 3)

  let y = 222
  const titleSvg = title
    .map((line, i) => `<text x="72" y="${y + i * (titleSize + 8)}" font-size="${titleSize}" font-weight="700" fill="#ffffff">${esc(line)}</text>`)
    .join("")
  y += title.length * (titleSize + 8) + 16
  const taglineSvg = tagline
    .map((line, i) => `<text x="72" y="${y + i * 38}" font-size="27" fill="#c9c6dd">${esc(line)}</text>`)
    .join("")
  y += tagline.length * 38 + 26

  // As many habit rows as fit above the footer line, up to three.
  const rowsThatFit = Math.max(0, Math.floor((H - 78 - y + 25) / 44))
  const habits = protocol.habits.slice(0, Math.min(3, rowsThatFit))
  const habitRows = habits
    .map((h, i) => {
      const rowY = y + i * 44
      const name = wrap(h.name, 21, 330, 1)[0]
      return (
        `<rect x="72" y="${rowY - 25}" width="560" height="36" rx="10" fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.08"/>` +
        `<circle cx="92" cy="${rowY - 7}" r="5" fill="${color}"/>` +
        `<text x="108" y="${rowY}" font-size="21" fill="#e9e7f5">${esc(name)}</text>` +
        `<text x="620" y="${rowY}" font-size="19" fill="#a7a3c2" text-anchor="end" font-family="'Geist Mono','DejaVu Sans Mono',monospace">${esc(scheduleLabel(protocol, i))}</text>`
      )
    })
    .join("")

  const orbit = LOGO_DOTS.map((dot, i) => {
    const a = (i / LOGO_DOTS.length) * Math.PI * 2 + random() * 0.4
    const r = 205 + random() * 20
    return `<circle cx="${(art.cx + r * Math.cos(a)).toFixed(1)}" cy="${(art.cy + r * Math.sin(a)).toFixed(1)}" r="${(7 + random() * 5).toFixed(1)}" fill="${dot}" filter="url(#soft)"/>`
  }).join("")

  const logo = [
    [0, 0], [16, 0], [24, 13], [16, 26], [0, 26], [-8, 13],
  ]
    .map(([dx, dy], i) => `<circle cx="${80 + dx}" cy="${68 + dy}" r="5.5" fill="${LOGO_DOTS[i]}"/>`)
    .join("")

  const pillarLabel = `${PILLAR_LABELS[protocol.pillar].toUpperCase()} PROTOCOL`
  const meta = [protocol.difficulty, protocol.duration].filter(Boolean).join(" · ")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" role="img" aria-labelledby="t d">
<title id="t">${esc(protocol.name)} — ${esc(PILLAR_LABELS[protocol.pillar])} protocol</title>
<desc id="d">${esc(protocol.tagline)}</desc>
<defs>
  <radialGradient id="glow" cx="${art.cx}" cy="${art.cy}" r="520" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${color}" stop-opacity="0.34"/>
    <stop offset="0.55" stop-color="${color}" stop-opacity="0.08"/>
    <stop offset="1" stop-color="${color}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#07071a"/>
    <stop offset="1" stop-color="#160d33"/>
  </linearGradient>
  <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1d1840"/>
    <stop offset="1" stop-color="#0f0c24"/>
  </linearGradient>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
  <filter id="halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#glow)"/>
${contourField(random, art.cx, art.cy, color)}
<circle cx="${art.cx}" cy="${art.cy}" r="120" fill="${color}" fill-opacity="0.35" filter="url(#halo)"/>
<rect x="${art.cx - 112}" y="${art.cy - 112}" width="224" height="224" rx="48" fill="url(#tile)" stroke="${color}" stroke-opacity="0.55" stroke-width="2"/>
<g transform="translate(${art.cx - 72} ${art.cy - 72}) scale(6)" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
${orbit}
${logo}
<text x="122" y="90" font-size="26" font-weight="700" fill="#ffffff">Liberture</text>
<rect x="72" y="118" width="${Math.ceil(textWidth(pillarLabel, 15, true) + pillarLabel.length * 1.2 + 52)}" height="32" rx="16" fill="${color}" fill-opacity="0.14" stroke="${color}" stroke-opacity="0.5"/>
<circle cx="90" cy="134" r="5" fill="${color}"/>
<text x="102" y="139.5" font-size="15" font-weight="700" letter-spacing="1.2" fill="${color}">${esc(pillarLabel)}</text>
${titleSvg}
${taglineSvg}
${habitRows}
<text x="72" y="${H - 34}" font-size="18" fill="#8d89aa">liberture.com/protocols${meta ? `  ·  ${esc(meta)}` : ""}</text>
</svg>
`
}

async function main() {
  await mkdir(OUT, { recursive: true })
  let bytes = 0
  for (const protocol of CATALOG_PROTOCOLS) {
    const svg = protocolSvg(protocol)
    const base = path.join(OUT, protocol.slug)
    await writeFile(`${base}.svg`, svg)
    // 72 dpi = one SVG unit per pixel: exactly 1200×630.
    const raster = sharp(Buffer.from(svg), { density: 72 })
    const png = await raster.clone().png({ compressionLevel: 9, palette: true, quality: 92, effort: 8 }).toBuffer()
    const webp = await raster.clone().webp({ quality: 84 }).toBuffer()
    await writeFile(`${base}.png`, png)
    await writeFile(`${base}.webp`, webp)
    bytes += png.length + webp.length + Buffer.byteLength(svg)
  }
  console.log(`${CATALOG_PROTOCOLS.length} protocols → ${OUT} (${(bytes / 1024 / 1024).toFixed(1)} MB)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
