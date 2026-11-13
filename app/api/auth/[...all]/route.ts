import { identity } from "@/lib/identity/server"
import { managedAuthEnabled } from "@/lib/identity/config"

async function handle(request: Request) {
  return managedAuthEnabled() ? identity().handler(request) : new Response(null, { status: 404 })
}
export { handle as GET, handle as POST }
