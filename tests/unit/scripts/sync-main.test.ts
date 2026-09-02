import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describeResult, isDirty, syncMain, syncRepository } from "../../../scripts/sync-main.mjs";

let fixtureRoot: string;

beforeEach(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "sync-main-"));
});

afterEach(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

type GitResult = { status: number; stdout: string; stderr: string };
type GitRunner = (root: string, args: readonly string[]) => GitResult;

function makeRepository(root: string) {
  mkdirSync(join(root, ".git"), { recursive: true });
}

function successfulGit(options: { branch?: string; before?: string; after?: string } = {}) {
  const branch = options.branch ?? "main";
  const before = options.before ?? "abcdef0123";
  const after = options.after ?? before;
  return vi.fn<GitRunner>((_root, args) => {
    const command = args.join(" ");
    if (command === "rev-parse --abbrev-ref HEAD") {
      return { status: 0, stdout: `${branch}\n`, stderr: "" };
    }
    if (command === "rev-parse HEAD") {
      const callCount = successfulGitHeadCalls.get(command) ?? 0;
      successfulGitHeadCalls.set(command, callCount + 1);
      return { status: 0, stdout: `${callCount === 0 ? before : after}\n`, stderr: "" };
    }
    if (command.startsWith("rev-list --count")) {
      return { status: 0, stdout: "2\n", stderr: "" };
    }
    return { status: 0, stdout: "", stderr: "" };
  });
}

let successfulGitHeadCalls: Map<string, number>;

beforeEach(() => {
  successfulGitHeadCalls = new Map();
});

describe("sync-main helpers", () => {
  it("detects dirty porcelain output and formats results", () => {
    expect(isDirty(" M package.json\n")).toBe(true);
    expect(isDirty(" \n")).toBe(false);
    expect(describeResult({ label: "public", status: "current", detail: "already current" })).toBe(
      "= public: already current"
    );
  });
});

describe("syncRepository", () => {
  it("skips a path that is not a Git repository", () => {
    expect(syncRepository(fixtureRoot, "missing", vi.fn())).toEqual({
      label: "missing",
      status: "skipped",
      detail: `no Git repository at ${fixtureRoot}`,
    });
  });

  it("refuses an uncommitted worktree before fetching", () => {
    makeRepository(fixtureRoot);
    const git = vi.fn<GitRunner>(() => ({
      status: 0,
      stdout: " M notes.md\n",
      stderr: "",
    }));

    expect(syncRepository(fixtureRoot, "public", git)).toMatchObject({
      status: "failed",
      detail: expect.stringContaining("uncommitted changes"),
    });
    expect(git).toHaveBeenCalledTimes(1);
  });

  it("reports Git errors using the first non-empty error line", () => {
    makeRepository(fixtureRoot);
    const git = vi.fn<GitRunner>(() => ({
      status: 1,
      stdout: "",
      stderr: "\nnetwork unavailable\nmore detail\n",
    }));

    expect(syncRepository(fixtureRoot, "public", git)).toMatchObject({
      status: "failed",
      detail: "network unavailable",
    });
  });

  it("switches to main and fast-forwards an outdated repository", () => {
    makeRepository(fixtureRoot);
    const git = successfulGit({ branch: "feature", before: "1111111aaa", after: "2222222bbb" });

    expect(syncRepository(fixtureRoot, "public", git)).toEqual({
      label: "public",
      status: "updated",
      detail: "main now at 2222222, 2 new commit(s) (was on feature)",
    });
    expect(git).toHaveBeenCalledWith(fixtureRoot, ["fetch", "--prune", "origin"]);
    expect(git).toHaveBeenCalledWith(fixtureRoot, ["checkout", "main"]);
    expect(git).toHaveBeenCalledWith(fixtureRoot, ["merge", "--ff-only", "origin/main"]);
  });

  it("reports an already-current main branch", () => {
    makeRepository(fixtureRoot);
    const git = successfulGit();

    expect(syncRepository(fixtureRoot, "public", git)).toEqual({
      label: "public",
      status: "current",
      detail: "main already up to date at abcdef0",
    });
    expect(git).not.toHaveBeenCalledWith(fixtureRoot, ["checkout", "main"]);
  });

  it("stops when main cannot be checked out", () => {
    makeRepository(fixtureRoot);
    const git = successfulGit({ branch: "feature" });
    git.mockImplementationOnce(() => ({ status: 0, stdout: "", stderr: "" }));
    git.mockImplementationOnce(() => ({ status: 0, stdout: "", stderr: "" }));
    git.mockImplementationOnce(() => ({ status: 0, stdout: "feature\n", stderr: "" }));
    git.mockImplementationOnce(() => ({ status: 1, stdout: "", stderr: "cannot switch\n" }));

    expect(syncRepository(fixtureRoot, "public", git)).toMatchObject({
      status: "failed",
      detail: "cannot switch",
    });
  });
});

describe("syncMain", () => {
  it("syncs both repositories and logs their outcomes", () => {
    makeRepository(fixtureRoot);
    makeRepository(join(fixtureRoot, "private"));
    const git = successfulGit();
    const log = vi.fn();

    expect(syncMain({ root: fixtureRoot, git, log })).toBe(0);
    expect(log).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenNthCalledWith(
      1,
      "= caitlyn-holland-vip: main already up to date at abcdef0"
    );
    expect(log).toHaveBeenNthCalledWith(
      2,
      "= private companion: main already up to date at abcdef0"
    );
  });

  it("skips a missing private companion", () => {
    makeRepository(fixtureRoot);
    const log = vi.fn();

    expect(syncMain({ root: fixtureRoot, git: successfulGit(), log })).toBe(0);
    expect(log).toHaveBeenLastCalledWith(
      expect.stringContaining("private companion: not installed")
    );
  });

  it("returns a failure exit code if either repository fails", () => {
    makeRepository(fixtureRoot);
    const git = vi.fn<GitRunner>(() => ({ status: 1, stdout: "", stderr: "failed\n" }));

    expect(syncMain({ root: fixtureRoot, git, log: vi.fn() })).toBe(1);
  });
});
