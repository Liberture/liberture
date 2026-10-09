"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
    const isSecure = window.location.protocol === "https:" || isLocalhost
    if (!isSecure) return

    let cancelled = false

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
        if (!cancelled && registration && typeof registration.update === "function") {
          registration.update().catch(() => undefined)
        }
      } catch (error) {
        console.warn("Service worker registration failed", error)
      }
    }

    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register, { once: true })
    }

    return () => {
      cancelled = true
      window.removeEventListener("load", register)
    }
  }, [])

  return null
}
