import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Directory | Liberture",
  description: "Explore people, organizations, protocols, and resources in the biohacking community.",
};

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Biohacking Directory
          </h1>
          <p className="text-xl text-slate-300 mb-12">
            Discover the people, organizations, protocols, and knowledge shaping human optimization.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* People Card */}
            <a
              href="/people"
              className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-8 transition-all hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 text-4xl">👤</div>
                <h2 className="mb-2 text-2xl font-bold">People</h2>
                <p className="text-slate-400">
                  Biohackers, researchers, and pioneers in human optimization.
                </p>
                <div className="mt-4 text-sm text-purple-400">Coming Soon</div>
              </div>
            </a>

            {/* Organizations Card */}
            <a
              href="/organizations"
              className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-8 transition-all hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 text-4xl">🏢</div>
                <h2 className="mb-2 text-2xl font-bold">Organizations</h2>
                <p className="text-slate-400">
                  Labs, companies, and communities advancing the field.
                </p>
                <div className="mt-4 text-sm text-cyan-400">Coming Soon</div>
              </div>
            </a>

            {/* Protocols Card */}
            <a
              href="/protocols"
              className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-8 transition-all hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 text-4xl">⚡</div>
                <h2 className="mb-2 text-2xl font-bold">Protocols</h2>
                <p className="text-slate-400">
                  Proven methods and systems for optimization.
                </p>
                <div className="mt-4 text-sm text-purple-400">Coming Soon</div>
              </div>
            </a>

            {/* Books Card */}
            <a
              href="/books"
              className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-8 transition-all hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 text-4xl">📚</div>
                <h2 className="mb-2 text-2xl font-bold">Books & Resources</h2>
                <p className="text-slate-400">
                  Free books and educational materials (royalty-free only).
                </p>
                <div className="mt-4 text-sm text-cyan-400">Coming Soon</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
