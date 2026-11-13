import type { Prisma, PrismaClient } from "@prisma/client"

export const directoryTypes = ["people", "organizations", "projects", "protocols", "books", "articles"] as const

type EditContext = { source: "manual" | "ai", actor: string }

export function requestEditContext(request: Request, actor: string): EditContext {
  return { actor, source: request.headers.get("x-liberture-edit-source") === "ai" ? "ai" : "manual" }
}

export function withDirectoryEdit<T>(db: PrismaClient, context: EditContext, change: (tx: Prisma.TransactionClient) => Promise<T>) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT set_config('liberture.edit_actor', ${context.actor}, true) AS actor,
                              set_config('liberture.edit_source', ${context.source}, true) AS source`
    return change(tx)
  })
}
