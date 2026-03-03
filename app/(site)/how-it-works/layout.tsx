import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "How It Works | OpenClaw Skills + Nostr Trust Layer | Liberture",
  description: "Learn how Liberture combines wearable data with community knowledge. AI skills analyze your metrics, recommend trusted protocols, and track what works for you.",
  openGraph: {
    title: "How It Works | Liberture",
    description: "Wearable data meets community knowledge. AI skills that analyze your metrics and recommend protocols from people you trust.",
    url: "https://liberture.com/how-it-works",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How It Works | Liberture",
    description: "Wearable data meets community knowledge. AI skills that analyze your metrics.",
  },
}

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
