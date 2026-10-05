import type { Project, StorageData } from "./types"

export type ProjectTombstones = NonNullable<StorageData["projectTombstones"]>

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}

export function mergeProjectTombstones(
  clientTombstones?: ProjectTombstones,
  serverTombstones?: ProjectTombstones,
): ProjectTombstones {
  const merged: ProjectTombstones = {}

  for (const tombstones of [clientTombstones, serverTombstones]) {
    for (const [id, deletedAt] of Object.entries(tombstones ?? {})) {
      if (!isTimestamp(deletedAt)) continue
      if (!merged[id] || deletedAt > merged[id]) merged[id] = deletedAt
    }
  }

  return merged
}

interface MergeProjectsOptions {
  clientProjects?: StorageData["projects"]
  serverProjects?: StorageData["projects"]
  clientTombstones?: ProjectTombstones
  serverTombstones?: ProjectTombstones
}

export interface MergeProjectsResult {
  projects: StorageData["projects"]
  projectTombstones: ProjectTombstones
}

function projectTimestamp(project: Project): string {
  return project.updatedAt || project.createdAt
}

function tombstoneWins(project: Project, tombstones: ProjectTombstones): boolean {
  const deletedAt = tombstones[project.id]
  return isTimestamp(deletedAt) && deletedAt >= projectTimestamp(project)
}

export function mergeProjects({
  clientProjects,
  serverProjects,
  clientTombstones,
  serverTombstones,
}: MergeProjectsOptions): MergeProjectsResult {
  const projectTombstones = mergeProjectTombstones(clientTombstones, serverTombstones)
  const merged = new Map<string, Project>()

  for (const project of serverProjects ?? []) {
    if (!project?.id || tombstoneWins(project, projectTombstones)) continue
    merged.set(project.id, project)
  }

  for (const project of clientProjects ?? []) {
    if (!project?.id || tombstoneWins(project, projectTombstones)) continue
    const existing = merged.get(project.id)
    merged.set(project.id, existing && projectTimestamp(existing) > projectTimestamp(project) ? existing : project)
  }

  return { projects: Array.from(merged.values()), projectTombstones }
}
