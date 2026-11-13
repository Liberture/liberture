"use client";

import { useState } from "react";
import { Tabs, TabOptions, TabsContent } from "@/components/ui/tabs";
import { ProfileMarkdown } from "@/components/people/profile-markdown";
import { ProfilePortrait } from "@/components/people/profile-portrait";
import { ProfileSocials } from "@/components/people/profile-socials";
import { PillarTag } from "@/components/habits/marketplace/pillar-tag";
import { PILLAR_IDS } from "@/lib/habits/pillars";
import Link from "next/link";
import { BookOpen, MessageSquare, Zap, User, Trophy, Library } from "lucide-react";
import { PersonSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";

const sections = ["About", "Achievements", "Publications", "Speaking", "Protocols", "Books"] as const;
type Section = typeof sections[number];
const icons = { About: User, Achievements: Trophy, Publications: BookOpen, Speaking: MessageSquare, Protocols: Zap, Books: Library };
const labels = { About: "About", Achievements: "Achievements", Publications: "Publications", Speaking: "Speaking", Protocols: "Protocols", Books: "Books" };

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

export default function PersonDetails({ person }: { person: Person }) {
  const [selected, setSelected] = useState<Section>("About");
  const achievements = person.achievements ? JSON.parse(person.achievements) : [];
  const publications = person.publications ? JSON.parse(person.publications) : [];
  const speakingEvents = person.speakingEvents ? JSON.parse(person.speakingEvents) : [];
  const pillars = (person.pillars || '').split(',').map(p => p.trim().toLowerCase()).filter(Boolean);

  const counts = { About: 1, Achievements: achievements.length, Publications: publications.length, Speaking: speakingEvents.length, Protocols: person.Protocol?.length, Books: person.Book?.length };
  const available = sections.filter(section => counts[section]);
  const tab = available.includes(selected) ? selected : "About";

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
            <Link href="/people" className="text-purple-400 hover:text-purple-300 mb-4 inline-block cursor-pointer">
              ← Back
            </Link>
          </div>
          
          {/* Header */}
          <div className="mb-8">
            <ProfilePortrait person={person} />
            <h1 className="text-5xl font-bold mb-2">{person.name}</h1>
            <p className="text-2xl text-purple-400 mb-4">{person.title}</p>
            
            <ProfileSocials person={person} />
          </div>

          <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Tabs value={tab} onValueChange={value => setSelected(value as Section)}>
              <TabOptions ids={available} icons={icons} labels={labels} label="Profile sections" />
              <TabsContent value="About">
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <ProfileMarkdown>{person.bio}</ProfileMarkdown>
              </TabsContent>
            {/* Achievements */}
              <TabsContent value="Achievements">
                  <h2 className="text-2xl font-bold mb-4">Key Achievements</h2>
                  <ul className="space-y-3">
                    {achievements.map((achievement: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1">•</span>
                        <ProfileMarkdown>{achievement}</ProfileMarkdown>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
            {/* Publications */}
              <TabsContent value="Publications">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-green-400" />
                    Publications & Research
                  </h2>
                  <ul className="space-y-3">
                    {publications.map((pub: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-green-400 mt-1">→</span>
                        <ProfileMarkdown>{pub}</ProfileMarkdown>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
            {/* Speaking Events */}
              <TabsContent value="Speaking">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-cyan-400" />
                    Speaking & Appearances
                  </h2>
                  <ul className="space-y-3">
                    {speakingEvents.map((event: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-cyan-400 mt-1">→</span>
                        <ProfileMarkdown>{event}</ProfileMarkdown>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
            {/* Protocols */}
              <TabsContent value="Protocols">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-green-400" />
                    Protocols by {person.name}
                  </h2>
                  <div className="space-y-4">
                    {person.Protocol?.map((protocol: Protocol) => (
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
                </TabsContent>
            {/* Books */}
              <TabsContent value="Books">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-orange-400" />
                    Books by {person.name}
                  </h2>
                  <div className="space-y-4">
                    {person.Book?.map((book: Book) => (
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
                </TabsContent>
            </Tabs>
              <aside aria-label="Profile details" className="space-y-6">
                {/* Pillars */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h3 className="text-xl font-bold mb-4">Focus Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {PILLAR_IDS.filter(id => pillars.includes(id)).map(id => <PillarTag key={id} pillar={id} />)}
                  </div>
                </div>

                {/* Expertise */}
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h3 className="text-xl font-bold mb-3">Expertise</h3>
                  <p className="text-slate-300">{person.expertise}</p>
                </div>

              </aside>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
