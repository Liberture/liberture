


import Link from "next/link";
import { ExternalLink, Building2 } from "lucide-react";
import { JsonLd, BreadcrumbSchema } from "@/components/seo/JsonLd";

type Organization = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pillars: string;
  type: string;
  founded: string | null;
  website: string;
  resources: string | null;
  keyPeople: string | null;
  featured: boolean;
  imageUrl: string | null;
};

export default function OrganizationDetails({ organization }: { organization: Organization }) {
  const resources = organization.resources ? JSON.parse(organization.resources) : [];
  const pillars = (organization.pillars || '').split(',').map(p => p.trim()).filter(Boolean);

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    description: organization.description,
    url: `https://liberture.com/organizations/${organization.slug}`,
    ...(organization.website && { sameAs: [organization.website] }),
    ...(organization.founded && { foundingDate: organization.founded }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      {/* JSON-LD Schema */}
      <JsonLd data={organizationSchema} />
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://liberture.com' },
          { name: 'Organizations', url: 'https://liberture.com/organizations' },
          { name: organization.name, url: `https://liberture.com/organizations/${organization.slug}` },
        ]}
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <Link href="/organizations" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Organizations
            </Link>
          </div>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start gap-2 mb-2">
              <Building2 className="w-8 h-8 text-purple-400 mt-1" />
              <div>
                <h1 className="text-5xl font-bold mb-2">{organization.name}</h1>
                <p className="text-2xl text-purple-400 capitalize">{organization.type}</p>
              </div>
            </div>
            
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-slate-400">
              {organization.founded && <span>Founded {organization.founded}</span>}
            </div>

            {/* Website */}
            <div className="mt-4">
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Website
              </a>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <p className="text-slate-300 text-lg leading-relaxed">{organization.description}</p>
              </div>

              {/* Resources */}
              {resources.length > 0 && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                  <h2 className="text-2xl font-bold mb-4">Resources</h2>
                  <ul className="space-y-3">
                    {resources.map((resource: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-purple-400 mt-1">•</span>
                        <span className="text-slate-300">{resource}</span>
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

              {/* Type */}
              <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
                <h3 className="text-xl font-bold mb-3">Type</h3>
                <p className="text-slate-300 capitalize">{organization.type}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
