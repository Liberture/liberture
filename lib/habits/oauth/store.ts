import crypto from "crypto"

import { getDb } from "@/lib/habits/db"
import { fetchClientMetadata, isMetadataClientId } from "./client-metadata"
import { randomToken, sha256Hex } from "./pkce"

/**
 * Connections: every way an assistant reaches one user's tracker, each with its
 * own revocable credential, so connecting Claude never breaks ChatGPT.
 *
 * - OAuth (Claude / ChatGPT connectors, the public GPT): the app signs the user
 *   in on our consent page and gets an access token plus a refresh token.
 *   Neither expires; Settings → Voice assistants → Disconnect revokes both.
 * - Skill downloads: a token baked into the Claude skill zip.
 *
 * Only SHA-256 hashes are stored. The older single hti_ token in the blob keeps
 * working alongside (lib/integration-auth.ts) for scripts.
 */

export const ACCESS_PREFIX = "hta_"
export const REFRESH_PREFIX = "htr_"
const CODE_TTL_MINUTES = 10

let ready: Promise<unknown> | null = null

export function ensureOAuthTables(): Promise<unknown> {
  ready ??= (async () => {
    const sql = getDb()
    await sql`
      CREATE TABLE IF NOT EXISTS habit_oauth_clients (
        client_id TEXT PRIMARY KEY,
        secret_hash TEXT,
        name TEXT NOT NULL,
        redirect_uris JSONB NOT NULL DEFAULT '[]'::jsonb,
        redirect_prefixes JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    await sql`
      CREATE TABLE IF NOT EXISTS habit_oauth_codes (
        code_hash TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        redirect_uri TEXT NOT NULL,
        code_challenge TEXT NOT NULL,
        scope TEXT,
        expires_at TIMESTAMPTZ NOT NULL
      )`
    await sql`
      CREATE TABLE IF NOT EXISTS habit_api_connections (
        id UUID PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        kind TEXT NOT NULL,
        client_id TEXT,
        access_hash TEXT NOT NULL UNIQUE,
        refresh_hash TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_used_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ
      )`
    await sql`CREATE INDEX IF NOT EXISTS idx_habit_api_connections_user ON habit_api_connections (user_id)`
    await sql`
      CREATE TABLE IF NOT EXISTS habit_site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`
  })().catch((error: unknown) => {
    ready = null
    throw error
  })
  return ready
}

// ---------------------------------------------------------------- clients

export interface OAuthClient {
  clientId: string
  name: string
  redirectUris: string[]
  redirectPrefixes: string[]
  confidential: boolean
  secretHash: string | null
}

function rowToClient(row: Record<string, unknown>): OAuthClient {
  return {
    clientId: row.client_id as string,
    name: row.name as string,
    redirectUris: (row.redirect_uris as string[]) ?? [],
    redirectPrefixes: (row.redirect_prefixes as string[]) ?? [],
    confidential: Boolean(row.secret_hash),
    secretHash: (row.secret_hash as string | null) ?? null,
  }
}

/** RFC 7591 dynamic registration: public client, PKCE only. */
export async function registerClient(name: string, redirectUris: string[]): Promise<OAuthClient> {
  await ensureOAuthTables()
  const clientId = `lh_${crypto.randomBytes(12).toString("hex")}`
  const rows = await getDb()`
    INSERT INTO habit_oauth_clients (client_id, name, redirect_uris)
    VALUES (${clientId}, ${name}, ${JSON.stringify(redirectUris)}::jsonb)
    RETURNING *`
  return rowToClient(rows[0])
}

/** A confidential client for a Custom GPT action, created by the site owner. */
export async function createStaticClient(
  name: string,
  redirectPrefixes: string[]
): Promise<{ client: OAuthClient; clientSecret: string }> {
  await ensureOAuthTables()
  const clientId = `lh_${crypto.randomBytes(12).toString("hex")}`
  const clientSecret = crypto.randomBytes(32).toString("hex")
  const rows = await getDb()`
    INSERT INTO habit_oauth_clients (client_id, secret_hash, name, redirect_prefixes)
    VALUES (${clientId}, ${sha256Hex(clientSecret)}, ${name}, ${JSON.stringify(redirectPrefixes)}::jsonb)
    RETURNING *`
  return { client: rowToClient(rows[0]), clientSecret }
}

export async function getClient(clientId: string): Promise<OAuthClient | null> {
  if (isMetadataClientId(clientId)) {
    // CIMD: the client_id is the URL of its own registration (ChatGPT does this).
    const doc = await fetchClientMetadata(clientId)
    return doc
      ? { clientId: doc.clientId, name: doc.name, redirectUris: doc.redirectUris, redirectPrefixes: [], confidential: false, secretHash: null }
      : null
  }
  await ensureOAuthTables()
  const rows = await getDb()`SELECT * FROM habit_oauth_clients WHERE client_id = ${clientId}`
  return rows.length ? rowToClient(rows[0]) : null
}

export function clientSecretMatches(client: OAuthClient, secret: string | null): boolean {
  if (!client.secretHash) return true
  if (!secret) return false
  const a = Buffer.from(sha256Hex(secret))
  const b = Buffer.from(client.secretHash)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// ---------------------------------------------------------------- codes

export async function createAuthCode(input: {
  clientId: string
  userId: number
  redirectUri: string
  codeChallenge: string
  scope: string | null
}): Promise<string> {
  await ensureOAuthTables()
  const code = crypto.randomBytes(32).toString("base64url")
  const sql = getDb()
  await sql`DELETE FROM habit_oauth_codes WHERE expires_at < NOW()`
  await sql`
    INSERT INTO habit_oauth_codes (code_hash, client_id, user_id, redirect_uri, code_challenge, scope, expires_at)
    VALUES (${sha256Hex(code)}, ${input.clientId}, ${input.userId}, ${input.redirectUri}, ${input.codeChallenge},
            ${input.scope}, NOW() + make_interval(mins => ${CODE_TTL_MINUTES}))`
  return code
}

/** Single use: the row is deleted as it is read. */
export async function consumeAuthCode(code: string): Promise<{
  clientId: string
  userId: number
  redirectUri: string
  codeChallenge: string
  scope: string | null
} | null> {
  await ensureOAuthTables()
  const rows = await getDb()`
    DELETE FROM habit_oauth_codes WHERE code_hash = ${sha256Hex(code)} AND expires_at > NOW()
    RETURNING client_id, user_id, redirect_uri, code_challenge, scope`
  if (!rows.length) return null
  const r = rows[0]
  return {
    clientId: r.client_id as string,
    userId: r.user_id as number,
    redirectUri: r.redirect_uri as string,
    codeChallenge: r.code_challenge as string,
    scope: (r.scope as string | null) ?? null,
  }
}

// ---------------------------------------------------------------- connections

export interface ConnectionTokens {
  id: string
  accessToken: string
  refreshToken: string | null
}

export async function createConnection(input: {
  userId: number
  name: string
  kind: "oauth" | "skill"
  clientId?: string | null
  withRefresh?: boolean
}): Promise<ConnectionTokens> {
  await ensureOAuthTables()
  // Reconnecting the same app (retrying a sign-in, reinstalling the
  // connector) replaces its previous connection instead of piling up
  // duplicates in Settings.
  if (input.kind === "oauth" && input.clientId) {
    await getDb()`
      UPDATE habit_api_connections SET revoked_at = NOW()
      WHERE user_id = ${input.userId} AND client_id = ${input.clientId} AND revoked_at IS NULL`
  }
  const id = crypto.randomUUID()
  const accessToken = randomToken(ACCESS_PREFIX)
  const refreshToken = input.withRefresh ? randomToken(REFRESH_PREFIX) : null
  await getDb()`
    INSERT INTO habit_api_connections (id, user_id, name, kind, client_id, access_hash, refresh_hash)
    VALUES (${id}, ${input.userId}, ${input.name}, ${input.kind}, ${input.clientId ?? null},
            ${sha256Hex(accessToken)}, ${refreshToken ? sha256Hex(refreshToken) : null})`
  return { id, accessToken, refreshToken }
}

/**
 * New access token for a refresh token. The refresh token itself stays valid
 * (no rotation): a client that refreshes twice in a race must not lock itself
 * out, and revoking from Settings kills both anyway.
 */
export async function refreshConnection(refreshToken: string, clientId: string): Promise<string | null> {
  await ensureOAuthTables()
  const accessToken = randomToken(ACCESS_PREFIX)
  const rows = await getDb()`
    UPDATE habit_api_connections
    SET access_hash = ${sha256Hex(accessToken)}
    WHERE refresh_hash = ${sha256Hex(refreshToken)} AND client_id = ${clientId} AND revoked_at IS NULL
    RETURNING id`
  return rows.length ? accessToken : null
}

export async function lookupConnection(accessToken: string): Promise<{ id: string; userId: number } | null> {
  await ensureOAuthTables()
  const rows = await getDb()`
    UPDATE habit_api_connections
    SET last_used_at = NOW()
    WHERE access_hash = ${sha256Hex(accessToken)} AND revoked_at IS NULL
    RETURNING id, user_id`
  return rows.length ? { id: rows[0].id as string, userId: rows[0].user_id as number } : null
}

export interface ConnectionSummary {
  id: string
  name: string
  kind: string
  createdAt: string
  lastUsedAt: string | null
}

export async function listConnections(userId: number): Promise<ConnectionSummary[]> {
  await ensureOAuthTables()
  const rows = await getDb()`
    SELECT id, name, kind, created_at, last_used_at FROM habit_api_connections
    WHERE user_id = ${userId} AND revoked_at IS NULL
    ORDER BY COALESCE(last_used_at, created_at) DESC`
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    kind: r.kind as string,
    createdAt: new Date(r.created_at as string).toISOString(),
    lastUsedAt: r.last_used_at ? new Date(r.last_used_at as string).toISOString() : null,
  }))
}

export async function revokeConnection(userId: number, id: string): Promise<boolean> {
  await ensureOAuthTables()
  const rows = await getDb()`
    UPDATE habit_api_connections SET revoked_at = NOW()
    WHERE id = ${id} AND user_id = ${userId} AND revoked_at IS NULL
    RETURNING id`
  return rows.length > 0
}

// ---------------------------------------------------------------- site settings

export async function getSiteSetting(key: string): Promise<string | null> {
  await ensureOAuthTables()
  const rows = await getDb()`SELECT value FROM habit_site_settings WHERE key = ${key}`
  return rows.length ? (rows[0].value as string) : null
}

export async function setSiteSetting(key: string, value: string | null): Promise<void> {
  await ensureOAuthTables()
  if (value === null) {
    await getDb()`DELETE FROM habit_site_settings WHERE key = ${key}`
  } else {
    await getDb()`
      INSERT INTO habit_site_settings (key, value) VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  }
}
