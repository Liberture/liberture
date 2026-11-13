export function profileSection(kind: string) {
  return kind === "project" ? "projects" : "organizations"
}

export function profilePath(record: { directoryKind: string; slug: string }) {
  return `/${profileSection(record.directoryKind)}/${record.slug}`
}
