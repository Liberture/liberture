import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { getAuthUser, isAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { httpUrl } from "./organization-entries"
import { requestEditContext, withDirectoryEdit } from "./revisions"

type Kind = "organization" | "project"
const identity = { id: true, name: true, slug: true }
export const profileRelations = {
  projectOrganizations: { include: { organization: { select: identity } }, orderBy: [{ organizationId: "asc" }, { role: "asc" }] },
  organizationProjects: { include: { project: { select: identity } }, orderBy: [{ projectId: "asc" }, { role: "asc" }] },
  profilePeople: { include: { person: { select: identity } }, orderBy: [{ personId: "asc" }, { role: "asc" }] },
} satisfies Prisma.OrganizationInclude

class InvalidEdit extends Error {}
type Link = { target: string, role: string, sourceUrl: string }

function readLinks(raw: unknown, field: "personId" | "organizationId"): Link[] | undefined {
  if (raw === undefined) return
  if (!Array.isArray(raw)) throw new InvalidEdit("Relationships must be a list")
  const keys = new Set<string>()
  return raw.map(item => {
    const target = item?.[field]
    const role = typeof item?.role === "string" ? item.role.trim() : ""
    const sourceUrl = httpUrl(item?.sourceUrl)
    if (typeof target !== "string" || !target || !role || !sourceUrl) throw new InvalidEdit("Each relationship needs a profile, role and source URL")
    const key = JSON.stringify([target, role])
    if (keys.has(key)) throw new InvalidEdit("Duplicate relationship")
    keys.add(key)
    return { target, role, sourceUrl: item.sourceUrl.trim() }
  })
}

async function saveLinks(tx: Prisma.TransactionClient, profileId: string, kind: Kind, orgs?: Link[], people?: Link[]) {
  if (orgs !== undefined) {
    if (kind !== "project") throw new InvalidEdit("Only projects link to related organizations")
    const keep = orgs.map(link => ({ organizationId: link.target, role: link.role }))
    await tx.projectOrganization.deleteMany({ where: { projectId: profileId, ...(keep.length ? { NOT: { OR: keep } } : {}) } })
    for (const link of orgs) {
      const key = { projectId: profileId, organizationId: link.target, role: link.role }
      await tx.projectOrganization.upsert({
        where: { projectId_organizationId_role: key }, create: { ...key, sourceUrl: link.sourceUrl }, update: { sourceUrl: link.sourceUrl },
      })
    }
  }
  if (people !== undefined) {
    const keep = people.map(link => ({ personId: link.target, role: link.role }))
    await tx.profilePerson.deleteMany({ where: { profileId, ...(keep.length ? { NOT: { OR: keep } } : {}) } })
    for (const link of people) {
      const key = { profileId, personId: link.target, role: link.role }
      await tx.profilePerson.upsert({
        where: { profileId_personId_role: key }, create: { ...key, sourceUrl: link.sourceUrl }, update: { sourceUrl: link.sourceUrl },
      })
    }
  }
}

export async function listProfiles(kind: Kind) {
  const records = await prisma.organization.findMany({ where: { directoryKind: kind }, include: profileRelations, orderBy: { name: "asc" } })
  return NextResponse.json({ [kind + "s"]: records })
}

export async function readProfile(kind: Kind, slug: string) {
  const record = await prisma.organization.findUnique({ where: { slug, directoryKind: kind }, include: profileRelations })
  return record ? NextResponse.json(record) : NextResponse.json({ error: "Profile not found" }, { status: 404 })
}

export async function writeProfile(request: Request, kind: Kind, id?: string) {
  const user = await getAuthUser()
  if (!user || !await isAdmin(user.userId)) return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  try {
    const remove = request.method === "DELETE"
    const body = remove ? {} : await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new InvalidEdit("Invalid profile")
    const orgs = readLinks(body.relatedOrganizations, "organizationId")
    const people = readLinks(body.relatedPeople, "personId")
    const data = {
      name: body.name, description: body.description, type: body.type, website: body.website, pillars: body.pillars,
      founded: body.founded === "" ? null : body.founded, keyPeople: body.keyPeople === "" ? null : body.keyPeople,
      resources: body.resources === "" ? null : body.resources, publications: body.publications === "" ? null : body.publications,
      wikipedia: body.wikipedia === "" ? null : body.wikipedia, imageUrl: body.imageUrl === "" ? null : body.imageUrl,
    }
    const result = await withDirectoryEdit(prisma, requestEditContext(request, user.userId), async tx => {
      let profileId = id
      if (id) {
        const existing = await tx.$queryRaw<{id:string}[]>`SELECT id FROM "Organization" WHERE id=${id} AND "directoryKind"=${kind} FOR UPDATE`
        if (!existing.length) return null
        if (remove) {
          await tx.organization.delete({ where: { id } })
          return { success: true }
        }
        await tx.organization.update({ where: { id }, data: { ...data, updatedAt: new Date() } })
      } else {
        if (typeof data.name !== "string" || !data.name.trim() || typeof data.description !== "string" || !data.description.trim()) throw new InvalidEdit("Name and description are required")
        const base = data.name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") || kind
        const existing = await tx.organization.findUnique({ where: { slug: base }, select: { id: true } })
        profileId = randomUUID()
        await tx.organization.create({ data: {
          ...data, id: profileId, slug: existing ? base + "-" + profileId.slice(0,8) : base, directoryKind: kind,
          type: data.type || "research", website: data.website || "", pillars: data.pillars || "mind", updatedAt: new Date(),
        } })
      }
      await saveLinks(tx, profileId!, kind, orgs, people)
      const profile = await tx.organization.findUniqueOrThrow({ where: { id: profileId }, include: profileRelations })
      return id ? profile : { [kind + "s"]: [profile] }
    })
    return result ? NextResponse.json(result) : NextResponse.json({ error: "Profile not found" }, { status: 404 })
  } catch (err) {
    if (err instanceof InvalidEdit || err instanceof SyntaxError) return NextResponse.json({ error: err.message }, { status: 400 })
    if (err && typeof err === "object" && "code" in err && ["P2003","P2004","P2002"].includes(String(err.code))) {
      return NextResponse.json({ error: "Invalid profile or relationship" }, { status: 400 })
    }
    console.error("Directory profile update failed", err)
    return NextResponse.json({ error: "Could not save profile" }, { status: 500 })
  }
}
