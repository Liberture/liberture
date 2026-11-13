import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { createAuthEndpoint, APIError } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { admin } from "better-auth/plugins"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

function configure() {
  if (!process.env.BETTER_AUTH_URL || !process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32)
    throw new Error("Set BETTER_AUTH_URL and a stable BETTER_AUTH_SECRET before enabling managed sessions")

  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    disabledPaths: ["/admin/create-user", "/admin/set-user-password"],
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    user: { modelName: "authUser" },
    account: { modelName: "authAccount", accountLinking: { enabled: false } },
    verification: { modelName: "authVerification" },
    session: { modelName: "authSession", expiresIn: 30 * 86400 },
    plugins: [admin(), {
      id: "tracker-sign-in",
      endpoints: {
        // Only the Nostr verifier and the legacy-key verifier can call this method.
        trackerSignIn: createAuthEndpoint.serverOnly({
          method: "POST", body: z.object({ userId: z.string(), importedSession: z.string().optional() })
        }, async (ctx) => {
          const user = await ctx.context.internalAdapter.findUserById(ctx.body.userId)
          if (!user) throw new APIError("UNAUTHORIZED")
          const session = ctx.body.importedSession
            ? await prisma.authSession.findFirst({ where: { id: ctx.body.importedSession, userId: user.id, expiresAt: { gt: new Date() } } })
            : await ctx.context.internalAdapter.createSession(user.id)
          if (!session) throw new APIError("UNAUTHORIZED")
          await setSessionCookie(ctx, { user, session })
          return ctx.json({ success: true })
        })
      }
    }]
  })
}

let instance: ReturnType<typeof configure> | undefined
export function identity() { return instance ??= configure() }
