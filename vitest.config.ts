import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    // Level-3 harness smokes live here but run only via vitest.smoke.config.ts
    // (they need NVIDIA_API_KEY + real CLIs; they skip without them).
    exclude: ["**/node_modules/**", "**/.git/**", "tests/smoke/**"],
    coverage: {
      provider: "v8",
      include: ["installer/**/*.ts", "mcp-server/src/**/*.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 60,
        statements: 80,
      },
    },
  },
})
