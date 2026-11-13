import { notFound } from "next/navigation"
import { getBook } from "@/lib/seo/public-records"
import { detailMetadata } from "@/lib/seo/detail-metadata"
import Details from "./details"

type Props = { params: Promise<{slug:string}> }

export async function generateMetadata({params}: Props) {
  const {slug} = await params
  const record = await getBook(slug)
  if (!record) notFound()
  return detailMetadata(`/books/${slug}`, record.title, record.description, "book", record.imageUrl)
}

export default async function Page({params}: Props) {
  const record = await getBook((await params).slug)
  if (!record) notFound()
  return <Details book={record} />
}
