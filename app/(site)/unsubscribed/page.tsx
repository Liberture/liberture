"use client"

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { LandingSection } from '../(landing)/landing-section'
import { Button } from '@/components/ui/button'

function UnsubscribedContent() {
  const searchParams = useSearchParams()
  const type = searchParams?.get('type') || 'all'

  const getMessage = () => {
    switch (type) {
      case 'marketing':
        return 'You have been unsubscribed from marketing emails.'
      case 'digest':
        return 'You have been unsubscribed from weekly digest emails.'
      case 'all':
      default:
        return 'You have been unsubscribed from all Liberture emails.'
    }
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-6">
        Unsubscribed Successfully
      </h1>
      
      <p className="text-xl text-muted-foreground mb-8">
        {getMessage()}
      </p>

      <div className="p-6 rounded-2xl bg-card border border-border/50 mb-8">
        <h2 className="text-lg font-semibold mb-4">
          Changed your mind?
        </h2>
        <p className="text-muted-foreground mb-6">
          You can always manage your email preferences from your dashboard settings.
        </p>
        <Link href="/dashboard/settings">
          <Button className="bg-primary hover:bg-primary/90">
            Update Email Preferences
          </Button>
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          Return to homepage
        </Link>
      </p>
    </div>
  )
}

export default function UnsubscribedPage() {
  return (
    <main className="min-h-screen pt-32 pb-16">
      <LandingSection>
        <Suspense fallback={
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Unsubscribed Successfully
            </h1>
          </div>
        }>
          <UnsubscribedContent />
        </Suspense>
      </LandingSection>
    </main>
  )
}
