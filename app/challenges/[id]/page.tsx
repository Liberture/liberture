import { ChallengeRoom } from "@/components/habits/challenges/detail"
export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const }
export default async function Page({ params }: { params: Promise<{id: string}> }) {
  return <ChallengeRoom id={(await params).id} />
}
