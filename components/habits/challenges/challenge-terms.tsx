"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/habits/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "./common"

const topics = ["run", "walk", "read", "cook", "focus"] as const
type TermsField = "title" | "rules"

function normalize(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
}

export function ChallengeTerms({days}: {days: number}) {
  const t = useTranslations("challenges")
  const ideas = topics.map(topic => ({
    topic,
    title: t("goalDuration", {goal:t(`ideas.${topic}.title`), days: days || 14}),
    alternate: t(`ideas.${topic}.alternate`),
    rules: t(`ideas.${topic}.rules`),
    keywords: t(`ideas.${topic}.keywords`),
  }))
  const [title, setTitle] = useState("")
  const [rules, setRules] = useState("")
  const [open, setOpen] = useState<TermsField | null>(null)
  const [chosen, setChosen] = useState<typeof topics[number] | null>(null)
  const paired = ideas.find(idea => idea.topic === chosen)

  function suggestions(field: TermsField) {
    if (open !== field) return null
    const value = field === "title" ? title : rules
    const query = normalize(value.trim())
    const matches = field === "title"
      ? ideas.filter(idea => normalize(idea.title + " " + idea.keywords).includes(query) || paired?.topic === idea.topic)
          .map(idea => ({text: idea.title, topic: idea.topic}))
      : paired ? [paired.rules, paired.alternate].filter(text => normalize(text).includes(query) || value === paired.rules || value === paired.alternate)
          .map(text => ({text, topic: paired.topic})) : []
    if (!matches.length) return null
    return <PopoverContent side="top" align="start" collisionPadding={8}
      aria-label={t(field === "title" ? "challengeName" : "rules")}
      className="grid max-h-52 w-[var(--radix-popover-trigger-width)] gap-1 overflow-y-auto p-1"
      onOpenAutoFocus={event => event.preventDefault()} onCloseAutoFocus={event => event.preventDefault()}>

      {matches.map(idea => <Button key={idea.text} variant="ghost" size="sm" type="button"
        className="h-auto justify-start whitespace-normal px-2 py-1 text-left text-xs text-muted-foreground"
        onMouseDown={event => event.preventDefault()}
        onClick={() => {
          if (field === "title") {
            setChosen(idea.topic)
            setTitle(idea.text)
            if (paired && (paired.rules === rules || paired.alternate === rules)) setRules("")
          } else {
            setRules(idea.text)
          }
          setOpen(null)
        }}>
        {idea.text}
      </Button>)}
    </PopoverContent>
  }

  function close(field: TermsField) {
    setOpen(current => current === field ? null : current)
  }

  return <div className="min-w-0 space-y-4">
    <Popover open={open === "title"} onOpenChange={visible => { if (!visible) close("title") }}>
      <PopoverAnchor asChild><div>
        <Field name="title" label={t("challengeName")} placeholder={t("example")} maxLength={100}
          autoComplete="off" required value={paired?.title ?? title} onFocus={() => setOpen("title")}
          onClick={() => setOpen("title")} onChange={event => { setTitle(event.target.value); setChosen(null); if (paired && [paired.rules, paired.alternate].includes(rules)) setRules(""); setOpen("title") }} />
      </div></PopoverAnchor>
      {suggestions("title")}
    </Popover>
    <Popover open={open === "rules"} onOpenChange={visible => { if (!visible) close("rules") }}>
      <PopoverAnchor asChild>
        <label className="grid gap-1.5 text-sm font-medium">
          {t("rules")}
          <Textarea name="rules" placeholder={t("rulesHint")} maxLength={1500} required value={rules}
            onFocus={() => setOpen("rules")} onClick={() => setOpen("rules")}
            onChange={event => { setRules(event.target.value); setOpen("rules") }} />
        </label>
      </PopoverAnchor>
      {suggestions("rules")}
    </Popover>
  </div>
}
