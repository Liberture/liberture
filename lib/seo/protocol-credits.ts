import { findProtocol } from "@/lib/habits/protocols/catalog"

export type Byline = { name: string; slug: string | null }
type DirectoryPerson = { name: string; slug: string }

export function protocolBylines(slug: string, creator: string | null, people: DirectoryPerson[]): Byline[] {
  const catalog = findProtocol(slug)
  const authors = [catalog?.author, ...(catalog?.coAuthors ?? [])].flatMap(author => author ? [author] : [])
  const credits = authors.length ? authors : creator?.trim() ? [{ id: creator, name: creator, kind: "person" }] : []
  return credits.map(author => {
    const key = author.name.trim().toLowerCase()
    const person = author.kind === "person" && (
      people.find(person => person.slug === author.id) ??
      people.find(person => person.name.trim().toLowerCase() === key)
    )
    return person ? { name: person.name, slug: person.slug } : { name: author.name, slug: null }
  })
}
