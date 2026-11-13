import { localizeProtocolDuration } from "@/lib/constants/protocol-durations"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getLocale } from "next-intl/server"
import type { Locale } from "@/lib/translations"

type Shape = Record<string, unknown>
const isObject = (value: unknown): value is Shape => !!value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)
const models = new Map(Prisma.dmmf.datamodel.models.map(model => [model.name as string, model]))

// Keep the query's public shape. Add the translation column to projections,
// including selected books, protocols and profiles nested in relations.
function selectTranslations(modelName: string, args: Shape): Shape {
  const model = models.get(modelName)
  const selection = args.select ?? args.include
  if (!model || !isObject(selection)) return args
  const fields = { ...selection }
  if (args.select && model.fields.some(field => field.name === "localized")) fields.localized = true
  for (const field of model.fields) {
    const nested = fields[field.name]
    if (field.kind === "object" && isObject(nested)) fields[field.name] = selectTranslations(field.type, nested)
  }
  return { ...args, [args.select ? "select" : "include"]: fields }
}

function overlay(value: unknown, locale: Locale): unknown {
  if (Array.isArray(value)) return value.map(row => overlay(row, locale))
  if (!isObject(value)) return value
  const { localized, ...row } = value
  const translated = isObject(localized) ? localized[locale] : null
  for (const [field, original] of Object.entries(row)) {
    // Internal links, asset paths and relationships use the permanent record slug.
    if (field !== "slug" && isObject(translated) && typeof original === "string" && typeof translated[field] === "string") {
      row[field] = translated[field]
    } else if (field === "duration" && typeof original === "string") {
      row[field] = localizeProtocolDuration(original, locale)
    } else if (Array.isArray(original) || isObject(original)) {
      row[field] = overlay(original, locale)
    }
  }
  return row
}

function clientFor(getLocale: () => Promise<Locale>) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!operation.startsWith("find")) return query(args)
          const locale = await getLocale()
          const projected = locale === "es" ? selectTranslations(model, args as Shape) : args
          return overlay(await query(projected as typeof args), locale)
        },
      },
    },
  })
}

export const directoryPrisma = clientFor(getLocale)
const english = clientFor(async () => "en")
const spanish = clientFor(async () => "es")

export function directoryClientForLocale(locale: Locale) {
  return locale === "es" ? spanish : english
}

export function directoryApiClient(request: Request) {
  return directoryClientForLocale(new URL(request.url).searchParams.get("lang") === "es" ? "es" : "en")
}
