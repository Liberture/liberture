import { NextResponse } from "next/server"
import { authorizeIntegration } from "@/lib/habits/integration-auth"
import { findItemByName, forwardRequest } from "@/lib/habits/api/find-item"
import { DELETE as deleteProject } from "@/app/api/v1/projects/[id]/route"

/**
 * POST /api/v1/projects/delete — body { project: "<name as said>" } (delete_project).
 * Scope delete_items, OFF by default. Its todos stay, without a project.
 */
export async function POST(request: Request) {
  const user = await authorizeIntegration(request, "delete_items")
  if (user instanceof NextResponse) return user

  let body: { project?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const found = findItemByName(user.data.projects ?? [], body.project, (p) => p.name, "project")
  if (found instanceof NextResponse) return found
  const project = found

  const response = await deleteProject(forwardRequest(request, `/api/v1/projects/${project.id}`, "DELETE"), {
    params: Promise.resolve({ id: project.id }),
  })
  if (!response.ok) return response
  const kept = (user.data.todos ?? []).filter((t) => t.projectId === project.id).length
  return NextResponse.json({
    ...(await response.json()),
    deleted: { id: project.id, name: project.name },
    say: `Deleted the ${project.name} project${kept ? `; its ${kept} todo${kept === 1 ? " is" : "s are"} kept without a project` : ""}.`,
  })
}
