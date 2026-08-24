import { createHash } from "node:crypto";
import { readdir, rm, stat, utimes } from "node:fs/promises";
import { createServer } from "node:net";
import { cpus, platform, release, totalmem } from "node:os";
import { join, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";
import { performance } from "node:perf_hooks";

const root = resolve(import.meta.dirname, "..");
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
const globalsPath = join(root, "app", "globals.css");
const allowedCleanTargets = new Set([join(root, ".next"), join(root, "out")]);

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=", 2);
    return [key, value];
  })
);

const variant = args.get("variant");
const mode = args.get("mode") ?? "all";
const runs = Number(args.get("runs") ?? 3);

if (!variant || !["all", "build", "dev"].includes(mode) || !Number.isInteger(runs) || runs < 1) {
  console.error(
    "Usage: npm run benchmark:tailwind -- --variant=<name> [--mode=all|build|dev] [--runs=3]"
  );
  process.exit(1);
}

async function cleanBuildOutputs() {
  for (const target of allowedCleanTargets) {
    if (!target.startsWith(`${root}\\`) && !target.startsWith(`${root}/`)) {
      throw new Error(`Refusing to clean path outside repository: ${target}`);
    }
    await rm(target, { recursive: true, force: true });
  }
}

function runNext(nextArgs, options = {}) {
  return new Promise((resolveRun, reject) => {
    const startedAt = performance.now();
    const child = spawn(process.execPath, [nextBin, ...nextArgs], {
      cwd: root,
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    let output = "";
    child.stdout?.on("data", (chunk) => (output += chunk));
    child.stderr?.on("data", (chunk) => (output += chunk));
    child.once("error", reject);
    child.once("exit", (code) => {
      const durationMs = Math.round(performance.now() - startedAt);
      if (code === 0) resolveRun({ child, durationMs, output });
      else reject(new Error(`next ${nextArgs.join(" ")} failed with code ${code}\n${output}`));
    });

    if (options.resolveOnSpawn) {
      child.once("spawn", () => resolveRun({ child, startedAt, output: () => output }));
    }
  });
}

async function findFreePort() {
  return await new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string")
        return reject(new Error("Unable to allocate port"));
      server.close(() => resolvePort(address.port));
    });
  });
}

async function waitForPage(url, timeoutMs = 60_000) {
  const startedAt = performance.now();
  let lastError;

  while (performance.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        await response.arrayBuffer();
        return Math.round(performance.now() - startedAt);
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 50));
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

async function stopDevServer(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolveExit) => child.once("exit", resolveExit)),
    new Promise((resolveWait) => setTimeout(resolveWait, 5_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function benchmarkBuilds() {
  const coldMs = [];
  const warmMs = [];

  for (let run = 1; run <= runs; run += 1) {
    await cleanBuildOutputs();
    console.error(`[${variant}] build pair ${run}/${runs}`);
    coldMs.push((await runNext(["build"])).durationMs);
    warmMs.push((await runNext(["build"])).durationMs);
  }

  return { coldMs, warmMs };
}

async function benchmarkDevelopment() {
  const coldMs = [];
  const warmMs = [];
  const originalTimes = await stat(globalsPath);

  try {
    for (let run = 1; run <= runs; run += 1) {
      await cleanBuildOutputs();
      const port = await findFreePort();
      const url = `http://127.0.0.1:${port}/`;
      console.error(`[${variant}] development pair ${run}/${runs}`);
      const server = await runNext(["dev", "--hostname", "127.0.0.1", "--port", String(port)], {
        capture: true,
        resolveOnSpawn: true,
      });

      try {
        await waitForPage(url);
        coldMs.push(Math.round(performance.now() - server.startedAt));

        const changedAt = new Date();
        await utimes(globalsPath, changedAt, changedAt);
        await new Promise((resolveWait) => setTimeout(resolveWait, 250));
        warmMs.push(await waitForPage(`${url}?benchmark=${Date.now()}`));
      } catch (error) {
        throw new Error(`${error}\n${server.output()}`, { cause: error });
      } finally {
        await stopDevServer(server.child);
      }
    }
  } finally {
    await utimes(globalsPath, originalTimes.atime, originalTimes.mtime);
  }

  return { coldMs, warmMs };
}

async function walkCss(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkCss(path)));
    else if (entry.isFile() && entry.name.endsWith(".css")) files.push(path);
  }
  return files.sort();
}

async function cssArtifacts() {
  const files = await walkCss(join(root, "out"));
  return await Promise.all(
    files.map(async (file) => {
      const contents = await import("node:fs/promises").then(({ readFile }) => readFile(file));
      return {
        path: relative(root, file).replaceAll("\\", "/"),
        bytes: contents.byteLength,
        sha256: createHash("sha256").update(contents).digest("hex"),
      };
    })
  );
}

const packageJson = JSON.parse(
  await import("node:fs/promises").then(({ readFile }) =>
    readFile(join(root, "package.json"), "utf8")
  )
);
const result = {
  variant,
  timestamp: new Date().toISOString(),
  runs,
  environment: {
    platform: `${platform()} ${release()}`,
    architecture: process.arch,
    cpu: cpus()[0]?.model.trim(),
    logicalCpus: cpus().length,
    memoryGiB: Number((totalmem() / 2 ** 30).toFixed(1)),
    node: process.version,
    next: packageJson.dependencies.next,
    tailwindcss: packageJson.devDependencies.tailwindcss,
    integration:
      packageJson.devDependencies["@tailwindcss/webpack"] ??
      packageJson.devDependencies["@tailwindcss/postcss"],
  },
};

if (mode === "all" || mode === "build") {
  result.build = await benchmarkBuilds();
  result.css = await cssArtifacts();
}
if (mode === "all" || mode === "dev") result.development = await benchmarkDevelopment();

console.log(JSON.stringify(result, null, 2));
