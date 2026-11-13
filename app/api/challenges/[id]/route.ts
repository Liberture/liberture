import { access, body, json, serve, view } from "@/lib/challenges/server"
import { act } from "@/lib/challenges/actions"

type Params = { params: Promise<{ id: string }> }

export function GET(request: Request, { params }: Params) {
  return serve(request, async () => {
    const { row, role } = await access(request, (await params).id)
    return json({ challenge: view(row.state, role) })
  })
}

export function PATCH(request: Request, { params }: Params) {
  return serve(request, async () => {
    const { row, role } = await access(request, (await params).id)
    return json(await act(row.state, role, await body(request)))
  })
}
