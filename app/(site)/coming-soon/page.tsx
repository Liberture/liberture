"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Home, ArrowLeft, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LibertureLogo } from "@/components/branding/LibertureLogo"

const PAGE_LABELS: Record<string, string> = {
  marketplace: "Marketplace",
  directory: "Directory",
  knowledge: "Knowledge Base",
  books: "Books",
  protocols: "Protocols",
  people: "People",
  organizations: "Organizations",
  games: "Games",
  pillars: "Pillars",
  dashboard: "Dashboard",
}

export default function ComingSoon() {
  const searchParams = useSearchParams()
  const page = searchParams.get("page") || ""
  const pageName = PAGE_LABELS[page] || page.charAt(0).toUpperCase() + page.slice(1)

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <LibertureLogo size={100} animate={true} className="mx-auto mb-6" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
              Coming Soon
            </span>
          </h1>

          {pageName && (
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground/90">
              {pageName}
            </h2>
          )}

          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            We&apos;re working hard to bring you this page. It will be ready soon &mdash; stay tuned!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <Link href="/">
            <Button className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Bell className="h-4 w-4" />
          <p>Subscribe to our newsletter to be notified when new features launch.</p>
        </motion.div>
      </div>
    </div>
  )
}
