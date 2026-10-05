/**
 * What a visitor asked for before signing in, carried across the sign-in in
 * sessionStorage: "connect" = take me to connecting Claude/ChatGPT.
 */
export const POST_LOGIN_INTENT = "habit-tracker-post-login-intent"

/** Reads and clears the intent. */
export function takePostLoginIntent(): string | null {
  try {
    const value = sessionStorage.getItem(POST_LOGIN_INTENT)
    if (value) sessionStorage.removeItem(POST_LOGIN_INTENT)
    return value
  } catch {
    return null
  }
}
