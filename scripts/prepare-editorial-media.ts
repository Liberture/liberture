import { readFile } from "node:fs/promises"
import type { PrismaClient } from "@prisma/client"
import { withDirectoryEdit } from "../lib/directory/revisions"
import { importRoyalFlush } from "./import-royal-flush"

export async function prepareEditorialMedia(db: PrismaClient) {
  const id = "20261114-editorial-media"
  await withDirectoryEdit(db, { actor: "editorial-media-migration", source: "ai" }, async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(1519137568)`
    if (await tx.editorialMigration.findUnique({ where: { id } })) return
    const sql = await readFile(new URL("../prisma/migrations/20261114010000_editorial_media/migration.sql", import.meta.url), "utf8")
    for (const statement of sql.split(";")) {
      if (statement.trim().startsWith("UPDATE")) await tx.$executeRawUnsafe(statement)
    }
    await tx.editorialMigration.create({ data: { id } })
  }, { timeout: 60_000 })
  await importRoyalFlush(db)
}
