/**
 * What a user's own assistant (ChatGPT action, Claude connector, any client
 * holding their hti_ token) may do through /api/v1 and /api/mcp.
 *
 * Stored server-side next to the token as `data.integrationPermissions`, never
 * through the browser's blob save: a stale tab must not be able to revert it,
 * and the token itself must not be able to widen its own access. Missing keys
 * mean the default: on, except for the scopes in DEFAULT_OFF, which can't be
 * undone and so wait for the user to switch them on.
 */

export const API_SCOPES = [
  "read",
  "log_completions",
  "todos",
  "calendar",
  "add_habits",
  "edit_habits",
  "delete_habits",
  "delete_items",
  "settings",
  "export",
] as const

export type ApiScope = (typeof API_SCOPES)[number]

export type ApiPermissions = Partial<Record<ApiScope, boolean>>

/** Destructive scopes the user has to turn on themselves. */
export const DEFAULT_OFF: ReadonlySet<ApiScope> = new Set<ApiScope>(["delete_habits", "delete_items"])

export function isApiScope(value: unknown): value is ApiScope {
  return typeof value === "string" && (API_SCOPES as readonly string[]).includes(value)
}

/** Every scope resolved to a boolean, missing keys taking their default. */
export function effectivePermissions(stored: unknown): Record<ApiScope, boolean> {
  const source = stored && typeof stored === "object" && !Array.isArray(stored) ? (stored as Record<string, unknown>) : {}
  const result = {} as Record<ApiScope, boolean>
  for (const scope of API_SCOPES) {
    result[scope] = typeof source[scope] === "boolean" ? (source[scope] as boolean) : !DEFAULT_OFF.has(scope)
  }
  return result
}

export function hasScope(stored: unknown, scope: ApiScope): boolean {
  return effectivePermissions(stored)[scope]
}

/** Keeps only known scopes with boolean values. Returns null if nothing valid. */
export function sanitizePermissions(input: unknown): ApiPermissions | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  const result: ApiPermissions = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (isApiScope(key) && typeof value === "boolean") result[key] = value
  }
  return result
}

/**
 * Text for a denied request, written for the assistant to relay to the user.
 */
export function scopeDeniedMessage(scope: ApiScope): string {
  switch (scope) {
    case "read":
      return "The user has turned off read access for assistants. Tell them they can turn it back on in Liberture → Settings → Voice assistants."
    case "log_completions":
      return "The user has turned off logging habit completions for assistants. Ask them to mark it in the app, or to enable \"Log completions\" in Settings → Voice assistants."
    case "todos":
      return "The user has turned off todo and project changes for assistants. They can enable \"Todos and projects\" in Settings → Voice assistants."
    case "calendar":
      return "The user has turned off calendar changes for assistants. They can enable \"Calendar\" in Settings → Voice assistants."
    case "add_habits":
      return "The user has not allowed assistants to add habits. Share the infoUrl link instead so they can read it and add it themselves, or ask them to enable \"Add habits\" in Settings → Voice assistants."
    case "edit_habits":
      return "The user has turned off editing habits for assistants. They can rename or change it in the app, or enable \"Edit habits\" in Settings → Voice assistants."
    case "delete_habits":
      return "Deleting habits is off unless the user enables it. Suggest archiving it in the app instead, or ask them to turn on \"Delete habits\" in Settings → Voice assistants."
    case "delete_items":
      return "Deleting todos, projects and calendar events is off unless the user enables it. Offer to mark the todo done or move the event instead, or ask them to turn on \"Delete todos, projects and events\" in Settings → Voice assistants."
    case "settings":
      return "The user has turned off changing their profile and preferences for assistants. They can change it in Settings, or enable \"Profile and preferences\" in Settings → Voice assistants."
    case "export":
      return "The user has turned off full data export for assistants. They can enable \"Export\" in Settings → Voice assistants."
  }
}
