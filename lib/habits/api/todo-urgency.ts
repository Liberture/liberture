import type { Todo } from "@/lib/habits/types"

export type TodoUrgency = "done" | "overdue" | "today" | "tomorrow" | "this_week" | "later" | "no_date"

/** Days from `from` to `to`, both "YYYY-MM-DD", ignoring clocks and zones. */
function dayDiff(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number)
  const [ty, tm, td] = to.split("-").map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000)
}

/**
 * How soon a todo needs doing, against the user's own today ("YYYY-MM-DD" in
 * their zone, from userToday). A finished todo is `done`, never overdue.
 */
export function todoUrgency(todo: Pick<Todo, "dueDate" | "status">, today: string): TodoUrgency {
  if (todo.status === "completed") return "done"
  if (!todo.dueDate || !/^\d{4}-\d{2}-\d{2}/.test(todo.dueDate)) return "no_date"
  const days = dayDiff(today, todo.dueDate.slice(0, 10))
  if (days < 0) return "overdue"
  if (days === 0) return "today"
  if (days === 1) return "tomorrow"
  if (days < 7) return "this_week"
  return "later"
}
