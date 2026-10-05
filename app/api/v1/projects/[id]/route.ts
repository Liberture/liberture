import { NextResponse } from "next/server"
import { getDb } from "@/lib/habits/db"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import type { Project } from "@/lib/habits/types"
import {
  deleteProjectRow,
  getProjectRow,
  refreshStorageJsonFromOptimizedTables,
  syncOptimizedStorageTablesIfEmpty,
  upsertProjectRow,
} from "@/lib/habits/optimized-storage"

async function updateProject(request: Request, id: string) {
  const user = await authorizeIntegration(request, "todos")
  if (user instanceof NextResponse) return user

  let body: Partial<Pick<Project, "name" | "color">>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const now = new Date().toISOString()

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)

    const existing = await getProjectRow(sql, user.userId, id)
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    const updatedProject: Project = { ...existing, updatedAt: now }
    if (body.name !== undefined) {
      const name = body.name.trim()
      if (!name) return NextResponse.json({ error: "name cannot be empty" }, { status: 400 })
      updatedProject.name = name
    }
    if (body.color !== undefined) updatedProject.color = body.color?.trim() || undefined

    await upsertProjectRow(sql, user.userId, updatedProject)
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["projects"], now)

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error("Failed to update project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateProject(request, id)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return updateProject(request, id)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authorizeIntegration(request, "todos")
  if (user instanceof NextResponse) return user

  const { id } = await params
  const now = new Date().toISOString()

  try {
    const sql = getDb()
    await syncOptimizedStorageTablesIfEmpty(sql, user.userId, user.data)

    const existing = await getProjectRow(sql, user.userId, id)
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    await deleteProjectRow(sql, user.userId, id)
    await sql`
      UPDATE habit_todos
      SET project_id = NULL,
          updated_at = ${now},
          body = jsonb_set(body - 'projectId', '{updatedAt}', to_jsonb(${now}::text), true)
      WHERE user_id = ${user.userId} AND project_id = ${id}
    `
    await sql`
      UPDATE habit_users
      SET data = jsonb_set(
            COALESCE(data, '{}'::jsonb),
            '{projectTombstones}',
            COALESCE(data->'projectTombstones', '{}'::jsonb) || jsonb_build_object(${id}::text, ${now}::text),
            true
          ),
          updated_at = NOW()
      WHERE id = ${user.userId}
    `
    await refreshStorageJsonFromOptimizedTables(sql, user.userId, ["projects", "todos"], now)

    return NextResponse.json({ success: true, deletedAt: now })
  } catch (error) {
    console.error("Failed to delete project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
