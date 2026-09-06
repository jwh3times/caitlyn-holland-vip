import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("secret-file ignore policy", () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "secret-file-policy-"));
    execFileSync("git", ["init", "--quiet", root]);
    copyFileSync(join(process.cwd(), ".gitignore"), join(root, ".gitignore"));
    writeFileSync(join(root, "empty-excludes"), "");
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function ignored(path: string) {
    const result = spawnSync(
      "git",
      ["-c", "core.excludesFile=empty-excludes", "check-ignore", "--no-index", "--quiet", path],
      { cwd: root, encoding: "utf8" }
    );
    expect(result.error).toBeUndefined();
    expect([0, 1]).toContain(result.status);
    return result.status === 0;
  }

  it.each([
    ".env",
    ".env.production",
    ".env.local",
    ".env.production.local",
    ".env.example.local",
    "credentials.key",
    "credentials.pem",
    "credentials.p12",
    "credentials.pfx",
    "export.1pif",
    "export.1pux",
    "backup.kdbx",
  ])("ignores %s at root and nested paths", (path) => {
    expect(ignored(path)).toBe(true);
    expect(ignored(`nested/${path}`)).toBe(true);
  });

  it.each([".env.example", ".env.production.example", "README.md", "config.ts"])(
    "allows reviewable templates and source files: %s",
    (path) => {
      expect(ignored(path)).toBe(false);
      expect(ignored(`nested/${path}`)).toBe(false);
    }
  );
});
