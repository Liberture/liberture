import { CardCarousel } from "@/components/ui/card-carousel"
import { PersonCard } from "@/components/people/person-card"
import { profileSummary } from "@/lib/profile-biography"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getDictionary } from "@/lib/habits/i18n"
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
    select: {name:true, slug:true, pillars:true, imageUrl:true, title:true, bio:true, featured:true},
    orderBy: [{name:"asc"}, {slug:"asc"}],
  }) : []
  const related = candidates.map(person => ({
    person,
    shared: profilePillars(person.pillars).filter(pillar => focus.includes(pillar)),
  })).filter(person => person.shared.length).sort((a,b) => b.shared.length - a.shared.length).slice(0,6)
  const {protocolReader: copy, protocolCard} = getDictionary(await getRequestLocale()).app
  return <Details person={record}>
    {related.length > 0 && <CardCarousel title={copy.relatedPeople} previousLabel={copy.previousPeople} nextLabel={copy.nextPeople}>
      {related.map(({person, shared}) => <li key={person.slug}>
        <PersonCard person={{...person, bio:profileSummary(person), pillars:shared.join(",")}} featuredLabel={protocolCard.featured} />
      </li>)}
    </CardCarousel>}
  </Details>
}
