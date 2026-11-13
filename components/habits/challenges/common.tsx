"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useHabitsSession } from "@/components/habits/session-provider"
import { Input } from "@/components/ui/input"

export function useChallengeClient() {
  const { ownerRequest, isChecking } = useHabitsSession()
  const t = useTranslations("challenges")
  const request = useCallback(
    async <T,>(path: string, method = "GET", body?: unknown): Promise<T> => {
      const response = await ownerRequest("/api/challenges" + path, {
        method,
        cache: "no-store",
        ...(body === undefined
          ? {}
          : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
      })
      if (!response.ok && response.status === 409) {
        const reason = (await response.json().catch(()=>({}))).error
        if (reason === "moderatorNotRegistered" || reason === "existingModeratorKey") throw new Error(t(reason))
      }
      if (!response.ok)
        throw new Error(
          t(
            response.status === 403 || response.status === 401
              ? "unauthorized"
              : response.status === 409
                ? "conflict"
                : response.status === 404
                  ? "missing"
                  : "requestFailed",
          ),
        )
      return response.json()
    },
    [ownerRequest, t],
  )
  return { request, isChecking }
}

export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const lock = useRef(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  async function run(action: () => Promise<void>) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError("")
    try {
      await action()
    } catch (failure) {
      if (alive.current) setError(failure instanceof Error ? failure.message : String(failure))
    } finally {
      lock.current = false
      if (alive.current) setBusy(false)
    }
  }
  return { busy, error, run }
}

export const panel = "space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6"

export function Field({ label, ...props }: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium">
      {label}
      <Input {...props} />
    </label>
  )
}

export function initialWallet(scope: string) {
  const storageKey = "challenge-wallet-context:" + scope
  let id = sessionStorage.getItem(storageKey)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(storageKey, id)
  }
  return id
}

export function rememberWallet(pubkey: string, ownerId: string) {
  localStorage.setItem("challenge-wallet-for:" + pubkey, ownerId)
}

export function inviteLink(token: string) {
  return new URL("/challenges/join#" + encodeURIComponent(token), location.origin).href
}
