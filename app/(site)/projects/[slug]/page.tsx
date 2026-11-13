import { ProfilePage, profileMetadata, type ProfilePageProps } from "@/components/directory/profile-page"

export const generateMetadata = profileMetadata

export default function Page(props: ProfilePageProps) {
  return ProfilePage({ ...props, section: "projects" })
}
