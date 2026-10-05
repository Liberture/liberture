"use client"

import { Suspense, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { KeyRound } from "lucide-react"

import { useTranslations } from "@/components/i18n/locale-provider"
import { useHabitsSession } from "@/components/habits/session-provider"

function safeRedirect(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/tracker"
}

function LoginContent() {
  const params = useSearchParams()
  const next = safeRedirect(params.get("redirect") ?? params.get("next"))
  const { isChecking, isSignedIn, openSignIn } = useHabitsSession()
  const t = useTranslations().habits.app.login

  useEffect(() => {
    if (!isChecking && !isSignedIn) openSignIn({ next })
  }, [isChecking, isSignedIn, openSignIn, next])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <KeyRound className="h-6 w-6 text-primary" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-foreground">{t.title}</h1>
      {isSignedIn ? (
        <>
          <p className="mt-2 text-muted-foreground">{t.signedIn}</p>
          <Link
            href={next}
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t.continue}
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 text-muted-foreground">{t.body}</p>
          <button
            type="button"
            onClick={() => openSignIn({ next })}
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t.button}
          </button>
        </>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
