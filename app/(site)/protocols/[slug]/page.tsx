import { notFound } from "next/navigation"
import { getProtocol } from "@/lib/seo/public-records"
import { detailMetadata } from "@/lib/seo/detail-metadata"
import Details from "./details"
import { protocolImage } from "@/lib/habits/protocols/images"

type Props = { params: Promise<{slug:string}> }

export async function generateMetadata({params}: Props) {
  const {slug} = await params
  const record = await getProtocol(slug)
  if (!record) notFound()
  return detailMetadata(`/protocols/${slug}`, record.name, record.description, "article", protocolImage(slug)?.png)
}

export default async function Page({params}: Props) {
  const record = await getProtocol((await params).slug)
  if (!record) notFound()
  return Details({ protocol: record })
}
