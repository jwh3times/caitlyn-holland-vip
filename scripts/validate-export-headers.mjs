import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { validateSecurityHeaders } from "./smoke.mjs";

/** Validate the copied compatibility policy without generating or rewriting it. */
export async function validateExportHeaders(
  exportRoot = resolve("out"),
  sourcePath = resolve("public/_headers")
) {
  const source = await readFile(sourcePath, "utf8");
  const exported = await readFile(join(exportRoot, "_headers"), "utf8");
  assert.equal(exported, source, "Exported headers must match public/_headers exactly");
  for (const name of ["index.html", "404.html"]) await access(join(exportRoot, name));
  const lines = source.split(/\r?\n/);
  assert.deepEqual(
    lines.filter((line) => /^(\/|https?:\/\/)/.test(line)),
    ["/*"],
    "Expected one global header rule"
  );
  const entries = [];
  for (const line of lines) {
    assert(line.length <= 2000, "Pages header line exceeds 2,000 characters");
    if (!/^\s+[^#\s][^:]*:/.test(line)) continue;
    const colon = line.indexOf(":");
    entries.push([line.slice(0, colon).trim(), line.slice(colon + 1).trim()]);
  }
  assert.deepEqual(
    validateSecurityHeaders(new Headers(entries)),
    [],
    "Invalid export security policy"
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    await validateExportHeaders();
    console.log("Static compatibility headers validated.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
