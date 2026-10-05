import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import type { Project } from "@/lib/habits/types"
import {
  getProjectRows,
  refreshStorageJsonFromOptimizedTables,
  syncOptimizedStorageTablesIfEmpty,
  upsertProjectRow,
} from "@/lib/habits/optimized-storage"
import crypto from "crypto"

/**
 * GET /api/v1/projects
 * Returns all todo projects for automation and backup tooling.
 * Auth: Authorization: Bearer hti_...
 */
export async function GET(request: Request) {
  const user = await authorizeIntegration(request, "read")
  if (user instanceof NextResponse) return user

  const sql = getDb()
  await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)
  return NextResponse.json(await getProjectRows(sql, user.userId))
}

/**
 * POST /api/v1/projects
 * Body: { name, color? }
 * Creates a project if it does not already exist by case-insensitive name.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "todos")
  if (user instanceof NextResponse) return user

  let body: { name?: string; color?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const name = body.name?.trim()
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)
    const existingProject = (await getProjectRows(sql, user.userId)).find(
      (project) => project.name.toLowerCase() === name.toLowerCase(),
    )

    if (existingProject) {
      return NextResponse.json(existingProject)
    }

    const now = new Date().toISOString()
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      color: body.color?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    }

    await upsertProjectRow(sql, user.userId, newProject)
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["projects"], now)

    return NextResponse.json(newProject, { status: 201 })
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
