import { verifiedTrackerUserId } from "@/lib/habits/app-auth"
import { body, createChallenge, fail, json, listChallenges, serve } from "@/lib/challenges/server"
import { checkRateLimit } from "@/lib/habits/rate-limit"

export function GET(request: Request) {
  return serve(request, async () => {
    const user = await verifiedTrackerUserId(request)
    if (!user) fail("unauthorized", 401)
    return json({ challenges: await listChallenges(user) })
  })
}

export function POST(request: Request) {
  return serve(request, async () => {
    const user = await verifiedTrackerUserId(request)
    if (!user) fail("unauthorized", 401)
    if (!checkRateLimit("createChallenge:" + user, 20, 3600000).allowed) fail("rateLimited", 429)
    return json(await createChallenge(user, await body(request)), 201)
  })
}
