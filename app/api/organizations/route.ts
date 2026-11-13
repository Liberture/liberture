import { listProfiles, writeProfile } from "@/lib/directory/profile-api"

export function GET(request: Request) {
  return listProfiles("organization", request)
}

export function POST(request: Request) {
  return writeProfile(request, "organization")
}
