"use client"

import { ArrowUpRight, MessageCircle, X } from "lucide-react"

import { ChatGPTLogo, ClaudeLogo } from "@/components/habits/brand-logos"
import { useTranslations } from "@/components/i18n/locale-provider"
import { chatgptStartUrl, claudeStartUrl } from "@/lib/habits/assistant-links"
import { cn } from "@/lib/utils"

type Kind = "chatgpt" | "claude"

/**
 * "Start in ChatGPT / Claude": opens a new chat with a message that asks the
 * assistant to run Liberture's welcome (present itself, ask questions, offer
 * protocols). The connected assistant's button comes first and is filled.
 */
export function AssistantStartButtons({ connected = [], className }: { connected?: Kind[]; className?: string }) {
  const t = useTranslations().habits.app.assistantStart
  const order: Kind[] = connected.includes("claude") && !connected.includes("chatgpt") ? ["claude", "chatgpt"] : ["chatgpt", "claude"]
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      {order.map((kind) => {
        const primary = connected.includes(kind)
        const Logo = kind === "chatgpt" ? ChatGPTLogo : ClaudeLogo
        return (
          <a
            key={kind}
            href={kind === "chatgpt" ? chatgptStartUrl(t.prompt) : claudeStartUrl(t.prompt)}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              primary
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border bg-card text-foreground hover:bg-muted"
            )}
          >
            <Logo className="h-4 w-4" />
            {kind === "chatgpt" ? t.openChatgpt : t.openClaude}
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </a>
        )
      })}
    </div>
  )
}

/**
 * Shown in the tracker when setup was handed to an assistant (the account was
 * connected before the tracker was first opened, so the wizard was skipped).
 */
export function AssistantStartCard({ connected, onDismiss }: { connected: Kind[]; onDismiss: () => void }) {
  const t = useTranslations().habits.app.assistantStart
  return (
    <section className="relative rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5" aria-labelledby="assistant-start-title">
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t.dismiss}
        className="absolute right-2 top-2 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <MessageCircle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 id="assistant-start-title" className="font-semibold text-foreground">
            {t.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
        </div>
      </div>
      <AssistantStartButtons connected={connected} className="mt-4" />
    </section>
  )
}
