import spanish from "@/messages/catalog-es.json"
import type { Locale } from "@/lib/translations"
import { CATALOG_PROTOCOLS, STANDALONE_HABITS, type CatalogHabit, type CatalogProtocol } from "./catalog"

const phrases: Readonly<Record<string, string>> = spanish
const translate = (text: string) => phrases[text] ?? text

function translateHabit(habit: CatalogHabit): CatalogHabit {
  const reading = habit.readingContent
  return {
    ...habit,
    name: translate(habit.name),
    why: translate(habit.why),
    readingContent: reading && {
      ...reading,
      prompt: reading.prompt && translate(reading.prompt),
      passages: reading.passages.map(passage => ({
        ...passage, title: passage.title && translate(passage.title),
        body: translate(passage.body), application: passage.application && translate(passage.application),
      })),
    },
  }
}

function translateProtocol(protocol: CatalogProtocol): CatalogProtocol {
  const authorCopy = (author: NonNullable<CatalogProtocol["author"]>) => ({
    ...author, credentials: translate(author.credentials), bio: translate(author.bio),
    name: author.kind === "person" ? author.name : translate(author.name),
  })
  const p = {
    ...protocol,
    name: translate(protocol.name), tagline: translate(protocol.tagline),
    description: translate(protocol.description), why: translate(protocol.why), duration: translate(protocol.duration),
    steps: protocol.steps.map(translate), benefits: protocol.benefits.map(translate),
    risks: protocol.risks.map(translate), equipment: protocol.equipment.map(translate),
    author: protocol.author && authorCopy(protocol.author), coAuthors: protocol.coAuthors.map(authorCopy),
    habits: protocol.habits.map(translateHabit),
    cost: protocol.cost && { ...protocol.cost, note: protocol.cost.note && translate(protocol.cost.note),
      items: protocol.cost.items?.map(item => ({ ...item, label: translate(item.label) })) },
  }
  return { ...p, searchText: [p.name, p.tagline, p.description, p.why, p.creator, ...p.coAuthors.map(a => a.name), ...p.equipment, ...p.habits.map(h => h.name)].join(" ").toLowerCase() }
}

const spanishProtocols = CATALOG_PROTOCOLS.map(translateProtocol)
const spanishHabits = STANDALONE_HABITS.map(translateHabit)

export function catalogProtocols(locale: Locale) {
  return locale === "es" ? spanishProtocols : CATALOG_PROTOCOLS
}

export function standaloneHabits(locale: Locale) {
  return locale === "es" ? spanishHabits : STANDALONE_HABITS
}
