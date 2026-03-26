"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Twitter, Instagram, Youtube, Mic, BookOpen, MessageSquare, Zap } from "lucide-react";
import { PersonSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";

type Book = {
  id: string;
  slug: string;
  title: string;
  description: string;
  year: number | null;
  pages: number | null;
  rating: number | null;
  amazonUrl: string | null;
  imageUrl: string | null;
  pillars: string;
};

type Protocol = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pillar: string;
  difficulty: string;
  duration: string | null;
  featured: boolean;
};

type Person = {
  id: string;
  slug: string;
  name: string;
  title: string;
  bio: string;
  pillars: string;
  expertise: string;
  followers: string | null;
  website: string | null;
  wikipedia: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  podcast: string | null;
  imageUrl: string | null;
  achievements: string | null;
  publications: string | null;
  speakingEvents: string | null;
  protocols: string | null;
  featured: boolean;
  Book?: Book[];
  Protocol?: Protocol[];
};

export default function PersonPage() {
  const params = useParams();
  const router = useRouter();
  
  const handleBack = () => {
    router.back();
  };
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const response = await fetch(`/api/people/${params.slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/404');
            return;
          }
          throw new Error('Failed to fetch person');
        }

        const data = await response.json();
        setPerson(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
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

  if (error || !person) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-slate-400">{error || 'Person not found'}</p>
          <Link href="/directory" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            ← Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const achievements = person.achievements ? JSON.parse(person.achievements) : [];
  const publications = person.publications ? JSON.parse(person.publications) : [];
  const speakingEvents = person.speakingEvents ? JSON.parse(person.speakingEvents) : [];
  const pillars = (person.pillars || '').split(',').map(p => p.trim()).filter(Boolean);

  return (
    <>
      <PersonSchema
        name={person.name}
        title={person.title}
        bio={person.bio}
        url={`https://liberture.com/people/${person.slug}`}
        website={person.website || undefined}
        twitter={person.twitter || undefined}
        image={person.imageUrl || undefined}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://liberture.com' },
          { name: 'Directory', url: 'https://liberture.com/directory' },
          { name: 'People', url: 'https://liberture.com/people' },
          { name: person.name, url: `https://liberture.com/people/${person.slug}` },
        ]}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
        <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <button onClick={handleBack} className="text-purple-400 hover:text-purple-300 mb-4 inline-block cursor-pointer">
              ← Back
            </button>
          </div>
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-2">{person.name}</h1>
            <p className="text-2xl text-purple-400 mb-4">{person.title}</p>
            
            {/* Social Links */}
            <div className="flex flex-wrap items-center gap-4">
              {person.wikipedia && (
                <a 
                  href={person.wikipedia} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Wikipedia</span>
                </a>
              )}
              {person.website && (
                <a 
                  href={person.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <Globe className="w-5 h-5" />
                  <span>Website</span>
                </a>
              )}
              {person.twitter && (
                <a 
                  href={`https://twitter.com/${person.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                  <span>@{person.twitter}</span>
                </a>
              )}
              {person.instagram && (
                <a 
                  href={`https://instagram.com/${person.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                  <span>@{person.instagram}</span>
                </a>
              )}
              {person.youtube && (
                <a 
                  href={`https://youtube.com/${person.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <Youtube className="w-5 h-5" />
                  <span>YouTube</span>
                </a>
              )}
              {person.podcast && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Mic className="w-5 h-5" />
                  <span>{person.podcast}</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="md:col-span-2 space-y-6">
              {/* Bio */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p className="text-slate-300 text-lg leading-relaxed">{person.bio}</p>
              </div>

              {/* Achievements */}
              {achievements.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h2 className="text-2xl font-bold mb-4">Key Achievements</h2>
                  <ul className="space-y-3">
                    {achievements.map((achievement: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1">•</span>
                        <span className="text-slate-300">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Publications */}
              {publications.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-green-400" />
                    Publications & Research
                  </h2>
                  <ul className="space-y-3">
                    {publications.map((pub: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-green-400 mt-1">→</span>
                        <span className="text-slate-300">{pub}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Speaking Events */}
              {speakingEvents.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-cyan-400" />
                    Speaking & Appearances
                  </h2>
                  <ul className="space-y-3">
                    {speakingEvents.map((event: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1">→</span>
                        <span className="text-slate-300">{event}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Protocols */}
              {person.Protocol && person.Protocol.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-green-400" />
                    Protocols by {person.name}
                  </h2>
                  <div className="space-y-4">
                    {person.Protocol.map((protocol: Protocol) => (
                      <Link
                        key={protocol.id}
                        href={`/protocols/${protocol.slug}`}
                        className="block p-4 rounded-lg border border-slate-700 hover:border-green-500 bg-slate-800/50 hover:bg-slate-800 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2 group-hover:text-green-400 transition-colors">
                              {protocol.name}
                            </h3>
                            <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                              {protocol.description}
                            </p>
                            <div className="flex items-center gap-3 text-sm">
                              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30">
                                {protocol.pillar}
                              </span>
                              {protocol.difficulty && (
                                <span className="text-slate-500">
                                  {protocol.difficulty}
                                </span>
                              )}
                              {protocol.duration && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-500">
                                    {protocol.duration}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Books */}
              {person.Book && person.Book.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-orange-400" />
                    Books by {person.name}
                  </h2>
                  <div className="space-y-4">
                    {person.Book.map((book: Book) => (
                      <Link
                        key={book.id}
                        href={`/books/${book.slug}`}
                        className="block p-4 rounded-lg border border-slate-700 hover:border-orange-500 bg-slate-800/50 hover:bg-slate-800 transition-all group"
                      >
                        <div className="flex gap-4">
                          {book.imageUrl && (
                            <div className="flex-shrink-0 w-16 h-24 bg-slate-700 rounded overflow-hidden">
                              <img
                                src={book.imageUrl}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1 group-hover:text-orange-400 transition-colors line-clamp-2">
                              {book.title}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
                              {book.year && <span>{book.year}</span>}
                              {book.pages && <span>•</span>}
                              {book.pages && <span>{book.pages} pages</span>}
                              {book.rating && <span>•</span>}
                              {book.rating && (
                                <span className="flex items-center gap-1">
                                  ⭐ {book.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm line-clamp-2">
                              {book.description}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Pillars */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h3 className="text-xl font-bold mb-4">Focus Areas</h3>
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

              {/* Expertise */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h3 className="text-xl font-bold mb-3">Expertise</h3>
                <p className="text-slate-300">{person.expertise}</p>
              </div>

              {/* Followers */}
              {person.followers && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h3 className="text-xl font-bold mb-3">Reach</h3>
                  <p className="text-slate-300">{person.followers}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
