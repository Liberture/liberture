import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findItemByName, forwardRequest } from "@/lib/habits/api/find-item"
import { PUT as putProject } from "@/app/api/v1/projects/[id]/route"

/**
 * POST /api/v1/projects/update — body { project: "<name as said>", name?, color? }
 * Renames or recolors a project by name (update_project).
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "todos")
  if (user instanceof NextResponse) return user

  let body: { project?: unknown; name?: unknown; color?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const found = findItemByName(user.data.projects ?? [], body.project, (p) => p.name, "project")
  if (found instanceof NextResponse) return found
  const project = found

  const patch: Record<string, unknown> = {}
  if (typeof body.name === "string") patch.name = body.name
  if (typeof body.color === "string") patch.color = body.color
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to change: send name or color" }, { status: 400 })

  const response = await putProject(forwardRequest(request, `/api/v1/projects/${project.id}`, "PUT", patch), { params: Promise.resolve({ id: project.id }) })
  if (!response.ok) return response
  const updated = await response.json()
  return NextResponse.json({
    ...updated,
    say: patch.name && updated.name !== project.name ? `Renamed ${project.name} to ${updated.name}.` : `Updated ${updated.name}.`,
  })
}
