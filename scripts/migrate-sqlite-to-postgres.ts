import { PrismaClient as PrismaClientSQLite } from '@prisma/client';
import { PrismaClient as PrismaClientPostgres } from '@prisma/client';
import Database from 'better-sqlite3';

// SQLite connection using better-sqlite3
const sqliteDb = new Database('./prisma/prisma/liberture.db', { readonly: true });

// PostgreSQL connection
const prismaPostgres = new PrismaClientPostgres({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...\n');

  try {
    // Migrate KnowledgeArticle
    console.log('📚 Migrating KnowledgeArticle...');
    const knowledgeArticles = sqliteDb.prepare('SELECT * FROM KnowledgeArticle').all() as any[];
    for (const article of knowledgeArticles) {
      await prismaPostgres.knowledgeArticle.create({
        data: {
          id: article.id,
          title: article.title,
          description: article.description,
          pillar: article.pillar,
          tags: article.tags,
          author: article.author,
          readTime: article.readTime,
          url: article.url,
          publishedAt: new Date(article.publishedAt),
          createdAt: new Date(article.createdAt),
          updatedAt: new Date(article.updatedAt),
        },
      });
    }
    console.log(`  ✅ Migrated ${knowledgeArticles.length} knowledge articles\n`);

    // Migrate MarketplaceItem
    console.log('🛒 Migrating MarketplaceItem...');
    const marketplaceItems = sqliteDb.prepare('SELECT * FROM MarketplaceItem').all() as any[];
    for (const item of marketplaceItems) {
      await prismaPostgres.marketplaceItem.create({
        data: {
          id: item.id,
          title: item.title,
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
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      });
    }
    console.log(`  ✅ Migrated ${marketplaceItems.length} marketplace items\n`);

    // Migrate Content
    console.log('📄 Migrating Content...');
    const contents = sqliteDb.prepare('SELECT * FROM Content').all() as any[];
    for (const content of contents) {
      await prismaPostgres.content.create({
        data: {
          id: content.id,
          title: content.title,
          description: content.description,
          pillar: content.pillar,
          type: content.type,
          author: content.author,
          influencerScore: content.influencerScore,
          rating: content.rating,
          reviews: content.reviews,
          price: content.price,
          duration: content.duration,
          tags: content.tags,
          outcomes: content.outcomes,
          prerequisites: content.prerequisites,
          difficulty: content.difficulty,
          bioScores: content.bioScores,
          lessonCount: content.lessonCount,
          contentUrl: content.contentUrl,
          socialLinks: content.socialLinks,
          updates: content.updates,
          relatedContent: content.relatedContent,
          createdAt: new Date(content.createdAt),
          updatedAt: new Date(content.updatedAt),
        },
      });
    }
    console.log(`  ✅ Migrated ${contents.length} content items\n`);

    // Migrate Users
    console.log('👤 Migrating Users...');
    const users = sqliteDb.prepare('SELECT * FROM User').all() as any[];
    for (const user of users) {
      await prismaPostgres.user.create({
        data: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified === 1,
          name: user.name,
          image: user.image,
          password: user.password,
          bosLevel: user.bosLevel,
          role: user.role,
          banned: user.banned === 1,
          banReason: user.banReason,
          banExpires: user.banExpires ? new Date(user.banExpires) : null,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
    }
    console.log(`  ✅ Migrated ${users.length} users\n`);

    // Migrate Person
    console.log('🧑 Migrating People...');
    const people = sqliteDb.prepare('SELECT * FROM Person').all() as any[];
    for (const person of people) {
      await prismaPostgres.person.create({
        data: {
          id: person.id,
          slug: person.slug,
          name: person.name,
          title: person.title,
          bio: person.bio,
          pillars: person.pillars,
          expertise: person.expertise,
          followers: person.followers,
          website: person.website,
          twitter: person.twitter,
          instagram: person.instagram,
          youtube: person.youtube,
          podcast: person.podcast,
          imageUrl: person.imageUrl,
          achievements: person.achievements,
          publications: person.publications,
          protocols: person.protocols,
          featured: person.featured === 1,
          createdAt: new Date(person.createdAt),
          updatedAt: new Date(person.updatedAt),
        },
      });
    }
    console.log(`  ✅ Migrated ${people.length} people\n`);

    // Migrate Organization
    console.log('🏢 Migrating Organizations...');
    const organizations = sqliteDb.prepare('SELECT * FROM Organization').all() as any[];
    for (const org of organizations) {
      await prismaPostgres.organization.create({
        data: {
          id: org.id,
          slug: org.slug,
          name: org.name,
          description: org.description,
          pillars: org.pillars,
          type: org.type,
          founded: org.founded,
          website: org.website,
          resources: org.resources,
          keyPeople: org.keyPeople,
          featured: org.featured === 1,
          imageUrl: org.imageUrl,
          createdAt: new Date(org.createdAt),
          updatedAt: new Date(org.updatedAt),
        },
      });
    }
    console.log(`  ✅ Migrated ${organizations.length} organizations\n`);

    // Migrate Protocol
    console.log('📋 Migrating Protocols...');
    const protocols = sqliteDb.prepare('SELECT * FROM Protocol').all() as any[];
    for (const protocol of protocols) {
      await prismaPostgres.protocol.create({
        data: {
          id: protocol.id,
          slug: protocol.slug,
          name: protocol.name,
          description: protocol.description,
          pillar: protocol.pillar,
          creator: protocol.creator,
          duration: protocol.duration,
          difficulty: protocol.difficulty,
          steps: protocol.steps,
          benefits: protocol.benefits,
          risks: protocol.risks,
          equipment: protocol.equipment,
          references: protocol.references,
          featured: protocol.featured === 1,
          createdAt: new Date(protocol.createdAt),
          updatedAt: new Date(protocol.updatedAt),
        },
      });
    }
    console.log(`  ✅ Migrated ${protocols.length} protocols\n`);

    // Migrate Book
    console.log('📖 Migrating Books...');
    const books = sqliteDb.prepare('SELECT * FROM Book').all() as any[];
    for (const book of books) {
      await prismaPostgres.book.create({
        data: {
          id: book.id,
          slug: book.slug,
          title: book.title,
          author: book.author,
          description: book.description,
          pillars: book.pillars,
          year: book.year,
          pages: book.pages,
          isbn: book.isbn,
          amazonUrl: book.amazonUrl,
          rating: book.rating,
          keyTakeaways: book.keyTakeaways,
          forWho: book.forWho,
          featured: book.featured === 1,
          imageUrl: book.imageUrl,
          createdAt: new Date(book.createdAt),
          updatedAt: new Date(book.updatedAt),
        },
      });
    }
    console.log(`  ✅ Migrated ${books.length} books\n`);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prismaPostgres.$disconnect();
    sqliteDb.close();
  }
}

migrateData();
