import { directoryPrisma } from "@/lib/i18n/directory-records.server"

type CreditRole = "author" | "collaborator" | "editor"

export async function bookContributors(byline: string, primary?: { slug: string; name: string } | null) {
  const credits = new Map<string, CreditRole>()
  let role: CreditRole = "author"
  for (const part of byline.split(/(,?\s+edited and updated by\s+|\s+with\s+|\s+(?:and|&)\s+|,\s*)/i)) {
    const name = part.trim()
    if (/edited and updated by/i.test(name)) role = "editor"
    else if (name.toLowerCase() === "with") role = "collaborator"
    else if (name && !/^(and|&|,)$/i.test(name) && !credits.has(name)) credits.set(name, role)
  }
  if (!credits.size && primary) credits.set(primary.name, "author")

  const names = [...credits.keys()]
  const profiles = await directoryPrisma.person.findMany({
    where: { OR: [
      { name: { in: names, mode: "insensitive" } },
      ...(primary ? [{ slug: primary.slug }] : []),
      { slug: { in: names.map(name => name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/-$/, "")) } },
    ] },
    select: { slug: true, name: true, title: true, summary: true, bio: true, imageUrl: true, featured: true, pillars: true },
  })
  const normalize = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ")
  return names.map((name, index) => ({
    name, role: credits.get(name)!,
    profile: profiles.find(person => normalize(person.name) === normalize(name)) ??
      (index === 0 ? profiles.find(person => person.slug === primary?.slug) : undefined),
  }))
}
