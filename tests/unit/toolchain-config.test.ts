import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface PackageManifest {
  devDependencies: Record<string, string>;
  devEngines: {
    runtime: { name: string; version: string; onFail: string };
    packageManager: { name: string; version: string; onFail: string };
  };
}

const read = (file: string) => readFileSync(join(process.cwd(), file), "utf-8");

describe("development toolchain policy", () => {
  const manifest = JSON.parse(read("package.json")) as PackageManifest;
  const pinnedNodeMajor = read(".nvmrc").match(/\d+/)?.[0];
  const typesNodeMajor = manifest.devDependencies["@types/node"]?.match(/\d+/)?.[0];

  it("fails npm commands unless Node matches .nvmrc", () => {
    expect(manifest.devEngines.runtime).toEqual({
      name: "node",
      version: `${pinnedNodeMajor}.x`,
      onFail: "error",
    });
  });

  it("keeps Node typings on the pinned runtime major", () => {
    expect(typesNodeMajor).toBe(pinnedNodeMajor);
  });

  it("requires the npm line that preserves the committed lockfile metadata", () => {
    expect(manifest.devEngines.packageManager).toEqual({
      name: "npm",
      version: "11.x",
      onFail: "error",
    });
  });
});
