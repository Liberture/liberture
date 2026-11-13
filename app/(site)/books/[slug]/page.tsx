import { getRequestLocale } from "@/lib/habits/i18n/server"
import { localizedPageUrl } from "@/lib/i18n/page-url.server"
import { notFound, permanentRedirect } from "next/navigation"
import { getBook } from "@/lib/seo/public-records"
import { detailMetadata } from "@/lib/seo/detail-metadata"
import Details from "./details"

type Props = { params: Promise<{slug:string}> }

export async function generateMetadata({params}: Props) {
  const {slug} = await params
  const record = await getBook(slug)
  if (!record) notFound()
  return detailMetadata(`/books/${record.slug}`, record.title, record.description, "book", record.imageUrl)
}

export default async function Page({params}: Props) {
  const { slug } = await params
  const record = await getBook(slug)
  if (!record) notFound()
  if (slug !== record.slug) permanentRedirect(new URL(await localizedPageUrl(`/books/${record.slug}`, await getRequestLocale())).pathname)
  return Details({book: record})
}
