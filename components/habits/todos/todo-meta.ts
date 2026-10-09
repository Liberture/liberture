import type { Todo } from "@/lib/habits/types"
import type { useTranslations } from "@/components/i18n/locale-provider"

type TodoListCopy = ReturnType<typeof useTranslations>["habits"]["app"]["todoList"]

export const PRIORITIES: Todo["priority"][] = [1, 2, 3, 4, 5]

/** Same named scale the list badges and the edit dialog pills use. */
export function priorityLabel(priority: Todo["priority"], t: TodoListCopy) {
  switch (priority) {
    case 1:
      return t.priorities.low
    case 2:
      return t.priorities.medLow
    case 3:
      return t.priorities.medium
    case 4:
      return t.priorities.high
    case 5:
      return t.priorities.critical
    default:
      return t.priorities.normal
  }
}

export function priorityColor(priority: Todo["priority"]) {
  switch (priority) {
    case 1:
    case 2:
      return "border-nutrition/30 bg-nutrition/10 text-nutrition"
    case 3:
    case 4:
      return "border-exercise/30 bg-exercise/10 text-exercise"
    case 5:
      return "border-destructive/30 bg-destructive/10 text-destructive"
    default:
      return "border-border bg-muted/20 text-muted-foreground"
  }
}

/** "a, b, ,a" → ["a", "b"] */
export function splitTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  )
}
