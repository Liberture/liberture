import { notFound, permanentRedirect } from "next/navigation"
import { getOrganization } from "@/lib/seo/public-records"
import { detailMetadata } from "@/lib/seo/detail-metadata"
import { getLocale } from "next-intl/server"
import { profilePath, profileSection } from "@/lib/directory/profile-path"
import { localizedPageUrl } from "@/lib/i18n/page-url.server"
import Details from "./profile-details"

export type ProfilePageProps = { params: Promise<{ slug: string }> }

export async function profileMetadata({ params }: ProfilePageProps) {
  const record = await getOrganization((await params).slug)
  if (!record) notFound()
  return detailMetadata(profilePath(record), record.name, record.description, "website", record.imageUrl)
}

export async function ProfilePage({ params, section }: ProfilePageProps & { section: "organizations" | "projects" }) {
  const record = await getOrganization((await params).slug)
  if (!record) notFound()
  const locale = await getLocale()
  if (section !== profileSection(record.directoryKind)) permanentRedirect(new URL(await localizedPageUrl(profilePath(record), locale)).pathname)
  return Details({organization: record, locale})
}
