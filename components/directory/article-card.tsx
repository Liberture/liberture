import { ArticleTopicTags } from "./article-topic-tags"
import { CoverArtwork } from "@/components/habits/marketplace/protocol-artwork"
import { articleTags } from "@/lib/article-tags"
import Link from "next/link"
import type { Article } from "@prisma/client"
import { Clock, User } from "lucide-react"

export function ArticleCard({ article }: { article: Pick<Article, "slug" | "title" | "description" | "author" | "readTime" | "pillar" | "tags"> }) {
  const tags = articleTags(article.tags);

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-6 transition-all hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/20"
    >
      <CoverArtwork src={`/articles/images/${article.slug}.webp`} height={420} loading="lazy" className="mb-4 rounded-lg" />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <h2 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
          {article.title}
        </h2>

        <p className="text-slate-400 text-sm mb-4 line-clamp-3">
          {article.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {article.author}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.readTime} min
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <ArticleTopicTags topics={[article.pillar, ...tags.slice(0, 2)]} />
        </div>
      </div>
    </Link>
  );
}
