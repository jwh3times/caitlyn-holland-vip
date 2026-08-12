import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf-8");

describe("Tailwind webpack prototype", () => {
  it("uses the Tailwind webpack loader through Turbopack", () => {
    expect(read("next.config.ts")).toContain('loaders: ["@tailwindcss/webpack"]');
    expect(read("next.config.ts")).toContain('type: "css"');
  });

  it("replaces only the PostCSS integration package", () => {
    const manifest = JSON.parse(read("package.json")) as {
      devDependencies: Record<string, string>;
      overrides?: Record<string, string>;
    };

    expect(manifest.devDependencies.autoprefixer).toBeUndefined();
    expect(manifest.devDependencies.postcss).toBeDefined();
    expect(manifest.devDependencies["@tailwindcss/postcss"]).toBeUndefined();
    expect(manifest.devDependencies["@tailwindcss/webpack"]).toBe(
      manifest.devDependencies.tailwindcss
    );
    expect(manifest.overrides).toBeUndefined();
  });

  it("uses the class-based dark variant required by next-themes", () => {
    expect(read("app/globals.css")).toContain("@custom-variant dark (&:where(.dark, .dark *));");
  });
});
