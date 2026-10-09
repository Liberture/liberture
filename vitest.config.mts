import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/** Unit tests for the assistant API (lib/habits/api/__tests__). No database: DB-backed handlers are mocked. */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["lib/**/__tests__/**/*.test.ts"],
  },
})
