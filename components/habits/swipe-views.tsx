"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Continuous horizontal paging between top-level views.
 *
 * All views live on one track translated by `-index * 100%`. During a drag the
 * track follows the finger, so the neighbouring screen genuinely slides in
 * alongside the current one. On release it animates to the nearest page.
 *
 * Modelled on the mobile shell in /root/obelisk-dex, which gets three things
 * right that a naive implementation does not:
 *
 *  1. The swipe host declares NO touch-action. `pan-y` there tells the browser
 *     horizontal panning is not allowed and kills the gesture outright; only
 *     genuinely horizontal scrollers get `pan-x pan-y`, never a bare `pan-x`.
 *  2. The drag mutates `style.transform` through a ref. Driving it from React
 *     state re-renders the whole subtree on every touchmove, which is what
 *     makes a drag feel heavy.
 *  3. Interactive and self-scrolling targets are excluded up front with one
 *     `closest()` call, instead of walking ancestors reading computed style.
 *
 * Only the panel content moves — header and bottom bar sit outside and stay put.
 * Neighbours mount only while a drag or its settle animation is in flight, so at
 * rest exactly one view is mounted.
 */

const AXIS_THRESHOLD = 8 // px of travel before the axis is decided
const AXIS_BIAS = 1.2 // horizontal must beat vertical by this factor
const DISTANCE_DIVISOR = 3 // commit past a third of the viewport
const VELOCITY = 0.4 // px/ms — a flick commits even when short
const SETTLE_MS = 260
const TRANSITION = "transform 260ms cubic-bezier(0.2, 0.85, 0.25, 1)"

/** Targets that own their own gestures and must never seed a page drag. */
const IGNORE_SELECTOR = [
  "[data-no-swipe]",
  "input",
  "textarea",
  "select",
  '[contenteditable="true"]',
  ".lb-scroll-x",
  ".horizontal-touch-scroll",
].join(", ")

function shouldIgnoreTarget(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false
  return Boolean(target.closest(IGNORE_SELECTOR))
}

interface SwipeViewsProps<T extends string> {
  views: readonly T[]
  active: T
  onChange: (next: T) => void
  renderView: (view: T) => ReactNode
  className?: string
  panelClassName?: string
}

interface DragInfo {
  startX: number
  startY: number
  lastX: number
  lastTime: number
  velocity: number
  dx: number
  width: number
  ignored: boolean
  axis: "undecided" | "horizontal" | "vertical"
}

export function SwipeViews<T extends string>({
  views,
  active,
  onChange,
  renderView,
  className,
  panelClassName,
}: SwipeViewsProps<T>) {
  const [dragging, setDragging] = useState(false)
  const [settling, setSettling] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const settleTimer = useRef<NodeJS.Timeout | null>(null)
  const drag = useRef<DragInfo | null>(null)

  const index = views.indexOf(active)
  const previousIndex = useRef(index)

  const baseTransform = useCallback((i: number) => `translate3d(${-i * 100}%, 0, 0)`, [])

  // Keep neighbours mounted through the settle animation, otherwise the screen
  // being slid away from unmounts mid-flight and the motion looks broken.
  useEffect(() => {
    setSettling(true)
    if (settleTimer.current) clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      setSettling(false)
      previousIndex.current = index
    }, SETTLE_MS)
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current)
    }
  }, [active, index])

  // The track's resting position is applied imperatively because the drag
  // writes to the same property directly.
  useEffect(() => {
    const track = trackRef.current
    if (!track || drag.current?.axis === "horizontal") return
    track.style.transition = TRANSITION
    track.style.transform = baseTransform(index)
  }, [index, baseTransform])

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length !== 1) {
      drag.current = null
      return
    }
    const touch = event.touches[0]
    drag.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      lastX: touch.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      dx: 0,
      width: containerRef.current?.clientWidth ?? window.innerWidth,
      ignored: shouldIgnoreTarget(event.target),
      axis: "undecided",
    }
  }, [])

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      const state = drag.current
      if (!state || state.ignored || state.axis === "vertical") return

      const touch = event.touches[0]
      const dx = touch.clientX - state.startX
      const dy = touch.clientY - state.startY
      const now = event.timeStamp

      state.velocity = (touch.clientX - state.lastX) / Math.max(1, now - state.lastTime)
      state.lastX = touch.clientX
      state.lastTime = now
      state.dx = dx

      if (state.axis === "undecided") {
        if (Math.abs(dx) < AXIS_THRESHOLD && Math.abs(dy) < AXIS_THRESHOLD) return
        // Bias towards vertical: scrolling is the common gesture, and an
        // ambiguous drag should not steal it.
        if (Math.abs(dx) > Math.abs(dy) * AXIS_BIAS) {
          state.axis = "horizontal"
          setDragging(true)
        } else {
          state.axis = "vertical"
          return
        }
      }

      // Rubber-band at the ends — there is no page to reveal there.
      const atEdge = (dx > 0 && index === 0) || (dx < 0 && index === views.length - 1)
      const shown = atEdge ? dx * 0.3 : dx

      const track = trackRef.current
      if (track) {
        track.style.transition = "none"
        track.style.transform = `translate3d(calc(${-index * 100}% + ${shown}px), 0, 0)`
      }
    },
    [index, views.length]
  )

  const endGesture = useCallback(() => {
    const state = drag.current
    drag.current = null

    if (!state || state.axis !== "horizontal") {
      setDragging(false)
      return
    }

    const { dx, velocity, width } = state
    const commit =
      Math.abs(dx) > width / DISTANCE_DIVISOR ||
      (Math.abs(velocity) > VELOCITY && Math.sign(velocity) === Math.sign(dx))

    const next = commit ? (dx < 0 ? index + 1 : index - 1) : index
    const target = next >= 0 && next < views.length ? next : index

    const track = trackRef.current
    if (track) {
      track.style.transition = TRANSITION
      track.style.transform = baseTransform(target)
    }

    setDragging(false)

    if (target !== index) {
      onChange(views[target])
    } else {
      // No page change, so the `active` effect won't fire — run the settle
      // window here so neighbours stay mounted while the track springs back.
      setSettling(true)
      if (settleTimer.current) clearTimeout(settleTimer.current)
      settleTimer.current = setTimeout(() => setSettling(false), SETTLE_MS)
    }
  }, [baseTransform, index, onChange, views])

  const neighboursMounted = dragging || settling
  const travelLow = Math.min(index, previousIndex.current)
  const travelHigh = Math.max(index, previousIndex.current)

  // Views stay mounted once visited. Unmounting on every switch meant coming
  // back rebuilt the whole tree from scratch — measured at 1.4-2.6s of blocked
  // main thread per switch, and 42s for a dozen rapid Stats<->Habits round
  // trips. Offscreen panels cost nothing to paint thanks to content-visibility
  // below, so the only price is holding their React state, which is the point.
  const everMounted = useRef<Set<number>>(new Set([index]))
  for (let i = 0; i < views.length; i++) {
    const adjacent = Math.abs(i - index) === 1
    const enRoute = i >= travelLow && i <= travelHigh
    if (i === index || (neighboursMounted && (adjacent || enRoute))) {
      everMounted.current.add(i)
    }
  }

  // Rendered element per panel, refreshed only for the panel you are actually
  // looking at.
  //
  // renderView is an inline closure over the parent's state, so calling it for
  // every mounted panel on every render rebuilt all five element trees on each
  // switch — new elements mean React re-renders those subtrees, which is where
  // the ~1s stalls came from. Off-screen panels keep their previous element, so
  // React bails out of re-rendering them entirely; each becomes current again
  // the moment it is the active view.
  const rendered = useRef<Map<number, ReactNode>>(new Map())
  rendered.current.set(index, renderView(views[index]))
  for (const i of everMounted.current) {
    if (!rendered.current.has(i)) rendered.current.set(i, renderView(views[i]))
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={endGesture}
      onTouchCancel={endGesture}
      // Deliberately no touch-action here: restricting it to pan-y stops the
      // browser delivering the horizontal gesture and the swipe dies.
      className={cn("relative overflow-hidden", className)}
    >
      <div
        ref={trackRef}
        className="flex h-full w-full"
        style={{ transform: baseTransform(index), transition: TRANSITION }}
      >
        {views.map((view, i) => {
          const mounted = everMounted.current.has(i)
          return (
            <div
              key={view}
              aria-hidden={i !== index}
              className={cn(
                "custom-scrollbar lb-scroll h-full w-full shrink-0 overflow-y-auto",
                // Offscreen panels are skipped by the renderer, so keeping them
                // mounted costs layout and paint nothing.
                i !== index && "lb-panel-idle",
                panelClassName
              )}
            >
              {mounted ? rendered.current.get(i) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
