import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { spawnSync, execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bootstrapPrivate } from "../../../scripts/bootstrap-private.mjs";

let fixtureRoot: string;

beforeEach(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "bootstrap-private-"));
});

afterEach(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

function successfulRun() {
  return vi.fn((command: string, args: string[], _options?: Record<string, unknown>) => {
    if (command === "gh") return { status: 0, stdout: "PRIVATE\n" };
    if (command === "git") {
      mkdirSync(join(args[2]!, ".git"), { recursive: true });
      return { status: 0, stdout: "" };
    }
    return { status: 1, stdout: "" };
  });
}

describe("bootstrapPrivate", () => {
  it("clones a verified private GitHub repository", () => {
    const run = successfulRun();

    const result = bootstrapPrivate({
      root: fixtureRoot,
      args: ["--url", "https://github.com/example/private-workspace.git"],
      env: {},
      run,
      log: vi.fn(),
    });

    expect(result.status).toBe("installed");
    expect(run).toHaveBeenNthCalledWith(
      1,
      "gh",
      ["repo", "view", "example/private-workspace", "--json", "visibility", "--jq", ".visibility"],
      expect.any(Object)
    );
    expect(run).toHaveBeenNthCalledWith(
      2,
      "git",
      ["clone", "https://github.com/example/private-workspace.git", join(fixtureRoot, "private")],
      expect.any(Object)
    );
  });

  it("retrieves the URL from the environment-configured 1Password reference", () => {
    const run = successfulRun();
    run.mockImplementationOnce(() => ({
      status: 0,
      stdout: "git@github.com:example/private-workspace.git\n",
    }));

    bootstrapPrivate({
      root: fixtureRoot,
      args: [],
      env: { CAITLYN_HOLLAND_PRIVATE_REPOSITORY_REFERENCE: "op://vault/item/url" },
      run,
      log: vi.fn(),
    });

    expect(run).toHaveBeenNthCalledWith(1, "op", ["read", "op://vault/item/url"], {
      encoding: "utf8",
      windowsHide: true,
    });
    expect(run).toHaveBeenNthCalledWith(
      2,
      "gh",
      ["repo", "view", "example/private-workspace", "--json", "visibility", "--jq", ".visibility"],
      expect.any(Object)
    );
  });

  it("uses the optional service-account reference when the current identity cannot read the URL", () => {
    const run = successfulRun();
    run
      .mockImplementationOnce(() => ({ status: 1, stdout: "" }))
      .mockImplementationOnce(() => ({ status: 0, stdout: "service-token\n" }))
      .mockImplementationOnce((_command, _args, options) => {
        expect(
          ((options?.env ?? {}) as Record<string, string | undefined>).OP_SERVICE_ACCOUNT_TOKEN
        ).toBe("service-token");
        return { status: 0, stdout: "https://github.com/example/private-workspace\n" };
      });

    bootstrapPrivate({
      root: fixtureRoot,
      args: [
        "--op-reference",
        "op://vault/item/url",
        "--service-account-reference",
        "op://vault/item/token",
      ],
      env: {},
      run,
      log: vi.fn(),
    });

    expect(run).toHaveBeenCalledTimes(5);
  });

  it("is idempotent when the private companion already exists", () => {
    mkdirSync(join(fixtureRoot, "private", ".git"), { recursive: true });
    const run = successfulRun();
    const log = vi.fn();

    const result = bootstrapPrivate({ root: fixtureRoot, args: [], env: {}, run, log });

    expect(result.status).toBe("already-installed");
    expect(run).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      "The optional private companion already exists; use --verify to check its identity and visibility."
    );
  });

  it("refuses to overwrite a non-empty directory that is not a Git worktree", () => {
    mkdirSync(join(fixtureRoot, "private"));
    writeFileSync(join(fixtureRoot, "private", "notes.md"), "keep me\n");

    expect(() =>
      bootstrapPrivate({ root: fixtureRoot, args: ["--url", "https://github.com/a/b"], env: {} })
    ).toThrow(/Refusing to overwrite/);
  });

  it.each([
    "https://user:secret@github.com/example/private-workspace.git",
    "http://github.com/example/private-workspace.git",
    "https://gitlab.com/example/private-workspace.git",
    "https://github.com/example/private-workspace.git?token=secret",
    "file:///tmp/private-workspace",
  ])("rejects an unsafe clone URL: %s", (url) => {
    expect(() =>
      bootstrapPrivate({ root: fixtureRoot, args: ["--url", url], env: {}, run: successfulRun() })
    ).toThrow(/clone URL|HTTPS clone URL/);
  });

  it("refuses to clone a repository that GitHub does not report as private", () => {
    const run = vi.fn(() => ({ status: 0, stdout: "PUBLIC\n" }));

    expect(() =>
      bootstrapPrivate({
        root: fixtureRoot,
        args: ["--url", "https://github.com/example/public-repository"],
        env: {},
        run,
      })
    ).toThrow(/did not report.*PRIVATE/);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("requires a URL source and rejects unknown or incomplete arguments", () => {
    expect(() => bootstrapPrivate({ root: fixtureRoot, args: [], env: {} })).toThrow(
      /Provide --url/
    );
    expect(() =>
      bootstrapPrivate({ root: fixtureRoot, args: ["--unknown", "value"], env: {} })
    ).toThrow(/Unknown argument/);
    expect(() => bootstrapPrivate({ root: fixtureRoot, args: ["--url"], env: {} })).toThrow(
      /requires a value/
    );
  });
});

const intendedUrl = "https://github.com/example/private-workspace.git";

function existingCompanion() {
  const path = join(fixtureRoot, "private");
  execFileSync("git", ["init", "--quiet", path]);
  execFileSync("git", ["-C", path, "remote", "add", "origin", intendedUrl]);
  return path;
}

function verificationRun(visibility = "PRIVATE", status = 0) {
  return vi.fn((command: string, args: string[], options?: Record<string, unknown>) => {
    if (command === "gh") return { status, stdout: `${visibility}\n` };
    if (command === "op") return { status: 0, stdout: intendedUrl };
    return spawnSync(command, args, { ...options, encoding: "utf8" });
  });
}

function verify(run = verificationRun(), args = ["--verify", "--url", intendedUrl]) {
  return bootstrapPrivate({ root: fixtureRoot, args, env: {}, run, log: vi.fn() });
}

describe("existing companion verification", () => {
  it("verifies a real worktree without modifying staged or unstaged content", () => {
    const path = existingCompanion();
    writeFileSync(join(path, "notes.md"), "staged\n");
    execFileSync("git", ["-C", path, "add", "notes.md"]);
    writeFileSync(join(path, "notes.md"), "unstaged\n");
    const before = [".git/config", ".git/index", "notes.md"].map((file) =>
      readFileSync(join(path, file))
    );
    const run = verificationRun();
    expect(verify(run).status).toBe("verified");
    expect(
      [".git/config", ".git/index", "notes.md"].map((file) => readFileSync(join(path, file)))
    ).toEqual(before);
    expect(
      run.mock.calls
        .filter(([command]) => command === "git")
        .every(([, args]) => args.includes("rev-parse") || args.includes("get-url"))
    ).toBe(true);
  });

  it("accepts equivalent SSH/HTTPS identity and GitHub name casing", () => {
    const path = existingCompanion();
    execFileSync("git", [
      "-C",
      path,
      "remote",
      "set-url",
      "origin",
      "git@github.com:EXAMPLE/PRIVATE-workspace.git",
    ]);
    expect(verify().status).toBe("verified");
  });

  it("uses the supplied 1Password locator as the independent intended identity", () => {
    existingCompanion();
    const run = verificationRun();
    expect(verify(run, ["--verify", "--op-reference", "op://vault/item/url"]).status).toBe(
      "verified"
    );
    expect(run.mock.calls.some(([command]) => command === "op")).toBe(true);
  });

  it("requires an independent locator rather than trusting origin itself", () => {
    existingCompanion();
    expect(() => verify(verificationRun(), ["--verify"])).toThrow("Provide --url");
  });

  it.each(["missing", "non-git", "fake-git", "bare"])(
    "rejects a %s directory without querying external services",
    (kind) => {
      const path = join(fixtureRoot, "private");
      if (kind === "non-git") mkdirSync(path);
      if (kind === "fake-git") mkdirSync(join(path, ".git"), { recursive: true });
      if (kind === "bare") execFileSync("git", ["init", "--quiet", "--bare", path]);
      const run = verificationRun();
      expect(() => verify(run)).toThrow(/existing private|valid Git worktree/);
      expect(run.mock.calls.every(([command]) => command === "git")).toBe(true);
    }
  );

  it.each([
    "https://github.com/example/wrong.git",
    "https://user:synthetic-secret@github.com/example/private-workspace.git",
    "https://gitlab.com/example/private-workspace.git",
  ])("rejects an unexpected fetch remote without printing it: %s", (remote) => {
    const path = existingCompanion();
    execFileSync("git", ["-C", path, "remote", "set-url", "origin", remote]);
    const run = verificationRun();
    expect(() => verify(run)).toThrow("origin must have exactly one safe fetch and push URL");
    try {
      verify(run);
    } catch (error) {
      expect(String(error)).not.toContain(remote);
    }
    expect(run.mock.calls.some(([command]) => command === "gh")).toBe(false);
  });

  it("rejects a different push destination", () => {
    const path = existingCompanion();
    execFileSync("git", [
      "-C",
      path,
      "remote",
      "set-url",
      "--push",
      "origin",
      "https://github.com/example/wrong.git",
    ]);
    expect(() => verify()).toThrow("origin must have exactly one safe fetch and push URL");
  });

  it.each(["url", "pushurl"])("rejects multiple origin %s destinations", (key) => {
    const path = existingCompanion();
    if (key === "pushurl")
      execFileSync("git", ["-C", path, "config", "--add", `remote.origin.${key}`, intendedUrl]);
    execFileSync("git", [
      "-C",
      path,
      "config",
      "--add",
      `remote.origin.${key}`,
      "https://github.com/example/other.git",
    ]);
    expect(() => verify()).toThrow("origin must have exactly one safe fetch and push URL");
  });

  it("rejects a missing origin", () => {
    const path = existingCompanion();
    execFileSync("git", ["-C", path, "remote", "remove", "origin"]);
    expect(() => verify()).toThrow("origin must have exactly one safe fetch and push URL");
  });

  it.each(["PUBLIC", "INTERNAL", ""])("fails closed on %s visibility", (visibility) => {
    existingCompanion();
    expect(() => verify(verificationRun(visibility))).toThrow(
      "did not report the intended companion as PRIVATE"
    );
  });

  it("fails closed when GitHub cannot verify visibility", () => {
    existingCompanion();
    expect(() => verify(verificationRun("PRIVATE", 1))).toThrow("did not report");
  });

  it("accepts a linked worktree with a .git file", () => {
    const source = join(fixtureRoot, "source");
    execFileSync("git", ["init", "--quiet", source]);
    execFileSync("git", [
      "-C",
      source,
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "commit",
      "--quiet",
      "--allow-empty",
      "-m",
      "fixture",
    ]);
    execFileSync("git", ["-C", source, "remote", "add", "origin", intendedUrl]);
    execFileSync("git", [
      "-C",
      source,
      "worktree",
      "add",
      "--quiet",
      "-b",
      "companion",
      join(fixtureRoot, "private"),
    ]);
    expect(verify().status).toBe("verified");
  });
});
