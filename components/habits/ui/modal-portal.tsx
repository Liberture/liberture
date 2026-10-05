"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

/**
 * Renders an overlay at the top of the document, outside the app's shell.
 *
 * Necessary because a modal rendered inside a view panel is not a viewport
 * overlay at all. Two ancestors in this app establish a containing block for
 * `position: fixed`: the SwipeViews track carries a `translate3d`, and
 * `.lb-scroll` sets `contain: paint`. Inside either, `fixed inset-0` resolves
 * against that ancestor's box rather than the screen — on the view track, which
 * is one full width per view, that meant the overlay spilled far past the
 * viewport.
 *
 * Scroll locking has the same root cause. `.lb-scroll` is what actually
 * scrolls, so setting `overflow: hidden` on `<body>` locked nothing and the
 * page kept moving behind the modal. We lock every scrollable ancestor
 * container as well, and restore exactly what was there before.
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return

    const restore: Array<() => void> = []

    const lock = (el: HTMLElement) => {
      const previous = el.style.overflow
      el.style.overflow = "hidden"
      restore.push(() => {
        el.style.overflow = previous
      })
    }

    lock(document.body)
    lock(document.documentElement)
    // The scroll panels the shell actually uses. Locking these is what stops
    // the content sliding behind the overlay.
    document.querySelectorAll<HTMLElement>(".lb-scroll").forEach(lock)

    return () => {
      for (const undo of restore) undo()
    }
  }, [mounted])

  // Portals need a DOM node, which doesn't exist during the server render.
  if (!mounted) return null

  return createPortal(children, document.body)
}
