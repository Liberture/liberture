import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
  ],
  trustedOrigins: [
    "http://localhost:3033",
    "https://liberture.com",
    "https://www.liberture.com",
  ],
});

export type Session = typeof auth.$Infer.Session;
