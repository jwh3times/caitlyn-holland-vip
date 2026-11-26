import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf-8");

/** An npm v3 lockfile's `packages` map: install path → resolved version (and, at "", ranges). */
type Lockfile = {
  packages: Record<string, { version?: string; devDependencies?: Record<string, string> }>;
};

const lockfile = (packages: Lockfile["packages"]): Lockfile => ({ packages });

/**
 * The loader depends on `tailwindcss` at its own exact version, so what has to hold is in the
 * lockfile, not the `package.json` ranges (Dependabot raises only the loader's): the app and the
 * loader resolve to one version, and no second, nested copy is installed for the loader to use.
 */
function tailwindPairingProblems({ packages }: Lockfile): string[] {
  const app = packages["node_modules/tailwindcss"]?.version;
  const loader = packages["node_modules/@tailwindcss/webpack"]?.version;
  const nested = Object.keys(packages).filter((path) => path.endsWith("/node_modules/tailwindcss"));
  const problems = nested.map((path) => `a second tailwindcss is installed at ${path}`);

  if (app === undefined || loader === undefined) {
    problems.unshift("the lockfile lacks a top-level tailwindcss or @tailwindcss/webpack");
  } else if (app !== loader) {
    problems.unshift(`tailwindcss resolves to ${app} but @tailwindcss/webpack to ${loader}`);
  }

  return problems;
}

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
    expect(
      Object.keys(manifest.overrides ?? {}).filter((name) => /postcss|autoprefixer/.test(name))
    ).toEqual([]);
  });

  describe("installs one Tailwind for the loader and the app", () => {
    it("holds in the committed lockfile", () => {
      expect(tailwindPairingProblems(JSON.parse(read("package-lock.json")) as Lockfile)).toEqual(
        []
      );
    });

    it("fails when the loader and the app resolve different versions", () => {
      expect(
        tailwindPairingProblems(
          lockfile({
            "node_modules/tailwindcss": { version: "4.3.3" },
            "node_modules/@tailwindcss/webpack": { version: "4.3.4" },
          })
        )
      ).toEqual(["tailwindcss resolves to 4.3.3 but @tailwindcss/webpack to 4.3.4"]);
    });

    it.each([
      ["neither", {}],
      ["only tailwindcss", { "node_modules/tailwindcss": { version: "4.3.4" } }],
      ["only @tailwindcss/webpack", { "node_modules/@tailwindcss/webpack": { version: "4.3.4" } }],
    ])("fails when the lockfile installs %s at the top level", (_, packages) => {
      expect(tailwindPairingProblems(lockfile(packages))).toEqual([
        "the lockfile lacks a top-level tailwindcss or @tailwindcss/webpack",
      ]);
    });

    it("passes when Dependabot raised only the loader's range", () => {
      expect(
        tailwindPairingProblems(
          lockfile({
            "": { devDependencies: { tailwindcss: "^4.3.3", "@tailwindcss/webpack": "^4.3.4" } },
            "node_modules/tailwindcss": { version: "4.3.4" },
            "node_modules/@tailwindcss/webpack": { version: "4.3.4" },
          })
        )
      ).toEqual([]);
    });

    it.each([
      "node_modules/@tailwindcss/webpack/node_modules/tailwindcss",
      "node_modules/@tailwindcss/node/node_modules/tailwindcss",
    ])("fails when a second copy is installed at %s", (nested) => {
      expect(
        tailwindPairingProblems(
          lockfile({
            "node_modules/tailwindcss": { version: "4.3.4" },
            "node_modules/@tailwindcss/webpack": { version: "4.3.4" },
            [nested]: { version: "4.3.4" },
          })
        )
      ).toEqual([`a second tailwindcss is installed at ${nested}`]);
    });
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
