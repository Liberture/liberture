"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Send, 
  Check, 
  Clock, 
  XCircle,
  Loader2,
  Sparkles,
  MessageSquare
} from "lucide-react"

type CollaborationStatus = {
  isCollaborator: boolean
  hasPendingRequest: boolean
  hasRejectedRequest: boolean
  requestDate?: string
}

export function CollaborationCard() {
  const { user } = useAuth()
  const [status, setStatus] = useState<CollaborationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (user?.nostrPubkey) {
      checkStatus()
    } else {
      setLoading(false)
    }
  }, [user?.nostrPubkey])

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/collaborate/status")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Failed to check collaboration status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user?.nostrPubkey) return

    setSubmitting(true)
    setSubmitResult(null)

    try {
      const res = await fetch("/api/collaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npub: user.nostrPubkey,
          message: message.trim() || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitResult({ success: true, message: data.message })
        setShowForm(false)
        setMessage("")
        // Refresh status
        checkStatus()
      } else {
        setSubmitResult({ success: false, message: data.error })
      }
    } catch (error) {
      setSubmitResult({ success: false, message: "Failed to submit request. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  // Not logged in with Nostr
  if (!user?.nostrPubkey) {
    return (
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 text-primary/50 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Collaboration</p>
          <p className="text-xs text-gray-600 mt-1">Login with Nostr to request access</p>
        </CardContent>
      </Card>
    )
  }

  // Loading
  if (loading) {
    return (
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
        </CardContent>
      </Card>
    )
  }

  // Already a collaborator
  if (status?.isCollaborator) {
    return (
      <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-700/50 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-green-400" />
            <Badge variant="outline" className="border-green-500/50 text-green-400 bg-green-500/10">
              Collaborator
            </Badge>
          </div>
          <p className="text-sm text-green-300">You're a Liberture Collaborator!</p>
          <p className="text-xs text-gray-400 mt-1">You can create and publish content</p>
        </CardContent>
      </Card>
    )
  }

  // Pending request
  if (status?.hasPendingRequest) {
    return (
      <Card className="bg-gradient-to-br from-yellow-900/30 to-amber-900/20 border-yellow-700/50 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-500/10">
              Pending
            </Badge>
          </div>
          <p className="text-sm text-yellow-300">Request Under Review</p>
          <p className="text-xs text-gray-400 mt-1">We'll review your request soon!</p>
        </CardContent>
      </Card>
    )
  }

  // Rejected request
  if (status?.hasRejectedRequest) {
    return (
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-4 text-center">
          <XCircle className="h-6 w-6 text-red-400/70 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Request Not Approved</p>
          <p className="text-xs text-gray-500 mt-1">Contact us directly to discuss</p>
        </CardContent>
      </Card>
    )
  }

  // Can request collaboration
  return (
    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Become a Collaborator
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {submitResult && (
          <div className={`text-xs p-2 rounded-lg ${
            submitResult.success 
              ? "bg-green-500/10 text-green-400 border border-green-500/20" 
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {submitResult.message}
          </div>
        )}

        {!showForm ? (
          <>
            <p className="text-xs text-gray-400">
              Join our community of contributors and help build the Biological Operating System.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="w-full bg-primary/90 hover:bg-primary text-sm"
              size="sm"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Request Access
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 flex items-center gap-1 mb-1.5">
                <MessageSquare className="h-3 w-3" />
                Message (optional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us why you'd like to collaborate..."
                className="bg-gray-900/50 border-gray-600 text-sm min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/500 — Sent as a Nostr DM if provided
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowForm(false)
                  setMessage("")
                  setSubmitResult(null)
                }}
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                size="sm"
                className="flex-1 bg-primary/90 hover:bg-primary text-xs"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
