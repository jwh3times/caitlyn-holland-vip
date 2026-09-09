import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

/** Generate one global script allowlist from the finished export, including 404s. */
export async function generateCsp(
  exportRoot = resolve("out"),
  sourcePath = resolve("public/_headers")
) {
  const source = await readFile(sourcePath, "utf8");
  const lines = source.split(/\r?\n/);
  const cspLines = lines.filter((line) => /^\s+Content-Security-Policy:/i.test(line));
  assert.equal(cspLines.length, 1, "Expected exactly one CSP header");
  const original = cspLines[0];
  const directives = original
    .slice(original.indexOf(":") + 1)
    .trim()
    .split(/;\s*/);
  const scripts = directives.filter((directive) => /^script-src(?:\s|$)/.test(directive));
  assert.deepEqual(scripts, ["script-src 'self'"], "Expected script-src 'self' template");
  assert(
    !directives.some((directive) => /^script-src-(elem|attr)\b/.test(directive)),
    "Unexpected script override"
  );
  const hashes = new Set();
  const documents = [];
  for (const entry of await readdir(exportRoot, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const path = join(entry.parentPath, entry.name);
    const dom = new JSDOM(await readFile(path, "utf8"));
    try {
      for (const script of dom.window.document.querySelectorAll("script:not([src])")) {
        hashes.add(`'sha256-${createHash("sha256").update(script.textContent).digest("base64")}'`);
      }
    } finally {
      dom.window.close();
    }
    documents.push(path);
  }
  assert(documents.includes(join(exportRoot, "index.html")), "Missing exported index.html");
  assert(documents.includes(join(exportRoot, "404.html")), "Missing exported 404.html");
  assert(hashes.size > 0, "No inline scripts found in export");
  const candidate = original.replace(
    "script-src 'self'",
    `script-src 'self' ${[...hashes].sort().join(" ")}`
  );
  const headers = source.replace(original, candidate);
  for (const line of headers.split(/\r?\n/)) {
    assert(line.length <= 2000, `Pages header line exceeds 2,000 characters (${line.length})`);
  }
  // All validation completes before replacing the exported header file.
  await writeFile(join(exportRoot, "_headers"), headers);
  return { documents: documents.length, hashes: hashes.size, headerCharacters: candidate.length };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    console.log("Generated export CSP:", await generateCsp());
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
