import type { Metadata } from "next"

import { CoachAdmin } from "@/components/habits/coach/coach-admin"

export const metadata: Metadata = {
  title: "Coach connection",
  robots: { index: false, follow: false },
}

export default function CoachAdminPage() {
  return <CoachAdmin />
}
