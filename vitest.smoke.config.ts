import { defineConfig } from "vitest/config"

// Dedicated config for level-3 harness smoke tests (need NVIDIA_API_KEY).
// Run: npx vitest run --config vitest.smoke.config.ts
// Without the key (or CLIs) every suite skips — never fails.
export default defineConfig({
  test: {
    globals: true,
    include: ["tests/smoke/**/*.test.ts"],
    testTimeout: 300_000,
    hookTimeout: 60_000,
    reporters: ["default"],
  },
})
