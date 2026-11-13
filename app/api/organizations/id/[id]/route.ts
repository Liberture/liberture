import { writeProfile } from "@/lib/directory/profile-api"

async function edit(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return writeProfile(request, "organization", (await params).id)
}

export { edit as PATCH, edit as DELETE }
