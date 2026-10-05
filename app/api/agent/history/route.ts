import { NextResponse } from "next/server"
import { z } from "zod"
import { getDb } from "@/lib/habits/db"
import { verifiedTrackerUserId } from "@/lib/habits/app-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const historySchema = z.object({
  conversationId: z.string().regex(/^[0-9a-f]{32}$/).nullable(),
  messages: z.array(z.object({
    id: z.string().min(1).max(100),
    role: z.enum(["you", "coach"]),
    text: z.string().max(100_000),
    recommendations: z.array(z.unknown()).max(100),
    createdAt: z.number().finite().nonnegative(),
    updatedAt: z.number().finite().nonnegative(),
  })).max(2000),
})

async function database() {
  const sql = getDb()
  await sql`CREATE TABLE IF NOT EXISTS habit_coach_messages (
    user_id INTEGER NOT NULL REFERENCES habit_users(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL,
    role TEXT NOT NULL,
    text TEXT NOT NULL,
    recommendations JSONB NOT NULL DEFAULT '[]',
    conversation_id TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    PRIMARY KEY (user_id, message_id)
  )`
  return sql
}

export async function GET(request: Request) {
  const userId = await verifiedTrackerUserId(request)
  if (userId === null) return NextResponse.json({ error: "Sign in to view your chat history." }, { status: 401 })
  const sql = await database()
  const rows = await sql`SELECT * FROM habit_coach_messages WHERE user_id = ${userId} ORDER BY created_at, message_id`
  const latest = [...rows].reverse().find((row) => row.conversation_id)
  return NextResponse.json({
    conversationId: latest?.conversation_id ?? null,
    messages: rows.map((row) => ({
      id: row.message_id, role: row.role, text: row.text,
      recommendations: row.recommendations,
      createdAt: Number(row.created_at), updatedAt: Number(row.updated_at),
    })),
  }, { headers: { "Cache-Control": "no-store" } })
}

export async function PUT(request: Request) {
  const userId = await verifiedTrackerUserId(request)
  if (userId === null) return NextResponse.json({ error: "Sign in to save your chat history." }, { status: 401 })
  const body = await request.text()
  if (body.length > 2_000_000) return NextResponse.json({ error: "Chat history is too large." }, { status: 413 })
  let input: z.infer<typeof historySchema>
  try { input = historySchema.parse(JSON.parse(body)) }
  catch { return NextResponse.json({ error: "Invalid chat history." }, { status: 400 }) }
  const sql = await database()
  // Upsert individual messages: an older tab cannot erase another tab's replies.
  await sql.begin(async (tx) => {
    for (const message of input.messages) {
      await tx`INSERT INTO habit_coach_messages
        (user_id, message_id, role, text, recommendations, conversation_id, created_at, updated_at)
        VALUES (${userId}, ${message.id}, ${message.role}, ${message.text},
          ${JSON.stringify(message.recommendations)}::jsonb, ${input.conversationId}, ${message.createdAt}, ${message.updatedAt})
        ON CONFLICT (user_id, message_id) DO UPDATE SET
          text = EXCLUDED.text, recommendations = EXCLUDED.recommendations,
          conversation_id = COALESCE(EXCLUDED.conversation_id, habit_coach_messages.conversation_id),
          updated_at = EXCLUDED.updated_at
        WHERE EXCLUDED.updated_at >= habit_coach_messages.updated_at`
    }
  })
  return NextResponse.json({ saved: true })
}
