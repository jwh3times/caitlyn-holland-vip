import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf-8");

describe("Tailwind PostCSS configuration", () => {
  it("uses only the Tailwind v4 PostCSS plugin", () => {
    expect(read("postcss.config.mjs")).toContain('"@tailwindcss/postcss": {}');
    expect(read("postcss.config.mjs")).not.toContain("darkMode");
  });

  it("keeps the Tailwind package floors aligned without Autoprefixer", () => {
    const manifest = JSON.parse(read("package.json")) as {
      devDependencies: Record<string, string>;
      overrides?: Record<string, string>;
    };

    expect(manifest.devDependencies.autoprefixer).toBeUndefined();
    expect(manifest.devDependencies.postcss).toBeDefined();
    expect(manifest.devDependencies.tailwindcss).toBe(
      manifest.devDependencies["@tailwindcss/postcss"]
    );
    expect(manifest.overrides).toBeUndefined();
  });

  it("uses the class-based dark variant required by next-themes", () => {
    expect(read("app/globals.css")).toContain("@custom-variant dark (&:where(.dark, .dark *));");
  });
});
