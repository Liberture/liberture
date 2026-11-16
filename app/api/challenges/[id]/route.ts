import { access, body, json, serve, view } from "@/lib/challenges/server"
import { raceProgress, raceTracking } from "@/lib/challenges/race"
import { act } from "@/lib/challenges/actions"

type Params = { params: Promise<{ id: string }> }

export function GET(request: Request, { params }: Params) {
  return serve(request, async () => {
    const { row, role } = await access(request, (await params).id)
    const race = await raceProgress(row)
    const tracking = await raceTracking(row, role)
    return json({ challenge: { ...view(row.state, role), race, tracking, ...(row.player_id === null && role === "player" && {guestDays: row.state.guestDays ?? []}) } })
  })
}

export function PATCH(request: Request, { params }: Params) {
  return serve(request, async () => {
    const { row, role } = await access(request, (await params).id)
    return json(await act(row.state, role, await body(request), row.player_id === null))
  })
}
