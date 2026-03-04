"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import "@/types/nostr"
import { 
  PenLine, 
  FileText, 
  FlaskConical, 
  BookOpen,
  Users,
  X,
  Loader2,
  Check,
  Sparkles,
  ChevronRight,
  Clock,
  Tag,
  Zap
} from "lucide-react"

// Nostr event kinds
const KIND_LONG_FORM = 30023 // NIP-23 long-form content

// Relays to publish to
const PUBLISH_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band", 
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://purplepag.es",
]

type ContentType = "article" | "protocol" | "book" | "person" | "organization"

type CollaborationStatus = {
  isCollaborator: boolean
  isAdmin: boolean
}

const PILLARS = [
  { id: "sleep", label: "Sleep", color: "bg-indigo-500" },
  { id: "nutrition", label: "Nutrition", color: "bg-green-500" },
  { id: "exercise", label: "Exercise", color: "bg-orange-500" },
  { id: "mind", label: "Mind", color: "bg-purple-500" },
  { id: "work", label: "Work", color: "bg-blue-500" },
  { id: "finance", label: "Finance", color: "bg-emerald-500" },
]

const CONTENT_TYPES = [
  { 
    id: "article" as ContentType, 
    label: "Article", 
    icon: FileText, 
    description: "Long-form knowledge content",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    id: "protocol" as ContentType, 
    label: "Protocol", 
    icon: FlaskConical, 
    description: "Step-by-step health protocol",
    color: "from-purple-500 to-pink-500"
  },
  { 
    id: "book" as ContentType, 
    label: "Book", 
    icon: BookOpen, 
    description: "Book recommendation",
    color: "from-amber-500 to-orange-500"
  },
  { 
    id: "person" as ContentType, 
    label: "Person", 
    icon: Users, 
    description: "Notable health figure",
    color: "from-green-500 to-emerald-500"
  },
]

export function CreatorStudio() {
  const { user } = useAuth()
  const [status, setStatus] = useState<CollaborationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<ContentType | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [pillar, setPillar] = useState("")
  const [tags, setTags] = useState("")
  const [readTime, setReadTime] = useState("5")

  // Protocol-specific
  const [difficulty, setDifficulty] = useState("beginner")
  const [duration, setDuration] = useState("")
  const [steps, setSteps] = useState("")
  const [benefits, setBenefits] = useState("")

  // Book-specific
  const [author, setAuthor] = useState("")
  const [year, setYear] = useState("")

  // Person-specific
  const [personTitle, setPersonTitle] = useState("")
  const [expertise, setExpertise] = useState("")
  const [website, setWebsite] = useState("")

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/collaborate/status")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error("Failed to check status:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setContent("")
    setPillar("")
    setTags("")
    setReadTime("5")
    setDifficulty("beginner")
    setDuration("")
    setSteps("")
    setBenefits("")
    setAuthor("")
    setYear("")
    setPersonTitle("")
    setExpertise("")
    setWebsite("")
  }

  // Publish event to relays
  const publishToRelays = async (signedEvent: any): Promise<string[]> => {
    const publishedTo: string[] = []
    
    await Promise.allSettled(
      PUBLISH_RELAYS.map(async (url) => {
        try {
          const ws = new WebSocket(url)
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              ws.close()
              reject(new Error("Timeout"))
            }, 10000)
            
            ws.onopen = () => {
              ws.send(JSON.stringify(["EVENT", signedEvent]))
            }
            
            ws.onmessage = (msg) => {
              try {
                const data = JSON.parse(msg.data)
                if (data[0] === "OK" && data[1] === signedEvent.id) {
                  clearTimeout(timeout)
                  publishedTo.push(url)
                  ws.close()
                  resolve()
                }
              } catch {}
            }
            
            ws.onerror = () => {
              clearTimeout(timeout)
              ws.close()
              reject(new Error("WebSocket error"))
            }
          })
        } catch (e) {
          console.warn(`Failed to publish to ${url}:`, e)
        }
      })
    )
    
    return publishedTo
  }

  // Create slug from title
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  const handleSubmit = async () => {
    if (!selectedType || !title || !description || !pillar) return

    // Check for Nostr extension
    if (!window.nostr) {
      alert("Please install a Nostr extension (like Alby or nos2x) to sign and publish content.")
      return
    }

    setSubmitting(true)
    setSuccess(false)

    try {
      // Get user's pubkey
      const pubkey = await window.nostr.getPublicKey()
      
      // Create the slug
      const slug = slugify(title)
      
      // Build tags array for the event
      const eventTags: string[][] = [
        ["d", slug], // Addressable identifier
        ["title", title],
        ["summary", description],
        ["t", pillar], // Pillar as tag
      ]
      
      // Add custom tags
      const customTags = tags.split(",").map(t => t.trim()).filter(Boolean)
      customTags.forEach(tag => {
        eventTags.push(["t", tag])
      })
      
      // Build content based on type
      let eventContent = ""
      let eventKind = KIND_LONG_FORM
      
      if (selectedType === "article") {
        eventContent = content || description
        eventTags.push(["published_at", Math.floor(Date.now() / 1000).toString()])
        if (readTime) eventTags.push(["read_time", readTime])
      } else if (selectedType === "protocol") {
        eventContent = `# ${title}\n\n${description}\n\n## Difficulty\n${difficulty}\n\n## Duration\n${duration || "Varies"}\n\n## Steps\n${steps}\n\n## Benefits\n${benefits}`
        eventTags.push(["type", "protocol"])
        eventTags.push(["difficulty", difficulty])
        if (duration) eventTags.push(["duration", duration])
      } else if (selectedType === "book") {
        eventContent = `# ${title}\n\nBy ${author || "Unknown"}\n\n${description}`
        eventTags.push(["type", "book"])
        if (author) eventTags.push(["author", author])
        if (year) eventTags.push(["year", year])
      } else if (selectedType === "person") {
        eventContent = `# ${title}\n\n${personTitle ? `**${personTitle}**\n\n` : ""}${description}\n\n${expertise ? `## Expertise\n${expertise}` : ""}`
        eventTags.push(["type", "person"])
        if (personTitle) eventTags.push(["role", personTitle])
        if (expertise) eventTags.push(["expertise", expertise])
        if (website) eventTags.push(["website", website])
      }

      // Create unsigned event
      const unsignedEvent = {
        kind: eventKind,
        created_at: Math.floor(Date.now() / 1000),
        tags: eventTags,
        content: eventContent,
      }

      // Sign with extension
      const signedEvent = await window.nostr.signEvent(unsignedEvent)
      
      // Publish to relays
      const publishedTo = await publishToRelays(signedEvent)
      
      if (publishedTo.length === 0) {
        throw new Error("Failed to publish to any relay")
      }

      // Save to database with event info
      const baseData = {
        type: selectedType,
        title,
        description,
        pillar,
        tags: customTags,
        nostrEventId: signedEvent.id,
        nostrDTag: slug,
        publishedRelays: publishedTo,
      }

      let payload: any = baseData

      if (selectedType === "article") {
        payload = {
          ...baseData,
          content,
          readTime: parseInt(readTime) || 5,
        }
      } else if (selectedType === "protocol") {
        payload = {
          ...baseData,
          difficulty,
          duration,
          steps,
          benefits,
        }
      } else if (selectedType === "book") {
        payload = {
          ...baseData,
          author,
          year: year ? parseInt(year) : null,
        }
      } else if (selectedType === "person") {
        payload = {
          ...baseData,
          title: personTitle,
          expertise,
          website,
        }
      }

      const res = await fetch("/api/dashboard/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSuccess(true)
        resetForm()
        setTimeout(() => {
          setSelectedType(null)
          setSuccess(false)
        }, 2000)
      } else {
        const data = await res.json()
        // Nostr publish succeeded but DB save failed - warn user
        console.error("DB save failed:", data.error)
        alert(`Published to Nostr ⚡ but failed to save to Liberture database: ${data.error}\n\nYour content is live on Nostr but won't appear on liberture.com until the database issue is fixed.`)
      }
    } catch (error: any) {
      console.error("Failed to submit:", error)
      if (error.message?.includes("User rejected")) {
        alert("Signature cancelled. Content was not published.")
      } else {
        alert(error.message || "Failed to create content")
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Not a collaborator or admin
  if (loading) {
    return (
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
        </CardContent>
      </Card>
    )
  }

  if (!status?.isCollaborator && !status?.isAdmin) {
    return null // Don't show anything if not a collaborator
  }

  // Success state
  if (success) {
    return (
      <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-700/50 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Zap className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-green-300">Published to Nostr! ⚡</h3>
          <p className="text-sm text-gray-400 mt-1">Your content is now live on the network</p>
        </CardContent>
      </Card>
    )
  }

  // Content type selection
  if (!selectedType) {
    return (
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Creator Studio
          </CardTitle>
          <p className="text-sm text-gray-400">Create and publish content to Liberture</p>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="group relative p-4 rounded-xl bg-gray-900/50 border border-gray-700 hover:border-gray-600 transition-all text-left overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <type.icon className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors mb-2" />
                <h4 className="font-medium text-white text-sm">{type.label}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Content creation form
  const typeConfig = CONTENT_TYPES.find(t => t.id === selectedType)!

  return (
    <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <typeConfig.icon className="h-5 w-5 text-primary" />
            New {typeConfig.label}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedType(null)
              resetForm()
            }}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Enter ${typeConfig.label.toLowerCase()} title...`}
            className="bg-gray-900/50 border-gray-600"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Description *</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
            className="bg-gray-900/50 border-gray-600 min-h-[80px] resize-none"
          />
        </div>

        {/* Pillar Selection */}
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Pillar *</label>
          <div className="flex flex-wrap gap-2">
            {PILLARS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPillar(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  pillar === p.id
                    ? `${p.color} text-white`
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type-specific fields */}
        {selectedType === "article" && (
          <>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Content</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content (Markdown supported)..."
                className="bg-gray-900/50 border-gray-600 min-h-[150px] resize-none font-mono text-sm"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Read time (min)
                </label>
                <Input
                  type="number"
                  value={readTime}
                  onChange={(e) => setReadTime(e.target.value)}
                  className="bg-gray-900/50 border-gray-600"
                  min="1"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="sleep, melatonin..."
                  className="bg-gray-900/50 border-gray-600"
                />
              </div>
            </div>
          </>
        )}

        {selectedType === "protocol" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-2 text-sm"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Duration</label>
                <Input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30 days"
                  className="bg-gray-900/50 border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Steps</label>
              <Textarea
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="Describe the protocol steps..."
                className="bg-gray-900/50 border-gray-600 min-h-[100px] resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Benefits</label>
              <Textarea
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="List the benefits..."
                className="bg-gray-900/50 border-gray-600 min-h-[80px] resize-none"
              />
            </div>
          </>
        )}

        {selectedType === "book" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Author *</label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Book author"
                  className="bg-gray-900/50 border-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Year</label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                  className="bg-gray-900/50 border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Tags
              </label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="sleep, science, health..."
                className="bg-gray-900/50 border-gray-600"
              />
            </div>
          </>
        )}

        {selectedType === "person" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Title/Role</label>
                <Input
                  value={personTitle}
                  onChange={(e) => setPersonTitle(e.target.value)}
                  placeholder="e.g., Neuroscientist"
                  className="bg-gray-900/50 border-gray-600"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Website</label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="bg-gray-900/50 border-gray-600"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Expertise</label>
              <Input
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="Sleep science, circadian rhythms..."
                className="bg-gray-900/50 border-gray-600"
              />
            </div>
          </>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !title || !description || !pillar}
          className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Signing & Publishing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Sign & Publish to Nostr
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
