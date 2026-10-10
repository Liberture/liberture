/**
 * Links that open a new chat in ChatGPT or Claude with a message ready, used
 * after connecting so the first conversation starts with Liberture's welcome.
 * `chatgpt.com/?q=` and `claude.ai/new?q=` are widely used but not documented
 * APIs: if either stops pre-filling, the user simply lands on a new chat.
 */
export function chatgptStartUrl(prompt: string): string {
  return `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`
}

export function claudeStartUrl(prompt: string): string {
  return `https://claude.ai/new?q=${encodeURIComponent(prompt)}`
}
