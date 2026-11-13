"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "@/components/i18n/locale-provider"

declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void
      render(node: HTMLElement, options: Record<string, unknown>): number
      reset(id: number): void
    }
  }
}

export function NewsletterSignup({ siteKey }: { siteKey: string }) {
  const t = useTranslations().habits.app.newsletter
  const section = useRef<HTMLElement>(null)
  const container = useRef<HTMLDivElement>(null)
  const widget = useRef<number | undefined>(undefined)
  const [visible, setVisible] = useState(false)
  const [token, setToken] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error" | "limited">("idle")
  useEffect(() => {
    if (!section.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    })
    observer.observe(section.current)
    return () => observer.disconnect()
  }, [])
  return <section ref={section} aria-labelledby="newsletter-title" className="relative border-t border-border py-10 px-4">
    <div className="mx-auto max-w-md">
      <h2 id="newsletter-title" className="text-xl font-semibold">{t.title}</h2>
      <p className="my-2 text-sm text-muted-foreground">{t.description}</p>
      {status === "success" ? <p role="status">{t.success}</p> : <form className="space-y-3" onSubmit={async event => {
        event.preventDefault()
        if (!token || status === "sending") return
        const email = new FormData(event.currentTarget).get("email")
        setStatus("sending")
        try {
          const res = await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token }) })
          setStatus(res.ok ? "success" : res.status === 429 ? "limited" : "error")
        } catch { setStatus("error") }
        setToken("")
        if (widget.current !== undefined) window.grecaptcha?.reset(widget.current)
      }}>
        <div className="flex gap-2">
          <Input name="email" aria-label={t.email} placeholder={t.email} type="email" autoComplete="email" required maxLength={254} />
          <Button disabled={!token || status === "sending"}>{t.subscribe}</Button>
        </div>
        <div ref={container} />
        {visible && siteKey && <Script src="https://www.google.com/recaptcha/api.js?render=explicit" onError={() => setStatus("error")} onReady={() => {
          window.grecaptcha?.ready(() => {
            if (container.current && widget.current === undefined) widget.current = window.grecaptcha!.render(container.current, {
              sitekey: siteKey, theme: "dark", callback: setToken, "expired-callback": () => setToken(""),
              "error-callback": () => { setToken(""); setStatus("error") },
            })
          })
        }} />}
        {(!siteKey || status === "error" || status === "limited") && <p role="status">{status === "limited" ? t.limited : t.error}</p>}
      </form>}
    </div>
  </section>
}
