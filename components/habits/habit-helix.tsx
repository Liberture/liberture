"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { differenceInCalendarDays, format, isSameDay, startOfDay, subDays } from "date-fns"
import { Orbit, Pause, Play, RotateCcw } from "lucide-react"

import type { Habit, HabitCompletion } from "@/lib/habits/types"
import { calculateSuccessCounts, type WeekStart } from "@/lib/habits/habit-utils"
import {
  PILLAR_HEX,
  PILLAR_ICON_MAP,
  PILLAR_IDS,
  pillarForHabit,
  type PillarId,
} from "@/lib/habits/pillars"
import { cn } from "@/lib/utils"
import { useDateLocale, useTranslations } from "@/components/i18n/locale-provider"
import { formatMessage, plural } from "@/lib/i18n-format"

/**
 * Pillar tower — a radar chart of the six pillars, drawn once per time bucket
 * and stacked along a vertical time axis.
 *
 * Read it as: one horizontal slice = one date. Within that slice, each pillar
 * sits at its own fixed compass bearing, and its distance from the core is its
 * completion rate (core = 0%, outer guide ring = 100%). Stack the slices oldest
 * at the bottom to today at the top and the surface becomes the evolution.
 *
 * The pillars deliberately do NOT twist around the axis. An earlier version
 * spiralled — it looked better and read worse, because a strand that changes
 * bearing as it climbs can't be followed, and height no longer maps cleanly to
 * a date. TURN_COUNT below is kept as the one knob if that trade is ever worth
 * revisiting.
 *
 * Rendered with a hand-rolled 3D projection onto a 2D canvas rather than a WebGL
 * library: the app already lazy-loads recharts to keep the initial parse cheap,
 * and ~1k painter-sorted quads per frame don't justify shipping Three.js.
 */

type RangeKey = "90d" | "180d" | "1y"

/** Labels live in translations (`habitHelix.ranges`), keyed by `key`. */
const RANGES: Array<{ key: RangeKey; days: number }> = [
  { key: "90d", days: 90 },
  { key: "180d", days: 180 },
  { key: "1y", days: 365 },
]

/** Slices actually drawn. Long ranges bucket days so frame cost stays flat. */
const MAX_RINGS = 150

/** Turns of the tower across the range. 0 keeps every pillar on a fixed bearing. */
const TURN_COUNT = 0

/** Radius at 0% completion — not quite zero, so a dead pillar is still visible. */
const CORE_RADIUS = 0.16
/** Radius at 100%. The outer guide ring is drawn here. */
const MAX_RADIUS = 1

const AXIS_HEIGHT = 1.95

interface HabitHelixProps {
  habits: Habit[]
  completions: HabitCompletion[]
  /**
   * The Stats period. When given the tower spans exactly it (future days are
   * clipped to today) and the helix's own 90d/180d/1y picker is hidden.
   */
  range?: { start: Date; end: Date }
  /** First day of the week, for times-per-week targets. */
  weekStartsOn?: WeekStart
}

interface Ring {
  /** 0 → oldest bucket, 1 → today. */
  t: number
  date: Date
  label: string
  /** Completion rate per pillar, 0-1; null when nothing was scheduled. */
  rates: Array<number | null>
  overall: number
  /** Days covered, so the tooltip can say "week of…" on bucketed ranges. */
  span: number
}

interface Projected {
  x: number
  y: number
  depth: number
  scale: number
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "")
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

const PILLAR_RGB: Record<PillarId, [number, number, number]> = Object.fromEntries(
  PILLAR_IDS.map((pillar) => [pillar, hexToRgb(PILLAR_HEX[pillar])])
) as Record<PillarId, [number, number, number]>

function rgba(pillar: PillarId, alpha: number): string {
  const [r, g, b] = PILLAR_RGB[pillar]
  return `rgba(${r},${g},${b},${alpha})`
}

/** Bearing of a pillar, in radians. Fixed, so a pillar is always in one place. */
function bearing(pillarIndex: number): number {
  return (pillarIndex / PILLAR_IDS.length) * Math.PI * 2
}

export function HabitHelix({ habits, completions, range: externalRange, weekStartsOn = 1 }: HabitHelixProps) {
  const t = useTranslations().habits.app.habitHelix
  const dateLocale = useDateLocale()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const [range, setRange] = useState<RangeKey>("180d")
  const [spinning, setSpinning] = useState(true)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  // Camera lives in a ref: it changes every frame and must never trigger React.
  const cameraRef = useRef({ yaw: 0.6, pitch: 0.36, zoom: 1 })
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const spinningRef = useRef(spinning)
  spinningRef.current = spinning
  const hoverRef = useRef<number | null>(null)
  hoverRef.current = hoverIndex
  /** Screen position of each slice's centre, refreshed every frame for hit-testing. */
  const ringScreenRef = useRef<Array<{ x: number; y: number }>>([])
  /**
   * Pillar labels are DOM nodes rather than canvas text so they can carry the
   * real Lucide icon each pillar uses elsewhere. The draw loop moves them via
   * `transform`, so they follow the camera without a React render per frame.
   */
  const labelRefs = useRef<Array<HTMLDivElement | null>>([])

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits])

  const pillarOf = useMemo(() => {
    const map = new Map<string, PillarId>()
    for (const habit of activeHabits) map.set(habit.id, pillarForHabit(habit))
    return map
  }, [activeHabits])

  // Bucketed per habit, so each ring's shared-rate call only scans its own habit.
  const completionsByHabit = useMemo(() => {
    const map = new Map<string, HabitCompletion[]>()
    for (const c of completions) {
      if (!c.completed) continue
      const list = map.get(c.habitId)
      if (list) list.push(c)
      else map.set(c.habitId, [c])
    }
    return map
  }, [completions])

  const todayKey = format(new Date(), "yyyy-MM-dd")
  const { anchorDay, dayCount } = useMemo(() => {
    const today = startOfDay(new Date())
    if (!externalRange) {
      return { anchorDay: today, dayCount: RANGES.find((r) => r.key === range)?.days ?? 180 }
    }
    const end = startOfDay(externalRange.end) > today ? today : startOfDay(externalRange.end)
    const days = differenceInCalendarDays(end, startOfDay(externalRange.start)) + 1
    return { anchorDay: end, dayCount: Math.max(1, days) }
    // todayKey re-anchors after midnight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalRange?.start.getTime(), externalRange?.end.getTime(), range, todayKey])

  const rings = useMemo<Ring[]>(() => {
    if (activeHabits.length === 0) return []

    const today = anchorDay
    const bucketSize = Math.max(1, Math.ceil(dayCount / MAX_RINGS))
    const ringCount = Math.ceil(dayCount / bucketSize)
    const result: Ring[] = []

    for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
      const scheduled = PILLAR_IDS.map(() => 0)
      const done = PILLAR_IDS.map(() => 0)
      let last = today
      let span = 0

      for (let offset = 0; offset < bucketSize; offset++) {
        const daysAgo = dayCount - 1 - (ringIndex * bucketSize + offset)
        if (daysAgo < 0) continue
        last = subDays(today, daysAgo)
        span++
      }

      // The shared counts: scheduled days, or the weekly target for
      // times-per-week habits, so rest days don't thin a ring.
      if (span > 0) {
        for (const habit of activeHabits) {
          const counts = calculateSuccessCounts(habit, completionsByHabit.get(habit.id) ?? [], span, last, weekStartsOn)
          const index = PILLAR_IDS.indexOf(pillarOf.get(habit.id) ?? "work")
          scheduled[index] += counts.expected
          done[index] += counts.done
        }
      }

      const totalScheduled = scheduled.reduce((a, b) => a + b, 0)
      const totalDone = done.reduce((a, b) => a + b, 0)

      result.push({
        t: ringCount === 1 ? 1 : ringIndex / (ringCount - 1),
        date: last,
        label: format(last, "d MMM yyyy", { locale: dateLocale }),
        rates: scheduled.map((count, i) => (count === 0 ? null : done[i] / count)),
        overall: totalScheduled === 0 ? 0 : totalDone / totalScheduled,
        span,
      })
    }

    return result
  }, [activeHabits, completionsByHabit, pillarOf, dayCount, anchorDay, dateLocale, weekStartsOn])

  const summary = useMemo(() => {
    if (rings.length === 0) return null
    const perPillar = PILLAR_IDS.map((pillar, index) => {
      const values = rings.map((r) => r.rates[index]).filter((v): v is number => v !== null)
      const avg = values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length
      return { pillar, avg, tracked: values.length > 0 }
    })
    const best = perPillar.filter((p) => p.tracked).slice().sort((a, b) => b.avg - a.avg)[0]

    // Momentum: last fifth of the range against the first fifth.
    const slice = Math.max(1, Math.floor(rings.length / 5))
    const mean = (list: Ring[]) => list.reduce((a, r) => a + r.overall, 0) / (list.length || 1)

    return {
      perPillar,
      best,
      overall: mean(rings),
      momentum: mean(rings.slice(-slice)) - mean(rings.slice(0, slice)),
      bucketDays: rings[0]?.span ?? 1,
    }
  }, [rings])

  const resetCamera = useCallback(() => {
    cameraRef.current = { yaw: 0.6, pitch: 0.36, zoom: 1 }
  }, [])

  // ── Rendering ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    let width = 0
    let height = 0
    let frame = 0

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      width = wrap.clientWidth
      height = wrap.clientHeight
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(wrap)
    resize()

    // React attaches wheel handlers passively at the root, so preventDefault
    // there is a no-op and zooming would scroll the page underneath.
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const camera = cameraRef.current
      camera.zoom = Math.max(0.55, Math.min(2.4, camera.zoom * (event.deltaY > 0 ? 0.93 : 1.07)))
    }
    canvas.addEventListener("wheel", onWheel, { passive: false })

    let unit = 0

    /** Rotate around Y, tilt around X, then perspective-divide. */
    const project = (x: number, y: number, z: number): Projected => {
      const { yaw, pitch, zoom } = cameraRef.current
      const cosY = Math.cos(yaw)
      const sinY = Math.sin(yaw)
      const rx = x * cosY - z * sinY
      const rz = x * sinY + z * cosY

      const cosP = Math.cos(pitch)
      const sinP = Math.sin(pitch)
      const ry = y * cosP - rz * sinP
      const depth = y * sinP + rz * cosP

      const perspective = 3.6 / (3.6 + depth)
      const scale = perspective * unit * zoom
      return { x: width / 2 + rx * scale, y: height / 2 - ry * scale, depth, scale: perspective * zoom }
    }

    const radiusFor = (rate: number) => CORE_RADIUS + (MAX_RADIUS - CORE_RADIUS) * rate
    const angleAt = (pillarIndex: number, t: number) =>
      bearing(pillarIndex) + t * TURN_COUNT * Math.PI * 2

    /** A horizontal guide circle at height y and the given radius. */
    const strokeCircle = (y: number, radius: number, style: string, dash: number[] = []) => {
      ctx.strokeStyle = style
      ctx.lineWidth = 1
      ctx.setLineDash(dash)
      ctx.beginPath()
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2
        const p = project(Math.cos(a) * radius, y, Math.sin(a) * radius)
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    interface Quad {
      depth: number
      points: Projected[]
      pillar: PillarId
      rate: number
    }

    const draw = (time: number) => {
      frame = requestAnimationFrame(draw)

      if (spinningRef.current && !dragRef.current && !reduceMotion) {
        cameraRef.current.yaw += 0.0032
      }

      ctx.clearRect(0, 0, width, height)
      if (rings.length === 0) return

      unit = Math.min(width, height) * 0.4
      const bottom = -AXIS_HEIGHT / 2
      const top = AXIS_HEIGHT / 2
      const hovered = hoverRef.current

      // Radius scale, so "far from the core" has a calibrated meaning.
      strokeCircle(bottom, MAX_RADIUS, "rgba(255,255,255,0.16)")
      strokeCircle(bottom, radiusFor(0.5), "rgba(255,255,255,0.07)", [3, 5])
      strokeCircle(bottom, CORE_RADIUS, "rgba(255,255,255,0.07)")
      strokeCircle(top, MAX_RADIUS, "rgba(255,255,255,0.1)")

      // Time axis with a tick wherever the month changes.
      const axisBottom = project(0, bottom, 0)
      const axisTop = project(0, top, 0)
      ctx.strokeStyle = "rgba(255,255,255,0.12)"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(axisBottom.x, axisBottom.y)
      ctx.lineTo(axisTop.x, axisTop.y)
      ctx.stroke()

      ctx.font = "10px ui-monospace, monospace"
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      const screens: Array<{ x: number; y: number }> = []

      for (let i = 0; i < rings.length; i++) {
        const ring = rings[i]
        const y = bottom + ring.t * AXIS_HEIGHT
        const centre = project(0, y, 0)
        screens[i] = { x: centre.x, y: centre.y }

        const isNewMonth = i === 0 || ring.date.getMonth() !== rings[i - 1].date.getMonth()
        if (!isNewMonth) continue

        ctx.strokeStyle = "rgba(255,255,255,0.14)"
        ctx.beginPath()
        ctx.moveTo(centre.x - 6, centre.y)
        ctx.lineTo(centre.x + 6, centre.y)
        ctx.stroke()
        ctx.fillStyle = "rgba(255,255,255,0.42)"
        ctx.fillText(format(ring.date, "MMM", { locale: dateLocale }), centre.x - 10, centre.y)
      }
      ringScreenRef.current = screens

      // Build every ribbon quad, then paint back-to-front (no z-buffer here).
      const quads: Quad[] = []
      for (let p = 0; p < PILLAR_IDS.length; p++) {
        const pillar = PILLAR_IDS[p]
        for (let i = 0; i < rings.length - 1; i++) {
          const a = rings[i]
          const b = rings[i + 1]
          const ya = bottom + a.t * AXIS_HEIGHT
          const yb = bottom + b.t * AXIS_HEIGHT
          const ra = radiusFor(a.rates[p] ?? 0)
          const rb = radiusFor(b.rates[p] ?? 0)
          const aa = angleAt(p, a.t)
          const ab = angleAt(p, b.t)

          const innerA = project(Math.cos(aa) * CORE_RADIUS, ya, Math.sin(aa) * CORE_RADIUS)
          const outerA = project(Math.cos(aa) * ra, ya, Math.sin(aa) * ra)
          const outerB = project(Math.cos(ab) * rb, yb, Math.sin(ab) * rb)
          const innerB = project(Math.cos(ab) * CORE_RADIUS, yb, Math.sin(ab) * CORE_RADIUS)

          quads.push({
            depth: (outerA.depth + outerB.depth) / 2,
            points: [innerA, outerA, outerB, innerB],
            pillar,
            rate: ((a.rates[p] ?? 0) + (b.rates[p] ?? 0)) / 2,
          })
        }
      }
      quads.sort((x, y2) => y2.depth - x.depth)

      // Additive blending: overlapping ribbons glow instead of muddying to grey.
      ctx.globalCompositeOperation = "lighter"
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      for (const quad of quads) {
        const near = Math.max(0, Math.min(1, 1 - (quad.depth + 1.2) / 2.6))
        const [innerA, outerA, outerB, innerB] = quad.points

        ctx.fillStyle = rgba(quad.pillar, 0.05 + near * 0.1 + quad.rate * 0.1)
        ctx.beginPath()
        ctx.moveTo(innerA.x, innerA.y)
        ctx.lineTo(outerA.x, outerA.y)
        ctx.lineTo(outerB.x, outerB.y)
        ctx.lineTo(innerB.x, innerB.y)
        ctx.closePath()
        ctx.fill()

        // The outer edge is the actual data line; keep it crisp on top of the fill.
        ctx.strokeStyle = rgba(quad.pillar, 0.2 + near * 0.5 + quad.rate * 0.25)
        ctx.lineWidth = Math.max(0.8, (1 + quad.rate * 1.6) * outerB.scale * 1.5)
        ctx.beginPath()
        ctx.moveTo(outerA.x, outerA.y)
        ctx.lineTo(outerB.x, outerB.y)
        ctx.stroke()
      }

      // Today's slice: a bright radar outline capping the tower.
      const drawSlice = (index: number, alpha: number, dots: boolean) => {
        const ring = rings[index]
        const y = bottom + ring.t * AXIS_HEIGHT
        ctx.lineWidth = 1.5
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`
        ctx.beginPath()
        for (let p = 0; p <= PILLAR_IDS.length; p++) {
          const pi = p % PILLAR_IDS.length
          const a = angleAt(pi, ring.t)
          const r = radiusFor(ring.rates[pi] ?? 0)
          const point = project(Math.cos(a) * r, y, Math.sin(a) * r)
          if (p === 0) ctx.moveTo(point.x, point.y)
          else ctx.lineTo(point.x, point.y)
        }
        ctx.stroke()

        if (!dots) return
        for (let p = 0; p < PILLAR_IDS.length; p++) {
          const a = angleAt(p, ring.t)
          const r = radiusFor(ring.rates[p] ?? 0)
          const point = project(Math.cos(a) * r, y, Math.sin(a) * r)
          ctx.fillStyle = rgba(PILLAR_IDS[p], 0.95)
          ctx.beginPath()
          ctx.arc(point.x, point.y, Math.max(2, 3.2 * point.scale), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const pulse = reduceMotion ? 0.5 : 0.4 + Math.sin(time / 500) * 0.15
      drawSlice(rings.length - 1, pulse, true)
      if (hovered !== null && hovered !== rings.length - 1 && rings[hovered]) {
        drawSlice(hovered, 0.75, true)
      }

      ctx.globalCompositeOperation = "source-over"

      // Pillar names float at the top of their own ribbon, so the tower is
      // self-labelling and you don't have to bounce to the legend. Labels behind
      // the tower fade so the front ones stay readable.
      for (let p = 0; p < PILLAR_IDS.length; p++) {
        const element = labelRefs.current[p]
        if (!element) continue
        const a = angleAt(p, 1)
        const point = project(Math.cos(a) * (MAX_RADIUS + 0.24), top, Math.sin(a) * (MAX_RADIUS + 0.24))
        element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`
        const near = Math.max(0, Math.min(1, 1 - (point.depth + 1.2) / 2.6))
        element.style.opacity = String(0.35 + near * 0.65)
      }
    }

    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      canvas.removeEventListener("wheel", onWheel)
    }
  }, [rings, dateLocale])

  // ── Pointer control ──────────────────────────────────────────────────────
  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (drag) {
      const camera = cameraRef.current
      camera.yaw += (event.clientX - drag.x) * 0.008
      // Clamped so the tower never flips inside out.
      camera.pitch = Math.max(-0.7, Math.min(1.1, camera.pitch + (event.clientY - drag.y) * 0.005))
      dragRef.current = { x: event.clientX, y: event.clientY }
      return
    }

    // Hit-test against the slice centres cached by the last frame. State only
    // changes when the nearest slice changes, so this isn't a per-move render.
    const screens = ringScreenRef.current
    if (screens.length === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - rect.left
    const py = event.clientY - rect.top

    let bestIndex = -1
    let bestDistance = Infinity
    for (let i = 0; i < screens.length; i++) {
      const point = screens[i]
      if (!point) continue
      const distance = Math.abs(point.y - py) + Math.abs(point.x - px) * 0.15
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = i
      }
    }
    const next = bestDistance < 40 ? bestIndex : null
    if (next !== hoverRef.current) setHoverIndex(next)
  }

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
  }

  const hoveredRing = hoverIndex !== null ? rings[hoverIndex] : undefined
  const hoveredScreen = hoverIndex !== null ? ringScreenRef.current[hoverIndex] : undefined

  if (activeHabits.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
        <Orbit className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card/60 shadow-sm backdrop-blur-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Orbit className="h-4 w-4 text-primary" aria-hidden />
            <h3 className="font-semibold text-foreground">{t.title}</h3>
          </div>
          <p className="mt-1 max-w-xl text-xs text-muted-foreground">
            {t.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!externalRange && (
          <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
            {RANGES.map(({ key }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                aria-pressed={range === key}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                  range === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                {t.ranges[key]}
              </button>
            ))}
          </div>
          )}
          <button
            type="button"
            onClick={() => setSpinning((v) => !v)}
            aria-label={spinning ? t.pauseRotation : t.resumeRotation}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            {spinning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={resetCamera}
            aria-label={t.resetView}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* The encoding, stated outright — nobody should have to infer it. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b border-border/60 px-5 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-foreground">↕</span> {t.legendHeight}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-foreground">↔</span> {t.legendDistance}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-work to-finance" aria-hidden />
          {t.legendColour}
        </span>
        <span className="ml-auto hidden sm:inline">{t.legendControls}</span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_248px]">
        <div
          ref={wrapRef}
          data-no-swipe
          className="relative h-[440px] w-full touch-pan-y sm:h-[540px]"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 68%)",
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={() => setHoverIndex(null)}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          />

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {PILLAR_IDS.map((pillar, index) => {
              const Icon = PILLAR_ICON_MAP[pillar]
              return (
                <div
                  key={pillar}
                  ref={(element) => {
                    labelRefs.current[index] = element
                  }}
                  className="absolute left-0 top-0 flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold will-change-transform"
                  style={{ color: PILLAR_HEX[pillar] }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t.pillars[pillar]}
                </div>
              )
            })}
          </div>

          {hoveredRing && hoveredScreen && (
            <div
              className="pointer-events-none absolute z-10 w-44 -translate-y-1/2 rounded-lg border border-border bg-popover/95 p-2.5 shadow-xl backdrop-blur-sm"
              style={{
                left: Math.min(Math.max(hoveredScreen.x + 16, 8), (wrapRef.current?.clientWidth ?? 400) - 184),
                top: hoveredScreen.y,
              }}
            >
              <p className="text-xs font-semibold text-foreground">
                {hoveredRing.span > 1
                  ? formatMessage(plural(t.spanTo, hoveredRing.span), { date: hoveredRing.label })
                  : hoveredRing.label}
              </p>
              <p className="mb-1.5 text-[10px] text-muted-foreground">
                {formatMessage(t.percentOverall, { percent: Math.round(hoveredRing.overall * 100) })}
              </p>
              {PILLAR_IDS.map((pillar, index) => {
                const rate = hoveredRing.rates[index]
                return (
                  <div key={pillar} className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: PILLAR_HEX[pillar], opacity: rate === null ? 0.25 : 1 }}
                      aria-hidden
                    />
                    <span className={cn("flex-1 truncate", rate === null && "text-muted-foreground/50")}>
                      {t.pillars[pillar]}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {rate === null ? "—" : `${Math.round(rate * 100)}%`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <span className="pointer-events-none absolute bottom-3 left-4 text-[10px] uppercase tracking-widest text-muted-foreground/70">
            {isSameDay(anchorDay, new Date())
              ? formatMessage(t.rangeToToday, { date: rings[0]?.label ?? "" })
              : formatMessage(t.rangeSpan, { start: rings[0]?.label ?? "", end: rings[rings.length - 1]?.label ?? "" })}
          </span>
        </div>

        <aside className="space-y-3 border-t border-border p-4 lg:border-l lg:border-t-0">
          {summary && (
            <>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t.overall}</p>
                <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">
                  {Math.round(summary.overall * 100)}%
                </p>
                <p className={cn("text-xs font-medium", summary.momentum >= 0 ? "text-nutrition" : "text-mind")}>
                  {summary.momentum >= 0 ? "▲" : "▼"} {formatMessage(t.points, { points: Math.abs(Math.round(summary.momentum * 100)) })}
                  <span className="text-muted-foreground"> {t.vsStartOfRange}</span>
                </p>
              </div>

              <div className="space-y-1.5 border-t border-border/60 pt-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {t.averagePerPillar}
                </p>
                {summary.perPillar.map(({ pillar, avg, tracked }) => (
                  <div key={pillar} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PILLAR_HEX[pillar], opacity: tracked ? 1 : 0.25 }}
                      aria-hidden
                    />
                    <span className={cn("flex-1 truncate", tracked ? "text-foreground" : "text-muted-foreground/50")}>
                      {t.pillars[pillar]}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {tracked ? `${Math.round(avg * 100)}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>

              <p className="border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground">
                {summary.bucketDays > 1
                  ? formatMessage(t.sliceGroups, { count: summary.bucketDays })
                  : t.sliceSingle}{" "}
                {t.nothingScheduled}
              </p>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
