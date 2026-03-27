"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Save
} from "lucide-react"

type ContentType = "article" | "protocol" | "book" | "person"

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
  const [isAdmin, setIsAdmin] = useState(false)
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
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setIsAdmin(data.user?.isAdmin === true)
      }
    } catch (error) {
      console.error("Failed to check admin status:", error)
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

  const handleSubmit = async () => {
    if (!selectedType || !title || !description || !pillar) return

    setSubmitting(true)
    setSuccess(false)

    try {
      const customTags = tags.split(",").map(t => t.trim()).filter(Boolean)

      let payload: any = {
        type: selectedType,
        title,
        description,
        pillar,
        tags: customTags,
      }

      if (selectedType === "article") {
        payload = { ...payload, content, readTime: parseInt(readTime) || 5 }
      } else if (selectedType === "protocol") {
        payload = { ...payload, difficulty, duration, steps, benefits }
      } else if (selectedType === "book") {
        payload = { ...payload, author, year: year ? parseInt(year) : null }
      } else if (selectedType === "person") {
        payload = { ...payload, title: personTitle, expertise, website }
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
        alert(data.error || "Failed to create content")
      }
    } catch (error: any) {
      console.error("Failed to submit:", error)
      alert(error.message || "Failed to create content")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-gray-800/70 border-gray-700 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
        </CardContent>
      </Card>
    )
  }

  if (!isAdmin) {
    return null
  }

  // Success state
  if (success) {
    return (
      <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-700/50 backdrop-blur-sm rounded-2xl">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-green-300">Content Saved!</h3>
          <p className="text-sm text-gray-400 mt-1">Your content has been added to the database</p>
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
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save to Database
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
