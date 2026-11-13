import { notFound } from "next/navigation"
import { getPerson } from "@/lib/seo/public-records"
import { detailMetadata } from "@/lib/seo/detail-metadata"
import { prisma } from "@/lib/prisma"
import { profilePillars } from "@/lib/pillars"
import Details from "./details"

type Props = { params: Promise<{slug:string}> }

export async function generateMetadata({params}: Props) {
  const {slug} = await params
  const record = await getPerson(slug)
  if (!record) notFound()
  return detailMetadata(`/people/${slug}`, record.name, record.bio, "profile", record.imageUrl)
}

export default async function Page({params}: Props) {
  const record = await getPerson((await params).slug)
  if (!record) notFound()
  const focus = profilePillars(record.pillars)
  const candidates = focus.length ? await prisma.person.findMany({
    where: { slug: { not: record.slug } },
    select: {name:true, slug:true, pillars:true},
    orderBy: [{name:"asc"}, {slug:"asc"}],
  }) : []
  const related = candidates.map(person => ({
    name: person.name, slug: person.slug,
    shared: profilePillars(person.pillars).filter(pillar => focus.includes(pillar)),
  })).filter(person => person.shared.length).sort((a,b) => b.shared.length - a.shared.length).slice(0,3)
  return <Details person={record} related={related} />
}
