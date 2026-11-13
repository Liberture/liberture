import { notFound } from "next/navigation"
import { getOrganization } from "@/lib/seo/public-records"
import { detailMetadata } from "@/lib/seo/detail-metadata"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import Details from "./details"

type Props = { params: Promise<{slug:string}> }

export async function generateMetadata({params}: Props) {
  const {slug} = await params
  const record = await getOrganization(slug)
  if (!record) notFound()
  return detailMetadata(`/organizations/${slug}`, record.name, record.description, "website", record.imageUrl)
}

export default async function Page({params}: Props) {
  const record = await getOrganization((await params).slug)
  if (!record) notFound()
  return <Details organization={record} locale={await getRequestLocale()} />
}
