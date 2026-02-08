"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Twitter, Instagram, Youtube, Mic } from "lucide-react";
import { PersonSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";

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
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  podcast: string | null;
  imageUrl: string | null;
  achievements: string | null;
  publications: string | null;
  protocols: string | null;
  featured: boolean;
};

export default function PersonPage() {
  const params = useParams();
  const router = useRouter();
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
  const pillars = person.pillars.split(',').map(p => p.trim());

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
            <Link href="/directory" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Directory
            </Link>
          </div>
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-2">{person.name}</h1>
            <p className="text-2xl text-purple-400 mb-4">{person.title}</p>
            
            {/* Social Links */}
            <div className="flex flex-wrap items-center gap-4">
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
