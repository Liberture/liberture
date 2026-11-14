import { ChallengeRoom } from "@/components/habits/challenges/detail"
export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const }
export default async function Page({ params, searchParams }: { params: Promise<{id: string}>; searchParams: Promise<{pay?: string}> }) {
  return <ChallengeRoom id={(await params).id} startPayment={(await searchParams).pay === "1"} />
}
