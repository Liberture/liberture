import { publicPageMetadata } from "@/lib/seo/public-page-metadata"
export function generateMetadata() {
  return publicPageMetadata("/projects", "projects")
}

import { ProfileIndex, type ProfileIndexProps } from "@/components/directory/profile-index"

export default function Page(props: ProfileIndexProps) {
  return ProfileIndex({ ...props, kind: "project" })
}
