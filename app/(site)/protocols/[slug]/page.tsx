"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Target, AlertTriangle, Package, Lightbulb, BookOpen, Link2, Shuffle } from "lucide-react";
import { ArticleSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";

type RelatedProtocol = {
  kind: string;
  note: string;
  protocol: { slug: string; name: string; pillar: string; description: string };
};

type Protocol = {
  id: string;
  slug: string;
  name: string;
  description: string;
  why: string | null;
  pillar: string;
  creator: string | null;
  duration: string | null;
  difficulty: string;
  steps: string;
  benefits: string;
  risks: string | null;
  equipment: string | null;
  references: string | null;
  featured: boolean;
  related?: RelatedProtocol[];
};

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
  expert: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function parseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    // Legacy rows may hold plain text instead of a JSON array
    return value.trim() ? [value] : [];
  }
}

export default function ProtocolPage() {
  const params = useParams();
  const router = useRouter();
  
  const handleBack = () => {
    router.back();
  };
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProtocol = async () => {
      try {
        const response = await fetch(`/api/protocols/${params.slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/404');
            return;
          }
          throw new Error('Failed to fetch protocol');
        }

        const data = await response.json();
        setProtocol(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProtocol();
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

  if (error || !protocol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-slate-400">{error || 'Protocol not found'}</p>
          <Link href="/protocols" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
            ← Back to Protocols
          </Link>
        </div>
      </div>
    );
  }

  const steps = parseList(protocol.steps);
  const benefits = parseList(protocol.benefits);
  const risks = parseList(protocol.risks);
  const equipment = parseList(protocol.equipment);
  const references = parseList(protocol.references);
  const synergies = (protocol.related || []).filter((r) => r.kind === 'synergy');
  const alternatives = (protocol.related || []).filter((r) => r.kind === 'alternative');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      {/* JSON-LD Schema */}
      <ArticleSchema
        title={protocol.name}
        description={protocol.description}
        url={`https://liberture.com/protocols/${protocol.slug}`}
        author={protocol.creator || 'Liberture'}
      />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://liberture.com' },
          { name: 'Protocols', url: 'https://liberture.com/protocols' },
          { name: protocol.name, url: `https://liberture.com/protocols/${protocol.slug}` },
        ]}
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link href="/protocols" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Protocols
            </Link>
          </div>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start gap-2 mb-2">
              <Target className="w-8 h-8 text-purple-400 mt-1" />
              <div>
                <h1 className="text-5xl font-bold mb-2">{protocol.name}</h1>
                {protocol.creator && (
                  <p className="text-xl text-purple-400">
                    by{' '}
                    <Link 
                      href={`/people/${protocol.creator}`}
                      className="hover:text-purple-300 underline decoration-purple-400/30 hover:decoration-purple-300 transition-colors"
                    >
                      {protocol.creator.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Link>
                  </p>
                )}
              </div>
            </div>
            
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${difficultyColors[protocol.difficulty as keyof typeof difficultyColors] || difficultyColors.beginner}`}>
                {protocol.difficulty}
              </span>
              {protocol.duration && (
                <span className="text-slate-400">{protocol.duration}</span>
              )}
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-medium border border-purple-500/30 capitalize">
                {protocol.pillar}
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="text-slate-300 text-lg leading-relaxed">{protocol.description}</p>
              </div>

              {/* Why This Works */}
              {protocol.why && (
                <div className="rounded-2xl border border-amber-700/40 bg-amber-900/10 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-6 h-6 text-amber-400" />
                    <h2 className="text-2xl font-bold text-amber-400">Why This Works</h2>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{protocol.why}</p>
                </div>
              )}

              {/* Steps */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h2 className="text-2xl font-bold mb-4">Steps</h2>
                <ol className="space-y-4">
                  {steps.map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </span>
                      <span className="text-slate-300 pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Benefits */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h2 className="text-2xl font-bold mb-4">Benefits</h2>
                <ul className="space-y-3">
                  {benefits.map((benefit: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-green-400 mt-1">✓</span>
                      <span className="text-slate-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risks */}
              {risks.length > 0 && (
                <div className="rounded-2xl border border-red-700/50 bg-red-900/20 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <h2 className="text-2xl font-bold text-red-400">Risks & Warnings</h2>
                  </div>
                  <ul className="space-y-3">
                    {risks.map((risk: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-red-400 mt-1">!</span>
                        <span className="text-slate-300">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Works Well With */}
              {synergies.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Link2 className="w-6 h-6 text-green-400" />
                    <h2 className="text-2xl font-bold">Works Well With</h2>
                  </div>
                  <div className="space-y-4">
                    {synergies.map((rel, i) => (
                      <Link
                        key={i}
                        href={`/protocols/${rel.protocol.slug}`}
                        className="block rounded-xl border border-slate-700 bg-slate-800/50 p-4 hover:border-green-500/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-green-400">{rel.protocol.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">{rel.protocol.pillar}</span>
                        </div>
                        <p className="text-sm text-slate-400">{rel.note}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Same Goal, Different Route */}
              {alternatives.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shuffle className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-2xl font-bold">Same Goal, Different Route</h2>
                  </div>
                  <div className="space-y-4">
                    {alternatives.map((rel, i) => (
                      <Link
                        key={i}
                        href={`/protocols/${rel.protocol.slug}`}
                        className="block rounded-xl border border-slate-700 bg-slate-800/50 p-4 hover:border-cyan-500/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-cyan-400">{rel.protocol.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">{rel.protocol.pillar}</span>
                        </div>
                        <p className="text-sm text-slate-400">{rel.note}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources & References */}
              {references.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                    <h2 className="text-2xl font-bold">Sources & References</h2>
                  </div>
                  <ul className="space-y-3">
                    {references.map((ref: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1 text-sm font-mono">[{i + 1}]</span>
                        <span className="text-slate-400 text-sm">{ref}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Equipment */}
              {equipment.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-bold">Equipment Needed</h3>
                  </div>
                  <ul className="space-y-2">
                    {equipment.map((item: string, i: number) => (
                      <li key={i} className="text-slate-300 text-sm">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Stats */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h3 className="text-xl font-bold mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-400">Difficulty:</span>
                    <span className="ml-2 text-white capitalize">{protocol.difficulty}</span>
                  </div>
                  {protocol.duration && (
                    <div>
                      <span className="text-slate-400">Duration:</span>
                      <span className="ml-2 text-white">{protocol.duration}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Focus Area:</span>
                    <span className="ml-2 text-white capitalize">{protocol.pillar}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
