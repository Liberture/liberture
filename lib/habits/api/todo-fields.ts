import crypto from "crypto"
import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { resolveByName, spokenList } from "@/lib/habits/api/resolve"
import { getProjectRows, refreshStorageJsonFromOptimizedTables, syncOptimizedStorageTablesIfEmpty, upsertProjectRow } from "@/lib/habits/optimized-storage"
import type { Project, StorageData } from "@/lib/habits/types"

/**
 * Field helpers for the todo routes when an assistant writes them: a project
 * by name instead of id, and subtasks as plain strings.
 */

/**
 * The project an assistant named. `create: true` (writes) makes it when
 * nothing matches, so "add milk to my groceries project" works the first
 * time; reads get the 404 with the names that exist.
 */
export async function projectIdFromName(
  userId: number,
  data: StorageData,
  name: unknown,
  options: { create: boolean }
): Promise<{ id: string; name: string; created: boolean } | NextResponse> {
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "project must be a project's name" }, { status: 400 })
  }
  const sql = getDb()
  await syncOptimizedStorageTablesIfEmpty(sql, userId, data)
  const projects = await getProjectRows(sql, userId)
  const resolved = resolveByName(projects, name, (p) => p.name)
  if (resolved.kind === "match") return { id: resolved.item.id, name: resolved.item.name, created: false }
  const names = resolved.options.slice(0, 6).map((p) => p.name)
  if (resolved.kind === "ambiguous") {
    return NextResponse.json(
      { error: "More than one project matches", code: "ambiguous", options: names, say: `Which project: ${spokenList(names)}?` },
      { status: 409 }
    )
  }
  if (!options.create) {
    return NextResponse.json(
      { error: "No project matches", code: "not_found", options: names, say: names.length ? `I can't find that project. You have ${spokenList(names, "and")}.` : "You don't have any projects yet." },
      { status: 404 }
    )
  }
  const now = new Date().toISOString()
  const project: Project = { id: crypto.randomUUID(), name: name.trim().slice(0, 80), createdAt: now, updatedAt: now }
  await upsertProjectRow(sql, userId, project)
  await refreshStorageJsonFromOptimizedTables(sql, userId, ["projects"], now)
  return { id: project.id, name: project.name, created: true }
}

/** ["call mum", {title: "buy card"}] → the stored subtask shape; null if unusable. */
export function normalizeSubtasks(input: unknown): Array<{ id: string; title: string; completed: boolean }> | null | undefined {
  if (input === undefined) return undefined
  if (!Array.isArray(input)) return null
  const result: Array<{ id: string; title: string; completed: boolean }> = []
  for (const item of input) {
    if (typeof item === "string" && item.trim()) {
      result.push({ id: crypto.randomUUID(), title: item.trim().slice(0, 200), completed: false })
    } else if (item && typeof item === "object" && typeof (item as { title?: unknown }).title === "string") {
      const s = item as { id?: unknown; title: string; completed?: unknown }
      result.push({
        id: typeof s.id === "string" && s.id ? s.id : crypto.randomUUID(),
        title: s.title.trim().slice(0, 200),
        completed: Boolean(s.completed),
      })
    } else {
      return null
    }
  }
  return result
}

/** Tags as an array or "a, b" string. */
export function normalizeTags(input: unknown): string[] | undefined {
  if (input === undefined || input === null) return undefined
  const raw = Array.isArray(input) ? input : String(input).split(",")
  return [...new Set(raw.map((t) => String(t).trim()).filter(Boolean))].slice(0, 20)
}
