import { DirectoryLayout } from "@/components/directory/layout"



import { BackLink } from "@/components/seo/back-link"
import { sectionTrail } from "@/components/seo/section-breadcrumbs"
import Link from "next/link";
import { ExternalLink, BookOpen } from "lucide-react";
import { BookSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";

type Book = {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  pillars: string;
  year: number | null;
  pages: number | null;
  isbn: string | null;
  amazonUrl: string | null;
  rating: number | null;
  keyTakeaways: string | null;
  forWho: string | null;
  featured: boolean;
  imageUrl: string | null;
  Person?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export default function BookDetails({ book }: { book: Book }) {
  const keyTakeaways = book.keyTakeaways ? JSON.parse(book.keyTakeaways) : [];
  const pillars = (book.pillars || '').split(',').map(p => p.trim()).filter(Boolean);

  return (
    <DirectoryLayout>
      {/* JSON-LD Schema */}
      <BookSchema
        title={book.title}
        author={book.Person?.name || book.author}
        authorUrl={book.Person && `https://liberture.com/people/${book.Person.slug}` || undefined}
        description={book.description}
        isbn={book.isbn || undefined}
        url={`https://liberture.com/books/${book.slug}`}
        image={book.imageUrl || undefined}
      />
      <BreadcrumbSchema items={[...sectionTrail("books"), {name:book.title, url:`https://liberture.com/books/${book.slug}`}]} />
      
      <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <BackLink fallback="/books" />
          </div>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start gap-2 mb-2">
              <BookOpen className="w-8 h-8 text-purple-400 mt-1" />
              <div>
                <h1 className="text-5xl font-bold mb-2">{book.title}</h1>
                <p className="text-2xl text-purple-400">
                  by{' '}
                  {book.Person ? (
                    <Link 
                      href={`/people/${book.Person.slug}`}
                      className="hover:text-purple-300 underline decoration-purple-400/30 hover:decoration-purple-300 transition-colors"
                    >
                      {book.Person.name}
                    </Link>
                  ) : (
                    book.author
                  )}
                </p>
              </div>
            </div>
            
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-slate-400">
              {book.year && <span>{book.year}</span>}
              {book.pages && <span>{book.pages} pages</span>}
              {book.rating && (
                <span className="flex items-center gap-1">
                  ⭐ {book.rating}/5
                </span>
              )}
            </div>

            {/* Links */}
            {book.amazonUrl && (
              <div className="mt-4">
                <a
                  href={book.amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Amazon
                </a>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h2 className="text-2xl font-bold mb-4">About This Book</h2>
                <p className="text-slate-300 text-lg leading-relaxed">{book.description}</p>
              </div>

              {/* Key Takeaways */}
              {keyTakeaways.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h2 className="text-2xl font-bold mb-4">Key Takeaways</h2>
                  <ul className="space-y-3">
                    {keyTakeaways.map((takeaway: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1">•</span>
                        <span className="text-slate-300">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* For Who */}
              {book.forWho && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h2 className="text-2xl font-bold mb-4">Who Should Read This</h2>
                  <p className="text-slate-300">{book.forWho}</p>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Pillars */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h3 className="text-xl font-bold mb-4">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {pillars.map((pillar, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium border border-purple-500/30"
                    >
                      {pillar}
                    </span>
                  ))}
                </div>
              </div>

              {/* ISBN */}
              {book.isbn && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h3 className="text-xl font-bold mb-3">ISBN</h3>
                  <p className="text-slate-300 font-mono text-sm">{book.isbn}</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </DirectoryLayout>
  );
}
