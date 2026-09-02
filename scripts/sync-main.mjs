#!/usr/bin/env node
/**
 * Bring this public checkout and its optional private companion to the latest
 * origin/main, in one command run from the public repository root.
 *
 * Usage:
 *
 *   npm run sync:main
 *
 * For each repository, the script refuses uncommitted changes, fetches and
 * prunes origin, checks out main, and fast-forwards to origin/main. It never
 * stashes work or creates a merge commit. A missing private companion is
 * reported and skipped because it is optional until bootstrap:private runs.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const MAIN_BRANCH = "main";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @typedef {"updated" | "current" | "skipped" | "failed"} SyncStatus
 *
 * @typedef {object} SyncResult
 * @property {string} label
 * @property {SyncStatus} status
 * @property {string} detail
 *
 * @typedef {object} GitRun
 * @property {number} status
 * @property {string} stdout
 * @property {string} stderr
 *
 * @typedef {(root: string, args: readonly string[]) => GitRun} GitRunner
 */

/** @type {Record<SyncStatus, string>} */
const marks = {
  updated: "+",
  current: "=",
  skipped: "-",
  failed: "x",
};

/** @type {GitRunner} */
export const runGit = (root, args) => {
  const result = spawnSync("git", [...args], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};

/**
 * @param {string} porcelain
 */
export function isDirty(porcelain) {
  return porcelain.trim().length > 0;
}

/**
 * @param {SyncResult} result
 */
export function describeResult(result) {
  return `${marks[result.status]} ${result.label}: ${result.detail}`;
}

/**
 * Return the first non-empty line of Git's complaint for a concise report.
 *
 * @param {string} text
 */
function firstLine(text) {
  const line = text
    .split("\n")
    .map((value) => value.trim())
    .find((value) => value.length > 0);
  return line ?? "Git command failed without an error message";
}

/**
 * Fetch, switch to main, and fast-forward one repository.
 *
 * @param {string} root
 * @param {string} label
 * @param {GitRunner} [git]
 * @returns {SyncResult}
 */
export function syncRepository(root, label, git = runGit) {
  /** @param {string} detail */
  const fail = (detail) => ({ label, status: /** @type {const} */ ("failed"), detail });

  if (!existsSync(join(root, ".git"))) {
    return { label, status: "skipped", detail: `no Git repository at ${root}` };
  }

  const status = git(root, ["status", "--porcelain"]);
  if (status.status !== 0) return fail(firstLine(status.stderr));
  if (isDirty(status.stdout)) {
    return fail("uncommitted changes; commit or stash them, then run this again");
  }

  const fetch = git(root, ["fetch", "--prune", "origin"]);
  if (fetch.status !== 0) return fail(firstLine(fetch.stderr));

  const previousBranch = git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (previousBranch.status !== 0) return fail(firstLine(previousBranch.stderr));

  const branchName = previousBranch.stdout.trim();
  if (branchName !== MAIN_BRANCH) {
    const checkout = git(root, ["checkout", MAIN_BRANCH]);
    if (checkout.status !== 0) return fail(firstLine(checkout.stderr));
  }

  const before = git(root, ["rev-parse", "HEAD"]);
  if (before.status !== 0) return fail(firstLine(before.stderr));

  const merge = git(root, ["merge", "--ff-only", `origin/${MAIN_BRANCH}`]);
  if (merge.status !== 0) return fail(firstLine(merge.stderr));

  const after = git(root, ["rev-parse", "HEAD"]);
  if (after.status !== 0) return fail(firstLine(after.stderr));

  const beforeCommit = before.stdout.trim();
  const afterCommit = after.stdout.trim();
  const switched = branchName === MAIN_BRANCH ? "" : ` (was on ${branchName})`;
  if (beforeCommit === afterCommit) {
    return {
      label,
      status: "current",
      detail: `main already up to date at ${afterCommit.slice(0, 7)}${switched}`,
    };
  }

  const count = git(root, ["rev-list", "--count", `${beforeCommit}..${afterCommit}`]);
  const commitCount = count.status === 0 ? count.stdout.trim() : "";
  const commits = commitCount && commitCount !== "0" ? `, ${commitCount} new commit(s)` : "";
  return {
    label,
    status: "updated",
    detail: `main now at ${afterCommit.slice(0, 7)}${commits}${switched}`,
  };
}

/**
 * @param {object} [options]
 * @param {string} [options.root]
 * @param {GitRunner} [options.git]
 * @param {(message: string) => void} [options.log]
 */
export function syncMain({ root = repositoryRoot, git = runGit, log = console.log } = {}) {
  const results = [syncRepository(root, "caitlyn-holland-vip", git)];
  const privateRoot = join(root, "private");

  if (existsSync(join(privateRoot, ".git"))) {
    results.push(syncRepository(privateRoot, "private companion", git));
  } else {
    results.push({
      label: "private companion",
      status: /** @type {const} */ ("skipped"),
      detail: `not installed at ${privateRoot}; run \`npm run bootstrap:private\``,
    });
  }

  for (const result of results) log(describeResult(result));
  return results.some((result) => result.status === "failed") ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exitCode = syncMain();
}
