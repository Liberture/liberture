import { Metadata } from "next";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `${params.slug} | Books | Liberture`,
    description: "Free biohacking book",
  };
}

export default function BookPage({ params }: Props) {
  // TODO: Fetch book data from database by slug
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <a href="/directory" className="text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
              ← Back to Directory
            </a>
          </div>
          
          <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-8">
            <h1 className="text-4xl font-bold mb-4 capitalize">
              {params.slug.replace(/-/g, " ")}
            </h1>
            <p className="text-slate-400 text-lg mb-4">
              Book details coming soon. All resources in our library are free and royalty-free.
            </p>
            <div className="inline-block px-4 py-2 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm font-semibold">
              FREE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
