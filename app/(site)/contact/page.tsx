'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Mail, User, MessageSquare, Check, AlertCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [responseMessage, setResponseMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setResponseMessage('Thank you! We\'ll get back to you soon.')
        setFormData({ name: '', email: '', subject: '', message: '' })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-slate-300 mb-12">
            Questions about biohacking? Want to contribute to the directory? We'd love to hear from you.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-300">
                Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={status === 'loading'}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={status === 'loading'}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-slate-300">
                Subject
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="subject"
                  type="text"
                  placeholder="What's this about?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  disabled={status === 'loading'}
                  className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-slate-300">
                Message
              </label>
              <Textarea
                id="message"
                placeholder="Tell us more..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                disabled={status === 'loading'}
                rows={6}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
            >
              {status === 'loading' ? 'Sending...' : 'Send Message'}
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

          <div className="mt-12 p-6 rounded-2xl border border-slate-700 bg-slate-900/50">
            <h2 className="text-xl font-bold mb-3">Other Ways to Connect</h2>
            <div className="space-y-2 text-slate-300">
              <p>• Join our directory: Share biohacking resources and protocols</p>
              <p>• Contribute research: Help us verify and expand content</p>
              <p>• Report issues: Found incorrect information? Let us know</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
