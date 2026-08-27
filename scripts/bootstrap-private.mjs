#!/usr/bin/env node
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function parseArguments(args, env) {
  const options = {
    explicitUrl: null,
    reference: env.CAITLYN_HOLLAND_PRIVATE_REPOSITORY_REFERENCE ?? null,
    serviceAccountReference: env.CAITLYN_HOLLAND_OP_SERVICE_ACCOUNT_REFERENCE ?? null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!["--url", "--op-reference", "--service-account-reference"].includes(argument)) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const value = args[index + 1];
    if (!value) throw new Error(`${argument} requires a value.`);
    if (argument === "--url") options.explicitUrl = value;
    else if (argument === "--op-reference") options.reference = value;
    else options.serviceAccountReference = value;
    index += 1;
  }

  return options;
}

function githubRepository(cloneUrl) {
  if (/\r|\n/u.test(cloneUrl)) {
    throw new Error("The clone URL must be a single line.");
  }

  let repository;
  if (/^https?:\/\//iu.test(cloneUrl)) {
    const parsed = new URL(cloneUrl);
    if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== "github.com") {
      throw new Error("The HTTPS clone URL must target github.com.");
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
      throw new Error("The clone URL must contain no embedded credential, query, or fragment.");
    }
    repository = parsed.pathname.replace(/^\//u, "").replace(/\.git\/?$/u, "");
  } else {
    const match = cloneUrl.match(
      /^git@github\.com:([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+?)(?:\.git)?$/u
    );
    if (!match) {
      throw new Error("The clone URL must be a credential-free GitHub HTTPS or SSH URL.");
    }
    repository = match[1];
  }

  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repository)) {
    throw new Error("The clone URL must identify one GitHub owner and repository.");
  }
  return repository;
}

function commandSucceeded(result) {
  return result.status === 0 && typeof result.stdout === "string" && result.stdout.trim();
}

/**
 * @typedef {(command: string, args: string[], options?: Record<string, unknown>) => {
 *   status: number | null,
 *   stdout?: string | Buffer,
 * }} CommandRunner
 */

/**
 * Install the private companion checkout beneath a repository root.
 *
 * @param {object} [options]
 * @param {string} [options.root]
 * @param {string[]} [options.args]
 * @param {Record<string, string | undefined>} [options.env]
 * @param {CommandRunner} [options.run]
 * @param {(message: string) => void} [options.log]
 */
export function bootstrapPrivate({
  root = repositoryRoot,
  args = process.argv.slice(2),
  env = process.env,
  run = /** @type {CommandRunner} */ (spawnSync),
  log = console.log,
} = {}) {
  const privateRoot = join(root, "private");
  if (existsSync(join(privateRoot, ".git"))) {
    log("The optional private companion is already installed.");
    return { status: "already-installed", privateRoot };
  }
  if (existsSync(privateRoot) && readdirSync(privateRoot).length > 0) {
    throw new Error(
      "Refusing to overwrite the non-empty private directory because it is not a Git worktree."
    );
  }

  const { explicitUrl, reference, serviceAccountReference } = parseArguments(args, env);
  let cloneUrl = explicitUrl;
  if (!cloneUrl) {
    if (!reference) {
      throw new Error(
        "Provide --url, --op-reference, or CAITLYN_HOLLAND_PRIVATE_REPOSITORY_REFERENCE."
      );
    }
    let result = run("op", ["read", reference], { encoding: "utf8", windowsHide: true });
    if (!commandSucceeded(result) && serviceAccountReference) {
      const tokenResult = run("op", ["read", serviceAccountReference], {
        encoding: "utf8",
        windowsHide: true,
      });
      const serviceToken = commandSucceeded(tokenResult) ? tokenResult.stdout.trim() : "";
      if (serviceToken) {
        result = run("op", ["read", reference], {
          encoding: "utf8",
          env: { ...env, OP_SERVICE_ACCOUNT_TOKEN: serviceToken },
          windowsHide: true,
        });
      }
    }
    if (!commandSucceeded(result)) {
      throw new Error(
        "Could not retrieve the companion clone URL with the current 1Password identity or the optional service-account reference."
      );
    }
    cloneUrl = result.stdout.trim();
  }

  const repository = githubRepository(cloneUrl);
  const visibility = run(
    "gh",
    ["repo", "view", repository, "--json", "visibility", "--jq", ".visibility"],
    { encoding: "utf8", windowsHide: true }
  );
  if (!commandSucceeded(visibility) || visibility.stdout.trim() !== "PRIVATE") {
    throw new Error("Refusing to clone because GitHub did not report the companion as PRIVATE.");
  }

  const clone = run("git", ["clone", cloneUrl, privateRoot], {
    stdio: "inherit",
    windowsHide: true,
  });
  if (clone.status !== 0 || !existsSync(join(privateRoot, ".git"))) {
    throw new Error("The private companion clone did not complete successfully.");
  }
  log("Private companion installed at private/.");
  return { status: "installed", privateRoot };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  bootstrapPrivate();
}
