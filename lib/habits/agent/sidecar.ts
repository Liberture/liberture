import http from "node:http"
import type { IncomingMessage } from "node:http"

/**
 * Client for the coach sidecar (see `agent/README.md`).
 *
 * Talks over a unix socket rather than a port. The tracker runs in a container
 * and the codex CLI runs on the host, so something has to cross that boundary;
 * a bind-mounted socket does it without opening a port on a shared box.
 *
 * Uses `node:http` directly because it is the only client that takes a
 * `socketPath` without pulling in a dependency, and because SSE needs the raw
 * incoming message to stream rather than a buffered response.
 */

export class SidecarError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "SidecarError"
    this.status = status
    this.code = code
  }
}

/** Unconfigured is a normal state — the chat is optional and hides itself. */
export function sidecarConfigured(): boolean {
  return Boolean(process.env.HABIT_AGENT_SOCKET && process.env.HABIT_AGENT_SECRET)
}

export function instanceId(): string {
  return process.env.HABIT_INSTANCE_ID || "default"
}

function config() {
  const socketPath = process.env.HABIT_AGENT_SOCKET
  const secret = process.env.HABIT_AGENT_SECRET
  if (!socketPath || !secret) {
    throw new SidecarError("the coach is not configured on this instance", 503)
  }
  return { socketPath, secret }
}

interface RequestOptions {
  method: "GET" | "POST" | "DELETE"
  path: string
  userKey?: string
  body?: unknown
  /** Streaming responses must not be buffered. */
  stream?: boolean
}

/**
 * How long to wait for the sidecar to start answering. Every non-streaming
 * route answers in milliseconds; the only slow one is a first turn that ships
 * the catalog. Without a limit, a wedged sidecar held the chat request — and
 * the user's spinner — open indefinitely.
 */
const RESPONSE_TIMEOUT_MS = 30_000

/** Socket errors, in terms an operator can act on. */
function describeSocketError(err: NodeJS.ErrnoException, socketPath: string): { message: string; status: number } {
  switch (err.code) {
    case "ENOENT":
    case "ECONNREFUSED":
      return { message: "the coach is not running right now", status: 503 }
    case "EACCES":
    case "EPERM":
      return { message: `the app is not allowed to open the coach socket at ${socketPath}`, status: 503 }
    case "ECONNRESET":
    case "EPIPE":
      return { message: "the coach dropped the connection", status: 502 }
    case "ETIMEDOUT":
      return { message: "the coach did not answer in time", status: 504 }
    default:
      return { message: err.message, status: 502 }
  }
}

function request(options: RequestOptions): Promise<IncomingMessage> {
  const { socketPath, secret } = config()
  const payload = options.body === undefined ? undefined : JSON.stringify(options.body)

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        socketPath,
        path: options.path,
        method: options.method,
        headers: {
          "X-Agent-Secret": secret,
          ...(options.userKey ? { "X-User-Key": options.userKey } : {}),
          ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        // Streams legitimately sit quiet between pings; the limit only covers
        // getting a response at all.
        req.setTimeout(0)
        resolve(res)
      }
    )
    req.setTimeout(RESPONSE_TIMEOUT_MS, () => {
      req.destroy(Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }))
    })
    req.on("error", (err: NodeJS.ErrnoException) => {
      // A missing or refused socket is an operational state the UI should
      // explain, not a 500.
      const { message, status } = describeSocketError(err, socketPath)
      reject(new SidecarError(message, status, err.code))
    })
    if (payload) req.write(payload)
    req.end()
  })
}

async function readJson(res: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of res) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    throw new SidecarError("the coach returned a malformed response", 502)
  }
}

function errorFrom(res: IncomingMessage, body: unknown): SidecarError {
  const record = (body ?? {}) as { error?: string; code?: string }
  const message = typeof record.error === "string" ? record.error : "the coach could not handle that"
  return new SidecarError(message, res.statusCode ?? 502, typeof record.code === "string" ? record.code : message)
}

export interface StartRunInput {
  userKey: string
  conversationId?: string
  prompt: string
  catalogVersion: string
  brief: { habitsMarkdown: string; completionsCsv: string }
  catalog?: { indexMarkdown: string; protocols: { slug: string; markdown: string }[] }
}

export interface StartRunResult {
  runId: string
  conversationId: string
  resumed: boolean
}

/**
 * Start a turn.
 *
 * The sidecar caches the catalog per conversation and answers 409 when it needs
 * a copy, so `buildCatalog` is a thunk — on the overwhelming majority of turns
 * it is never called and the ~200KB export is never built or sent.
 */
export async function startRun(
  input: StartRunInput,
  buildCatalog: () => StartRunInput["catalog"]
): Promise<StartRunResult> {
  const base = {
    instanceId: instanceId(),
    userKey: input.userKey,
    conversationId: input.conversationId,
    prompt: input.prompt,
    catalogVersion: input.catalogVersion,
    brief: input.brief,
  }

  let res = await request({ method: "POST", path: "/runs", body: base })
  if (res.statusCode === 409) {
    const body = (await readJson(res)) as { error?: string; conversationId?: string }
    if (body.error !== "catalog_required") throw errorFrom(res, body)
    // Reuse the id it minted, or the retry would strand the directory it just
    // created and start a second conversation.
    res = await request({
      method: "POST",
      path: "/runs",
      body: { ...base, conversationId: base.conversationId ?? body.conversationId, catalog: buildCatalog() },
    })
  }

  const body = await readJson(res)
  if (res.statusCode !== 200) throw errorFrom(res, body)
  return body as StartRunResult
}

/** The raw SSE response, to be piped straight through to the browser. */
export async function streamRun(runId: string, userKey: string): Promise<IncomingMessage> {
  const res = await request({ method: "GET", path: `/runs/${runId}/stream`, userKey, stream: true })
  if (res.statusCode !== 200) throw errorFrom(res, await readJson(res))
  return res
}

export async function killRun(runId: string, userKey: string): Promise<void> {
  const res = await request({ method: "POST", path: `/runs/${runId}/kill`, userKey })
  const body = await readJson(res)
  if (res.statusCode !== 200) throw errorFrom(res, body)
}

export interface SidecarHealth {
  ok: boolean
  sandboxOk: boolean
  codexVersion: string | null
  /** Absent on a sidecar older than this field. False until an admin connects it. */
  codexLoggedIn?: boolean
  /** Absent on a sidecar older than this field; treat that as fine. */
  codexAuthOk?: boolean
  /** Operator-facing fix. Not forwarded to users. */
  problem?: string | null
  activeRuns: number
}

export async function health(): Promise<SidecarHealth> {
  const res = await request({ method: "GET", path: "/health" })
  const body = await readJson(res)
  if (res.statusCode !== 200) throw errorFrom(res, body)
  return body as SidecarHealth
}

// ── The coach's codex login (admin only; see app/api/agent/codex) ─────────

export interface DeviceAuthStatus {
  active: boolean
  done?: boolean
  ok?: boolean | null
  /** Where to sign in, and the one-time code to enter there. */
  url?: string | null
  code?: string | null
  startedAt?: number
  expiresAt?: number
  /** Why it failed, when it did. */
  output?: string | null
}

export interface CodexAccountStatus {
  loggedIn: boolean
  mode: "chatgpt" | "apikey" | "none" | string
  email?: string | null
  plan?: string | null
  lastRefresh?: string | null
  /** Set when runs have been failing for auth reasons since the last login. */
  authProblem?: string | null
  device: DeviceAuthStatus
}

async function call<T>(method: RequestOptions["method"], path: string): Promise<T> {
  const res = await request({ method, path })
  const body = await readJson(res)
  if (res.statusCode !== 200) throw errorFrom(res, body)
  return body as T
}

export const codexAccount = (): Promise<CodexAccountStatus> => call("GET", "/codex/account")
export const startDeviceAuth = (): Promise<DeviceAuthStatus> => call("POST", "/codex/device-auth")
export const deviceAuthStatus = (): Promise<DeviceAuthStatus> => call("GET", "/codex/device-auth")
export const cancelDeviceAuth = (): Promise<{ ok: boolean }> => call("DELETE", "/codex/device-auth")
export const logoutCodex = (): Promise<CodexAccountStatus> => call("POST", "/codex/logout")
