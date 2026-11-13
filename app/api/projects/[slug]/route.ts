import { readProfile } from "@/lib/directory/profile-api"

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return readProfile("project", (await params).slug)
}
