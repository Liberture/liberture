import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

/** A completion toggle shared by the habit matrix and challenge day grid. */
export function CompletionCell({ completed, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { completed: boolean }) {
  return <button type="button" aria-pressed={completed}
    className={cn("shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-35", className)} {...props} />
}
