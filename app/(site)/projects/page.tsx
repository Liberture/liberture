import { ProfileIndex, type ProfileIndexProps } from "@/components/directory/profile-index"
import { detailMetadata } from "@/lib/seo/detail-metadata"

export const metadata = detailMetadata("/projects", "Projects", "Explore platforms, initiatives and communities, and the people and organizations behind them.", "website")

export default function Page(props: ProfileIndexProps) {
  return ProfileIndex({ ...props, kind: "project" })
}
