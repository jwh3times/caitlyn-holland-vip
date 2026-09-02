import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf-8");

describe("Tailwind webpack integration", () => {
  it("uses the Tailwind webpack loader through Turbopack", () => {
    expect(read("next.config.ts")).toContain('loaders: ["@tailwindcss/webpack"]');
    expect(read("next.config.ts")).toContain('type: "css"');
  });

  it("contains no leftover PostCSS integration dependencies", () => {
    const manifest = JSON.parse(read("package.json")) as {
      devDependencies: Record<string, string>;
      overrides?: Record<string, string>;
    };

    expect(manifest.devDependencies.autoprefixer).toBeUndefined();
    expect(manifest.devDependencies.postcss).toBeUndefined();
    expect(manifest.devDependencies["@tailwindcss/postcss"]).toBeUndefined();
    expect(manifest.devDependencies["@tailwindcss/webpack"]).toBe(
      manifest.devDependencies.tailwindcss
    );
    expect(manifest.overrides).toBeUndefined();
  });

  it("uses the class-based dark variant required by next-themes", () => {
    expect(read("app/globals.css")).toContain("@custom-variant dark (&:where(.dark, .dark *));");
  });

  it("defines variant-compatible semantic accent and surface utilities", () => {
    const css = read("app/globals.css");

    for (const utility of [
      "text-accent",
      "bg-accent",
      "border-accent",
      "ring-accent",
      "text-badge-blue",
      "border-subtle",
      "border-subtle-50",
      "bg-surface-hover",
    ]) {
      expect(css).toContain(`@utility ${utility}`);
    }

    expect(css).toContain("--accent: var(--color-blue-600)");
    expect(css).toContain("--accent: var(--color-blue-400)");
    expect(css).toContain("--accent-background: var(--color-blue-600)");
    expect(css).toContain("--accent-border: var(--color-blue-500)");
    expect(css).toContain("--accent-border: var(--color-blue-400)");
    expect(css).toContain("--accent-ring: var(--color-blue-400)");
    expect(css).toContain("--border-subtle: var(--color-gray-200)");
    expect(css).toContain("--border-subtle: var(--color-gray-800)");
  });

  it("keeps migrated call sites free of raw accent and border palette classes", () => {
    const migratedSources = [
      "app/layout.tsx",
      "components/footer.tsx",
      "components/navigation.tsx",
      "components/sections/AboutSection.tsx",
    ]
      .map(read)
      .join("\n");

    expect(migratedSources).not.toMatch(
      /(?:text|bg|border|ring)-(?:blue-(?:300|400|500|600|700)|gray-(?:100|200|800))/
    );
  });
});
