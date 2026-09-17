import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],

    // Level-3 harness smokes live here but run only via vitest.smoke.config.ts
    // (they need a provider API key + real CLIs; they skip without them).
    //
    // `frontend/**/__tests__/*.test.tsx` is deliberately NOT in scope. Those
    // files are reference tests that ship with the pattern templates to
    // `.forge/frontend/` — they exercise a React/Next stack that exists in
    // the *user's* project, not in this repository. Running them here would
    // mean installing that whole stack to test code FORGE does not execute.
    exclude: ["**/node_modules/**", "**/.git/**", "tests/smoke/**", "frontend/**"],

    coverage: {
      provider: "v8",
      include: ["installer/**/*.ts", "mcp-server/src/**/*.ts"],
      exclude: ["installer/types.ts"],
      reporter: ["text", "lcov"],

      // Gate per constitution Art. 4.1. These MUST match what CI runs — a
      // declared-but-unenforced threshold is itself a violation (Art. 4.4).
      //
      // Measured 2026-09-17: 91.2% lines, 84.6% branches, 87.6% functions.
      // The gate sits below the measurement so a small refactor does not
      // break the build, but above the Art. 4.1 target of 80/60 so coverage
      // cannot silently regress to it.
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 82,
        branches: 78,
      },
    },
  },
})
