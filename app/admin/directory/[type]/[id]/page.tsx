import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAuthUser, isAdmin } from "@/lib/auth"
import { DirectoryEditor } from "../../directory-editor"
import { editorValues, isDirectoryType } from "../../editor-fields"

const loaders = {
  people: (id: string) => prisma.person.findUnique({ where: { id } }),
  organizations: (id: string) => prisma.organization.findUnique({ where: { id } }),
  protocols: (id: string) => prisma.protocol.findUnique({ where: { id } }),
  articles: (id: string) => prisma.article.findUnique({ where: { id } }),
  books: (id: string) => prisma.book.findUnique({ where: { id } }),
}

export default async function DirectoryEditPage({ params, searchParams }: {
  params: Promise<{ type: string; id: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { type, id } = await params
  if (!isDirectoryType(type)) notFound()
  const session = await getAuthUser()
  if (!session) redirect("/login?redirect=/admin/directory")
  if (!(await isAdmin(session.userId))) redirect("/")
  const record = await loaders[type](id)
  if (!record) notFound()
  const { q } = await searchParams
  const query = new URLSearchParams({ type })
  if (typeof q === "string" && q) query.set("q", q)
  return <DirectoryEditor key={record.id} type={type} id={id} initialValues={editorValues(type, record)} backHref={`/admin/directory?${query}`} />
}
