import { archiveHandler } from "@/lib/habits/api/archive"

/** POST /api/v1/habits/archive — body { habit }. See lib/habits/api/archive.ts. */
export const POST = archiveHandler(true)
