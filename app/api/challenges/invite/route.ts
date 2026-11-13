import { invite, serve } from "@/lib/challenges/server"

export function POST(request: Request) {
  return serve(request, () => invite(request))
}
