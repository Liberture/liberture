import { getTranslations as getUiCopy } from "next-intl/server"
import { getContent } from "@/lib/seo/public-records"
import { detailMetadata } from "@/lib/seo/detail-metadata"
import { BreadcrumbSchema } from "@/components/seo/JsonLd"
import { notFound } from "next/navigation"
import Link from "@/components/i18n/localized-link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Star, Clock, Users } from "lucide-react"
import { PILLAR_STYLES, PILLAR_ICON_MAP, normalizePillarId } from "@/lib/pillars"

type Props = {params: Promise<{id:string}>}
export async function generateMetadata({params}: Props) {
  const {id} = await params
  const content = await getContent(id)
  if (!content) notFound()
  return detailMetadata(`/content/${id}`,content.title,content.description,"website")
}
export default async function ContentPage({params}: Props) {
  const uiCopy = await getUiCopy("publicCopy.content")

  const {id} = await params
  const content = await getContent(id)
  if (!content) notFound()
  const normalizedPillar = normalizePillarId(content.pillar)
  const PillarIcon = PILLAR_ICON_MAP[normalizedPillar]
  const pillarStyle = PILLAR_STYLES[normalizedPillar]

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <BreadcrumbSchema items={[{name:"Liberture",url:"https://liberture.com"},{name:content.title,url:`https://liberture.com/content/${id}`}]} />
      <Link href="/protocols">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />{uiCopy("backToProtocols")}</Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${pillarStyle.background} ${pillarStyle.border} border`}>
              <PillarIcon className={`h-6 w-6 ${pillarStyle.text}`} />
            </div>
            <Badge variant="secondary">{content.type}</Badge>
          </div>
          <h1 className="text-4xl font-bold mb-3">{content.title}</h1>
          <p className="text-lg text-muted-foreground">{content.description}</p>
          
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{content.rating}</span>
              <span className="text-muted-foreground text-sm">({content.reviews} {uiCopy("reviews")}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{content.duration}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">{content.author.name}</span>
            </div>
          </div>
        </div>

        <div className="text-center p-6 rounded-xl bg-card border">
          <div className="text-3xl font-bold mb-2">
            {content.price === 0 ? uiCopy("free") : `$${content.price}`}
          </div>
          <Button size="lg" className="w-full">{uiCopy("getAccess")}</Button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Outcomes */}
          {content.outcomes && content.outcomes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{uiCopy("whatYouLlLearn")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {content.outcomes.map((outcome: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{uiCopy("topicsCovered")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{uiCopy("details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">{uiCopy("difficulty")}</div>
                <div className="font-medium">{content.difficulty}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{uiCopy("duration")}</div>
                <div className="font-medium">{content.duration}</div>
              </div>
              {content.lessonCount && (
                <div>
                  <div className="text-sm text-muted-foreground">{uiCopy("lessons")}</div>
                  <div className="font-medium">{content.lessonCount}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
