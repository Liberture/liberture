'use client'

import { NewsletterSignup } from "@/components/newsletter/NewsletterSignup"

export function LandingNewsletter() {
  return (
    <section className="py-20 px-4 bg-card/30">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Stay Updated on Biohacking
        </h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
          Get weekly insights on longevity, human optimization, and the latest biohacking research. 
          Join our community of optimizers.
        </p>
        <div className="flex justify-center">
          <NewsletterSignup />
        </div>
      </div>
    </section>
  )
}
