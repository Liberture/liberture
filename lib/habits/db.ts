import postgres from "postgres"

let sql: ReturnType<typeof postgres> | undefined

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set")
  }

  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, {
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
