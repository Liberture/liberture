'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Key, MessageSquare, Check, AlertCircle, Zap, ExternalLink } from 'lucide-react'

export default function CollaboratePage() {
  const [formData, setFormData] = useState({
    npub: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [responseMessage, setResponseMessage] = useState('')
  const [libertureNpub, setLibertureNpub] = useState<string | null>(null)

  // Fetch the configured Liberture npub for the DM link
  useEffect(() => {
    fetch('/api/admin/nostr-account')
      .then(res => res.json())
      .then(data => {
        if (data.account?.npub) {
          setLibertureNpub(data.account.npub)
        }
      })
      .catch(() => {
        // Silently fail — DM link just won't be shown
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setResponseMessage('')

    try {
      const res = await fetch('/api/collaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setResponseMessage(data.message || 'Request submitted successfully!')
        setFormData({ npub: '', message: '' })
      } else {
        setStatus('error')
        setResponseMessage(data.error || 'Something went wrong')
      }
    } catch (error) {
      setStatus('error')
      setResponseMessage('Network error. Please try again.')
    }
  }

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-500/20 mb-6">
              <Zap className="h-8 w-8 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Become a Liberture Contributor
            </h1>
            <p className="text-xl text-slate-300">
              Join our network of biohacking knowledge curators. Publish protocols, 
              articles, and research to help others optimize their biology.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid gap-4 mb-12">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Publish with Your Nostr Identity</h3>
                <p className="text-sm text-slate-400">
                  Your content is signed with your Nostr keys and attributed to you permanently.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Check className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Web of Trust Scoring</h3>
                <p className="text-sm text-slate-400">
                  Your content is weighted by your reputation in the Nostr network.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Check className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Censorship Resistant</h3>
                <p className="text-sm text-slate-400">
                  Content is published as Nostr events — it lives beyond any single platform.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="npub" className="text-sm font-medium text-slate-300">
                Your Nostr Public Key (npub)
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="npub"
                  type="text"
                  placeholder="npub1..."
                  value={formData.npub}
                  onChange={(e) => setFormData({ ...formData, npub: e.target.value })}
                  required
                  disabled={status === 'loading'}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 font-mono"
                />
              </div>
              <p className="text-xs text-slate-500">
                Don't have one?{' '}
                <a
                  href="https://nosta.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:underline"
                >
                  Create a Nostr identity
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-slate-300">
                Why do you want to contribute?{' '}
                <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Textarea
                  id="message"
                  placeholder="Tell us about your background, expertise, or what you'd like to contribute..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  disabled={status === 'loading'}
                  rows={4}
                  maxLength={500}
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                />
              </div>
              <p className="text-xs text-slate-500 text-right">
                {formData.message.length}/500
              </p>
            </div>

            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
            >
              {status === 'loading' ? 'Submitting...' : 'Submit Request'}
            </Button>

            {status === 'success' && (
              <div className="flex items-center gap-2 text-green-400 p-4 rounded-lg bg-green-900/20 border border-green-700/50">
                <Check className="h-5 w-5 flex-shrink-0" />
                <span>{responseMessage}</span>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-400 p-4 rounded-lg bg-red-900/20 border border-red-700/50">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{responseMessage}</span>
              </div>
            )}
          </form>

          {/* Alternative contact — only show if Liberture npub is configured */}
          {libertureNpub && (
            <div className="mt-12 p-6 rounded-2xl border border-slate-700 bg-slate-900/50 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-3 text-purple-400" />
              <h2 className="text-lg font-bold mb-2">Prefer Nostr DMs?</h2>
              <p className="text-slate-400 mb-4">
                Message us directly on Nostr — we'd love to hear from you.
              </p>
              <a
                href={`https://njump.me/${libertureNpub}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 hover:underline"
              >
                Open Liberture on njump.me
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
