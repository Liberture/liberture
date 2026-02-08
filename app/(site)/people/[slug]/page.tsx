import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Globe, Twitter, Instagram, Youtube, Mic } from "lucide-react";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const person = await prisma.person.findUnique({
    where: { slug: params.slug }
  });

  if (!person) {
    return {
      title: "Person Not Found | Liberture",
    };
  }

  return {
    title: `${person.name} | ${person.title} | Liberture`,
    description: person.bio.substring(0, 160),
  };
}

export default async function PersonPage({ params }: Props) {
  const person = await prisma.person.findUnique({
    where: { slug: params.slug }
  });

  if (!person) {
    notFound();
  }

  const achievements = person.achievements ? JSON.parse(person.achievements) : [];
  const pillars = person.pillars.split(',').map(p => p.trim());

  return (
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
  );
}
