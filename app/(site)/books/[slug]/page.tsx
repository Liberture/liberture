"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, BookOpen } from "lucide-react";

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

export default function BookPage() {
  const params = useParams();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await fetch(`/api/books/${params.slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/404');
            return;
          }
          throw new Error('Failed to fetch book');
        }

        const data = await response.json();
        setBook(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [params.slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-slate-400">{error || 'Book not found'}</p>
          <Link href="/books" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            ← Back to Books
          </Link>
        </div>
      </div>
    );
  }

  const keyTakeaways = book.keyTakeaways ? JSON.parse(book.keyTakeaways) : [];
  const pillars = book.pillars.split(',').map(p => p.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link href="/books" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Books
            </Link>
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
      </div>
    </div>
  );
}
