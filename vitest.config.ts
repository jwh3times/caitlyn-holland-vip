import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror the tsconfig "@/*" -> "./*" path alias.
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Unit/component tests only. Playwright e2e specs live in tests/e2e/ and are
    // run separately (npm run test:e2e) — keep the two suites disjoint.
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      // Count every source file, not just the ones a test happens to import.
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "scripts/**/*.mjs",
      ],
      exclude: [
        "**/*.d.ts",
        // Structural app shell (renders <html>/<body>); exercised by Playwright
        // e2e + SEO specs rather than jsdom unit tests.
        "app/layout.tsx",
        // Re-export barrel — no logic to cover.
        "components/sections/index.ts",
        // Shared verbatim across repositories and covered by its own node:test
        // suite (`node --test scripts/sync-agents.test.mjs`), not by vitest.
        "scripts/sync-agents.mjs",
        "scripts/sync-agents.test.mjs",
        // The neutrality lint is shared the same way and tested by
        // `node --test scripts/lint-agent-neutrality.test.mjs`.
        "scripts/lint-agent-neutrality.mjs",
        "scripts/lint-agent-neutrality.test.mjs",
        // The other canonical scripts are shared the same way, each with its own
        // node:test suite that CI runs.
        "scripts/sync-main.mjs",
        "scripts/sync-main.test.mjs",
        "scripts/next-version.mjs",
        "scripts/next-version.test.mjs",
        "scripts/check-changelog.mjs",
        "scripts/check-changelog.test.mjs",
        "scripts/check-docs.mjs",
        "scripts/check-docs.test.mjs",
      ],
      // Baseline coverage gate. CI fails (and merges are blocked) below this.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
