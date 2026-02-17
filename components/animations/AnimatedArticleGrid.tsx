"use client"

import { motion } from "framer-motion"
import { stagger, transition, hover } from "@/lib/animations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { Article } from "@/types"

interface Props {
  articles: Article[]
  pillar: string
  icon: string
}

export function AnimatedArticleGrid({ articles, pillar, icon }: Props) {
  return (
    <motion.div
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={stagger.container(0.05)}
      initial="initial"
      animate="animate"
    >
      {articles.map((article, index) => {
        const tags = article.tags.split(",").map((t) => t.trim()).filter(Boolean)

        return (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, ...transition.smooth }}
            whileHover={hover.scaleLift}
          >
            <Card className="h-full group hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {icon} {pillar}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {article.readTime} min
                  </div>
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{article.description}</p>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    {tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">+{tags.length - 3}</Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground truncate">{article.author}</span>
                  <div className="flex items-center gap-3">
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title="View source"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <Link href={`/knowledge/${article.slug}`} className="text-xs text-primary hover:underline font-medium">
                      Read
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
