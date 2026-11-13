import { listProfiles, writeProfile } from "@/lib/directory/profile-api"

export function GET() {
  return listProfiles("project")
}

export function POST(request: Request) {
  return writeProfile(request, "project")
}
