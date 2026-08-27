import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
    expect(log).toHaveBeenCalledWith("The optional private companion is already installed.");
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
