import postgres from "postgres"

let sql: ReturnType<typeof postgres> | undefined

/**
 * DATABASE_URL is shared with Prisma, whose URLs carry options of their own
 * (`?schema=public`, `connection_limit`, …). postgres.js forwards unknown
 * query parameters to the server as runtime settings, and Postgres rejects
 * them ("unrecognized configuration parameter \"schema\""), so strip them and
 * map `schema` onto search_path.
 */
const PRISMA_ONLY_PARAMS = [
  "schema",
  "connection_limit",
  "pool_timeout",
  "connect_timeout",
  "socket_timeout",
  "pgbouncer",
  "statement_cache_size",
  "sslaccept",
  "sslidentity",
  "sslpassword",
  "sslcert",
]

function normalizeDatabaseUrl(raw: string): { url: string; schema: string | null } {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return { url: raw, schema: null }
  }
  const schema = parsed.searchParams.get("schema")
  for (const param of PRISMA_ONLY_PARAMS) parsed.searchParams.delete(param)
  return { url: parsed.toString(), schema: schema && schema !== "public" ? schema : null }
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }

  if (!sql) {
    const { url, schema } = normalizeDatabaseUrl(process.env.DATABASE_URL)
    sql = postgres(url, {
      ...(schema ? { connection: { search_path: schema } } : {}),
      max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
      idle_timeout: 20,
      connect_timeout: 10,
      // This codebase historically passes pre-serialized JSON strings to
      // explicit ::jsonb casts. postgres.js otherwise JSON-stringifies those
      // strings a second time after PostgreSQL infers the parameter type.
      types: {
        json: {
          to: 114,
          from: [114, 3802],
          serialize: (value: unknown) =>
            typeof value === "string" ? value : JSON.stringify(value),
          parse: (value: string) => JSON.parse(value),
        },
      },
    })
  }

  return sql
}
