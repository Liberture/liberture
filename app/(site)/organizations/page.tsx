import { ProfileIndex, type ProfileIndexProps } from "@/components/directory/profile-index"
import { detailMetadata } from "@/lib/seo/detail-metadata"

export const metadata = detailMetadata("/organizations", "Organizations", "Companies and nonprofits behind directory projects.", "website")

export default function Page(props: ProfileIndexProps) {
  return ProfileIndex({ ...props, kind: "organization" })
}
