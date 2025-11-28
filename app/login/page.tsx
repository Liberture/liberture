import { LoginForm } from "@/components/login-form"
import { AuthProvider } from "@/lib/auth-context"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { TopographicBackground } from "@/components/topographic-background"
import { translations } from "@/lib/translations"

export default function LoginPage() {
  const { navigation } = translations.en
  return (
    <AuthProvider>
      <main className="min-h-screen topo-pattern flex flex-col">
        <TopographicBackground />
        <nav className="p-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {navigation.backHome}
          </Link>
        </nav>
        <div className="flex-1 flex items-center justify-center p-4">
          <LoginForm />
        </div>
      </main>
    </AuthProvider>
  )
}
