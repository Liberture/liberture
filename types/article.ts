export interface Article {
  id: string
  title: string
  description: string
  tags: string
  author: string
  readTime: number
  url: string | null
  slug: string
  pillar?: string
  publishedAt?: string
}

export interface ArticleWithPillar extends Article {
  pillar: string
  publishedAt: string
}

export interface RelatedArticle extends Article {
  pillar: string
  relevanceScore: number
}

export interface PopularArticle extends Omit<Article, 'tags'> {
  pillar: string
  tags: string[]
  publishedAt: string
}
