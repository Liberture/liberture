"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, ExternalLink, FileText, BookOpen, Loader2, RefreshCw } from "lucide-react"

// Profile avatar with multiple fallbacks
function ProfileAvatar({ picture, name, pubkey }: { picture?: string; name?: string; pubkey: string }) {
  const [imgError, setImgError] = useState(false)
  const [useRobohash, setUseRobohash] = useState(false)
  
  const initial = name?.charAt(0).toUpperCase() || "N"
  const robohashUrl = `https://robohash.org/${pubkey}?set=set4&size=128x128`
  
  // Reset error state when picture changes
  useEffect(() => {
    setImgError(false)
    setUseRobohash(false)
  }, [picture])

  if (!picture || imgError) {
    if (useRobohash || !picture) {
      return (
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
          <img
            src={robohashUrl}
            alt={name || "Profile"}
            className="h-full w-full rounded-full object-cover"
            onError={() => {
              // Final fallback to initial
            }}
          />
        </div>
      )
    }
    return (
      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold shrink-0">
        {initial}
      </div>
    )
  }

  return (
    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
      <img
        src={picture}
        alt={name || "Profile"}
        className="h-full w-full rounded-full object-cover"
        onError={() => {
          setImgError(true)
          setUseRobohash(true)
        }}
      />
    </div>
  )
}

type ContentItem = {
  id: string
  title: string
  type: "protocol" | "article"
  pillar: string
  published: boolean
  slug: string
}

type NostrProfile = {
  name?: string
  about?: string
  picture?: string
  nip05?: string
}

export function NostrProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<NostrProfile | null>(null)
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Fetch user's published content
  const loadContent = async () => {
    if (!user?.nostrPubkey) return

    try {
      const res = await fetch(`/api/dashboard/my-content`)
      if (res.ok) {
        const data = await res.json()
        setContent(data.content || [])
      }
    } catch (error) {
      console.error("Failed to load content:", error)
    }
  }

  // Fetch profile from server-side API route (purplepag.es + primal fallback)
  const loadProfile = async () => {
    if (!user?.nostrPubkey) return

    setProfileLoading(true)
    try {
      const res = await fetch(`/api/nostr-profile/${user.nostrPubkey}`)
      if (res.ok) {
        const data = await res.json()
        if (data.profile) {
          setProfile(data.profile)
          setProfileLoading(false)
          return
        }
      }
    } catch (e) {
      console.error("Failed to load profile", e)
    }
    // Fallback: show truncated pubkey with no name
    setProfile({ name: undefined })
    setProfileLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadProfile(), loadContent()])
      setLoading(false)
    }
    init()
  }, [user?.nostrPubkey])

  if (!user?.nostrPubkey) {
    return (
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-500" />
          <h3 className="text-lg font-semibold mb-2">No Nostr Identity</h3>
          <p className="text-gray-400 text-sm">
            Your account isn't connected to a Nostr pubkey. Sign in with Nostr to see your profile.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  const truncatePubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              My Nostr Profile
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadProfile}
              disabled={profileLoading}
              className="gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${profileLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Info */}
          <div className="flex items-start gap-4">
            <ProfileAvatar 
              picture={profile?.picture} 
              name={profile?.name} 
              pubkey={user.nostrPubkey} 
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">
                {profile?.name || "Anonymous"}
              </h3>
              {profile?.nip05 && (
                <p className="text-sm text-purple-400">{profile.nip05}</p>
              )}
              <p className="text-sm text-gray-400 font-mono truncate mt-1">
                {truncatePubkey(user.nostrPubkey)}
              </p>
            </div>
          </div>

          {/* About */}
          {profile?.about && (
            <p className="text-sm text-gray-300">{profile.about}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <a
              href="https://primal.net/settings"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1">
                Edit on Primal
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
            <a
              href="https://snort.social/settings"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1">
                Edit on Snort
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Published Content */}
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            My Content on Liberture
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">You haven't published any content yet.</p>
              <p className="text-gray-500 text-sm mt-1">
                Become a contributor to start publishing protocols and articles.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {content.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      <span className="text-xs text-gray-500">{item.pillar}</span>
                      {item.published ? (
                        <Badge className="text-xs bg-green-500/20 text-green-400">
                          Published
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-yellow-500/20 text-yellow-400">
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    title="Coming soon"
                    className="opacity-50"
                  >
                    Update
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
