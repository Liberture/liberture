import { notFound } from "next/navigation"
import { getPerson } from "@/lib/seo/public-records"
import { detailMetadata } from "@/lib/seo/detail-metadata"
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
  return <Details person={record} />
}
