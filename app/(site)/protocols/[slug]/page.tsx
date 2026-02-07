import { Metadata } from "next";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `${params.slug} | Protocols | Liberture`,
    description: "Biohacking protocol",
  };
}

export default function ProtocolPage({ params }: Props) {
  // TODO: Fetch protocol data from database by slug
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <a href="/directory" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Directory
            </a>
          </div>
          
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-8">
            <h1 className="text-4xl font-bold mb-4 capitalize">
              {params.slug.replace(/-/g, " ")}
            </h1>
            <p className="text-slate-400 text-lg">
              Protocol details coming soon. We're documenting proven methods for human optimization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
