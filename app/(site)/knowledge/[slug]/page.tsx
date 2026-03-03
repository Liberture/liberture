import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, ExternalLink, Calendar, User, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PILLAR_ICON_MAP } from '@/lib/pillars'
import { ArticleSchema, BreadcrumbSchema } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  
  let article = null
  try {
    article = await prisma.knowledgeArticle.findUnique({
      where: { slug },
      select: {
        title: true,
        description: true,
        author: true,
      },
    })
  } catch {
    // Database unavailable
  }

  if (!article) {
    return {
      title: 'Article Not Found | Liberture',
    }
  }

  return {
    title: `${article.title} | Liberture Knowledge`,
    description: article.description || `Learn about ${article.title} from ${article.author} on Liberture.`,
    openGraph: {
      title: article.title,
      description: article.description || `Learn about ${article.title} from ${article.author}.`,
      url: `https://liberture.com/knowledge/${slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description || `Learn about ${article.title}.`,
    },
  }
}

export default async function KnowledgeArticlePage({ params }: PageProps) {
  const { slug } = await params

  let article: Awaited<ReturnType<typeof prisma.knowledgeArticle.findUnique<{ where: { slug: string }; select: { id: true; title: true; description: true; content: true; tags: true; author: true; readTime: true; url: true; publishedAt: true; updatedAt: true; pillar: true } }>>> = null
  try {
    article = await prisma.knowledgeArticle.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        tags: true,
        author: true,
        readTime: true,
        url: true,
        publishedAt: true,
        updatedAt: true,
        pillar: true,
      },
    })
  } catch {
    // Database unavailable
  }

  if (!article) {
    notFound()
  }

  const tags = article.tags.split(',').map(t => t.trim()).filter(Boolean)
  const Icon = article.pillar ? PILLAR_ICON_MAP[article.pillar as keyof typeof PILLAR_ICON_MAP] : null
  const articleUrl = `https://liberture.com/knowledge/${slug}`

  return (
    <div className="min-h-screen py-12">
      {/* JSON-LD Structured Data */}
      <ArticleSchema
        title={article.title}
        description={article.description || ''}
        url={articleUrl}
        publishedAt={article.publishedAt.toISOString()}
        modifiedAt={article.updatedAt?.toISOString()}
        author={article.author || 'Liberture'}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://liberture.com' },
          { name: 'Knowledge', url: 'https://liberture.com/knowledge' },
          { name: article.title, url: articleUrl },
        ]}
      />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href={article.pillar ? `/pillars/${article.pillar}` : '/knowledge'}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {article.pillar ? `${article.pillar} pillar` : 'Knowledge'}
          </Link>

          {/* Article Header */}
          <div className="space-y-6 mb-12">
            {/* Pillar Badge */}
            {article.pillar && Icon && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  <Icon className="h-4 w-4 mr-1" />
                  {article.pillar}
                </Badge>
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {article.title}
            </h1>

            {/* Description */}
            {article.description && (
              <p className="text-xl text-muted-foreground">
                {article.description}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{article.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{article.readTime} min read</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <Card className="mb-8">
            <CardContent className="prose prose-lg dark:prose-invert max-w-none p-8">
              {article.content ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: article.content }}
                  className="whitespace-pre-wrap"
                />
              ) : (
                <p className="text-muted-foreground">
                  Content not available. Please visit the source article.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Source Reference */}
          {article.url && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <ExternalLink className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-sm">Original Source</h3>
                    <p className="text-sm text-muted-foreground">
                      This article was originally published at:
                    </p>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {article.url}
                    </a>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit Source
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags Cloud */}
          {tags.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-sm">Related Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
