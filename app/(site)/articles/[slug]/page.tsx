import { CoverArtwork } from "@/components/habits/marketplace/protocol-artwork"
import Markdown from "react-markdown"
import { profilePillars } from "@/lib/pillars"
import { articleTags } from "@/lib/article-tags"
import { LanguageSwitch } from "@/components/habits/site/language-switch"
import { getRequestLocale } from "@/lib/habits/i18n/server"
import { getDictionary } from "@/lib/habits/i18n"
import { ArticleCard } from "@/components/directory/article-card"
import { CardCarousel } from "@/components/ui/card-carousel"
import { ArticleSearch } from "@/components/directory/article-search"
import { ArticleTopicTags } from "@/components/directory/article-topic-tags"
import { DirectoryLayout } from "@/components/directory/layout"
import { sectionTrail } from "@/components/seo/section-breadcrumbs"
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, ExternalLink, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { ArticleSchema, BreadcrumbSchema } from '@/components/seo/JsonLd'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  let article = null
  try {
    article = await prisma.article.findUnique({
      where: { slug },
      select: { title: true, description: true, author: true },
    })
  } catch {
    // Database unavailable
  }

  if (!article) {
    return { title: 'Article Not Found | Liberture' }
  }

  return {
    title: `${article.title} | Liberture`,
    description: article.description || `Learn about ${article.title} from ${article.author} on Liberture.`,
    openGraph: {
      title: article.title,
      description: article.description || `Learn about ${article.title} from ${article.author}.`,
      url: `https://liberture.com/articles/${slug}`,
      type: 'article',
      images: [{ url: `/articles/images/${slug}.webp`, width: 1200, height: 420 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/articles/images/${slug}.webp`],
      title: article.title,
      description: article.description || `Learn about ${article.title}.`,
    },
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params

  let article: Awaited<ReturnType<typeof prisma.article.findUnique<{ where: { slug: string }; select: { id: true; title: true; description: true; content: true; tags: true; author: true; readTime: true; url: true; publishedAt: true; updatedAt: true; pillar: true } }>>> = null
  try {
    article = await prisma.article.findUnique({
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

  const tags = articleTags(article.tags)
  const [locale, entries, candidates] = await Promise.all([
    getRequestLocale(),
    prisma.article.findMany({ select: { slug: true, title: true, tags: true, pillar: true }, orderBy: { title: "asc" } }),
    prisma.article.findMany({
      where: { slug: { not: slug }, OR: [
        { pillar: article.pillar },
        ...tags.map(tag => ({ tags: { contains: tag, mode: "insensitive" as const } })),
      ] },
      select: { slug: true, title: true, description: true, pillar: true, tags: true, author: true, readTime: true },
      orderBy: [{ publishedAt: "desc" }, { slug: "asc" }],
    }),
  ])
  const categories = [...new Set(entries.flatMap(entry => profilePillars(entry.pillar)))].sort()
  const { articleReader: copy, pillarTag } = getDictionary(locale).app
  const topicSet = new Set(tags.map(tag => tag.toLowerCase()))
  const currentPillar = article.pillar
  const related = candidates.map(candidate => ({
    article: candidate,
    score: Number(candidate.pillar === currentPillar) + articleTags(candidate.tags).filter(tag => topicSet.has(tag.toLowerCase())).length,
  })).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 9)
  const body = article.content?.trim()
  const firstLine = body?.split("\n", 1)[0]
  const markdown = firstLine?.replace(/^#\s+/, "").trim() === article.title && firstLine.startsWith("# ")
    ? body?.slice(firstLine.length).trimStart() : body
  const externalSource = URL.canParse(article.url) ? new URL(article.url) : null
  const showSource = externalSource && ["https:", "http:"].includes(externalSource.protocol)
    && !/(^|\.)liberture\.com$/i.test(externalSource.hostname)
    && !/^liberture(?: team)?$/i.test(article.author.trim())
  const articleUrl = `https://liberture.com/articles/${slug}`

  return (
    <DirectoryLayout>
      <ArticleSchema
        title={article.title}
        description={article.description || ''}
        url={articleUrl}
        publishedAt={article.publishedAt.toISOString()}
        modifiedAt={article.updatedAt?.toISOString()}
        author={article.author || 'Liberture'}
      />
      <BreadcrumbSchema compact items={[...sectionTrail("articles"), {name:article.title, url:articleUrl}]} />

      <div className="mx-auto max-w-6xl">

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <article className="min-w-0">
          <div className="space-y-6 mb-12">
            <div className="flex flex-wrap items-center gap-2">
              <ArticleTopicTags topics={[article.pillar, ...tags.slice(0, 3)]} />
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {article.title}
            </h1>

            {article.description && (
              <p className="text-xl text-muted-foreground">
                {article.description}
              </p>
            )}

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

          <CoverArtwork src={`/articles/images/${slug}.webp`} height={420} loading="eager" className="mb-6 rounded-xl border border-border" />
          <Card className="mb-8">
            <CardContent className="prose prose-lg dark:prose-invert max-w-none p-8">
              {markdown ? (
                <div className="space-y-4 leading-relaxed break-words [&_p]:text-slate-300 [&_h2]:text-slate-50 [&_h3]:text-slate-50 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_a]:text-primary [&_a]:underline [&_pre]:overflow-auto">
                  <Markdown skipHtml>{markdown}</Markdown>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Content not available. Please visit the source article.
                </p>
              )}
            </CardContent>
          </Card>

          {showSource && (
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
                      href={externalSource.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {article.url}
                    </a>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={externalSource.href} target="_blank" rel="noopener noreferrer">
                      Visit Source
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {tags.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-sm">Related Topics</h3>
                <div className="flex flex-wrap gap-2">
                  <ArticleTopicTags topics={tags} />
                </div>
              </CardContent>
            </Card>
          )}
          </article>
          <aside className="space-y-5 rounded-xl border bg-card p-5 lg:sticky lg:top-24">
            <ArticleSearch entries={entries} />
            <div className="flex items-center justify-between"><span className="font-semibold">{copy.language}</span><LanguageSwitch locale={locale} label={copy.language} /></div>
            <nav aria-label={copy.categories}>
              <h2 className="mb-2 font-semibold">{copy.categories}</h2>
              <ul className="flex flex-wrap gap-2">{categories.map((pillar) => (
                <li key={pillar}><Link href={`/articles?pillar=${encodeURIComponent(pillar)}`} className="text-sm capitalize text-primary hover:underline">{pillarTag.pillars[pillar]}</Link></li>
              ))}</ul>
            </nav>
          </aside>
          </div>
          {related.length > 0 && <CardCarousel title={copy.related} previousLabel={copy.previous} nextLabel={copy.next}>
            {related.map(({ article }) => <li key={article.slug} className="[&>a]:block [&>a]:h-full"><ArticleCard article={article} /></li>)}
          </CardCarousel>}
        </div>
    </DirectoryLayout>
  )
}
