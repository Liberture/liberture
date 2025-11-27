import { ContentProfilePage } from "@/components/content-profile-page"

export default function ContentPage({ params }: { params: { id: string } }) {
  return <ContentProfilePage id={params.id} />
}
