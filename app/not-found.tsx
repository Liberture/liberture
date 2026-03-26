"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, Search, BookOpen, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LibertureLogo } from '@/components/branding/LibertureLogo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <LibertureLogo size={120} animate={true} className="mx-auto mb-6" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-8xl md:text-9xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-green-400 bg-clip-text text-transparent">
              404
            </span>
          </h1>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Page Not Found
          </h2>

          <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto">
            This page doesn't exist in our biological operating system. Perhaps it's been optimized away?
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8"
        >
          <Link href="/">
            <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>

          <Link href="/marketplace">
            <Button variant="outline" className="w-full gap-2">
              <ShoppingBag className="h-4 w-4" />
              Marketplace
            </Button>
          </Link>

          <Link href="/articles">
            <Button variant="outline" className="w-full gap-2">
              <BookOpen className="h-4 w-4" />
              Articles
            </Button>
          </Link>

          <Link href="/directory">
            <Button variant="outline" className="w-full gap-2">
              <Search className="h-4 w-4" />
              Directory
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-sm text-muted-foreground"
        >
          <p>Lost? Try searching or explore our resources.</p>
        </motion.div>
      </div>
    </div>
  )
}
