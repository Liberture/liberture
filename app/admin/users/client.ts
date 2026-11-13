"use client"

import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"

export const userAdmin = createAuthClient({ plugins: [adminClient()] })
