import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Load JSON data
  const knowledgeData = JSON.parse(
    readFileSync(join(__dirname, '../data/knowledge.json'), 'utf-8')
  )
  const marketplaceData = JSON.parse(
    readFileSync(join(__dirname, '../data/marketplace-items.json'), 'utf-8')
  )
  const contentData = JSON.parse(
    readFileSync(join(__dirname, '../data/content.json'), 'utf-8')
  )
  const socialPostsData = JSON.parse(
    readFileSync(join(__dirname, '../data/social-posts.json'), 'utf-8')
  )
  const commentsData = JSON.parse(
    readFileSync(join(__dirname, '../data/platform-comments.json'), 'utf-8')
  )

  // Seed Knowledge Articles
  console.log('📚 Seeding knowledge articles...')
  const articles = knowledgeData.articles || []
  for (const article of articles) {
    const slug = article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const existing = await prisma.knowledgeArticle.findUnique({ where: { slug } })
    if (!existing) {
      await prisma.knowledgeArticle.create({
        data: {
          id: article.id?.toString() || undefined,
          title: article.title,
          slug,
          description: article.description,
          pillar: article.pillar,
          tags: JSON.stringify(article.tags || []),
          author: article.author,
          readTime: article.readTime,
          url: article.url,
          publishedAt: new Date(article.publishedAt),
          updatedAt: new Date(),
        },
      })
    }
  }
  console.log(`✅ Created ${articles.length} knowledge articles`)

  // Seed Marketplace Items
  console.log('🛒 Seeding marketplace items...')
  for (const item of marketplaceData || []) {
    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const existing = await prisma.marketplaceItem.findUnique({ where: { slug } })
    if (!existing) {
      await prisma.marketplaceItem.create({
        data: {
          id: item.id?.toString() || undefined,
          title: item.title,
          slug,
          description: item.description,
          pillar: item.pillar,
          type: item.type,
          author: item.author,
          rating: item.rating,
          reviews: item.reviews,
          price: item.price,
          duration: item.duration,
          color: item.color,
          iconColor: item.iconColor,
          updatedAt: new Date(),
        },
      })
    }
  }
  console.log(`✅ Created ${marketplaceData.length} marketplace items`)

  // Seed Content
  console.log('📝 Seeding content...')
  const contentItems = contentData.items || contentData || []
  for (const content of contentItems) {
    await prisma.content.create({
      data: {
        id: content.id?.toString() || undefined,
        title: content.title,
        description: content.description,
        pillar: content.pillar,
        type: content.type,
        author: JSON.stringify(content.author),
        influencerScore: content.influencerScore,
        rating: content.userRating || content.rating || 0,
        reviews: content.reviewCount || content.reviews || 0,
        price: content.price,
        duration: content.duration,
        tags: JSON.stringify(content.tags || []),
        outcomes: JSON.stringify(content.outcomes || []),
        prerequisites: JSON.stringify(content.prerequisites || []),
        difficulty: content.difficulty || 'Intermediate',
        bioScores: JSON.stringify(content.impactDistribution || content.bioScores || {}),
        lessonCount: content.lessonCount,
        contentUrl: content.contentUrl,
        socialLinks: JSON.stringify(content.socialLinks || {}),
        updates: JSON.stringify(content.updates || []),
        relatedContent: JSON.stringify(content.relatedContent || []),
        updatedAt: new Date(),
      },
    })
  }
  console.log(`✅ Created ${contentItems.length} content items`)

  // Seed Social Posts
  console.log('💬 Seeding social posts...')
  for (const post of socialPostsData || []) {
    await prisma.socialPost.create({
      data: {
        id: post.id?.toString() || undefined,
        author: post.author,
        avatarUrl: post.avatar || post.avatarUrl || '/examples/avatars/default.jpg',
        timeAgo: post.time || post.timeAgo || '1d ago',
        content: post.content,
        likes: post.likes || 0,
        comments: post.comments || 0,
        updatedAt: new Date(),
      },
    })
  }
  console.log(`✅ Created ${socialPostsData.length} social posts`)

  // Seed Platform Comments
  console.log('💭 Seeding platform comments...')
  for (const comment of commentsData || []) {
    await prisma.platformComment.create({
      data: {
        id: comment.id?.toString() || undefined,
        contentId: comment.contentId || '1', // Default to first content item
        author: comment.author,
        avatarUrl: comment.avatar || comment.avatarUrl || '/examples/avatars/default.jpg',
        timeAgo: comment.time || comment.timeAgo || '1d ago',
        comment: comment.content || comment.comment || '',
        helpful: comment.upvotes || comment.helpful || 0,
        replies: comment.replies || 0,
        updatedAt: new Date(),
      },
    })
  }
  console.log(`✅ Created ${commentsData.length} platform comments`)

  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
