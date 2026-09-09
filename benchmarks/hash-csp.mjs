import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, cp, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium, firefox, webkit, expect } from "@playwright/test";
import { JSDOM } from "jsdom";

// Evaluation only: production headers are never modified.
const root = resolve(import.meta.dirname, "..");
const exportRoot = join(root, "out");
const files = new Map();
const hashes = new Set();
const inventory = [];
const args = process.argv.slice(2);
assert(
  args.every((arg) => /^(--browsers=|--url=|--preview-output=|--policy=)/.test(arg)),
  "Unknown argument"
);
const option = (name) =>
  args
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");
const remoteURL = option("url");
const previewOutput = option("preview-output");
assert(!option("policy") || option("policy") === "compatibility", "Unknown policy selection");
assert(!(previewOutput && option("policy")), "Preview output always uses the candidate policy");
const browserNames = option("browsers")?.split(",") ?? ["chromium", "firefox", "webkit"];
const browserTypes = { chromium, firefox, webkit };
assert(
  browserNames.every((name) => Object.hasOwn(browserTypes, name)),
  "Unknown browser selection"
);
for (const entry of await readdir(exportRoot, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const path = join(entry.parentPath, entry.name);
  const body = await readFile(path);
  const route = `/${path.slice(exportRoot.length + 1).replaceAll("\\", "/")}`;
  files.set(route, body);
  if (extname(path) !== ".html") continue;
  const dom = new JSDOM(body.toString("utf8"));
  const scripts = [...dom.window.document.querySelectorAll("script:not([src])")];
  for (const script of scripts) {
    hashes.add(`'sha256-${createHash("sha256").update(script.textContent).digest("base64")}'`);
  }
  inventory.push({ route, inlineScripts: scripts.length });
  dom.window.close();
}
assert(files.has("/index.html") && files.has("/404.html"), "Run npm run build first");
const sourceHeaders = await readFile(join(root, "public/_headers"), "utf8");
const original = sourceHeaders
  .split(/\r?\n/)
  .find((line) => line.includes("Content-Security-Policy:"));
assert(original?.includes("script-src 'self';"), "Unexpected source policy");
let candidate = original.replace(
  "script-src 'self'",
  `script-src 'self' ${[...hashes].sort().join(" ")}`
);
assert(candidate.length <= 2000, `Candidate header exceeds Pages limit: ${candidate.length}`);
const compatibility = option("policy") === "compatibility";
assert.equal(
  files.get("/_headers")?.toString("utf8"),
  sourceHeaders.replace(original, candidate),
  "Exported CSP does not match the finished HTML; run npm run build"
);
if (remoteURL) {
  assert(!previewOutput, "Hosted validation cannot prepare a local preview");
  // Cloudflare builds the commit independently, so emitted script hashes can
  // differ from a local build. Derive the hosted expectation from its HTML;
  // never trust the response's allowlist as the source of expected hashes.
  hashes.clear();
  for (const { route } of inventory) {
    const response = await fetch(`${remoteURL}${route}`);
    assert.equal(response.status, 200, `Cannot inventory hosted document ${route}`);
    const dom = new JSDOM(await response.text());
    for (const script of dom.window.document.querySelectorAll("script:not([src])")) {
      hashes.add(`'sha256-${createHash("sha256").update(script.textContent).digest("base64")}'`);
    }
    dom.window.close();
  }
  candidate = original.replace(
    "script-src 'self'",
    `script-src 'self' ${[...hashes].sort().join(" ")}`
  );
  assert(candidate.length <= 2000, `Hosted header exceeds Pages limit: ${candidate.length}`);
}
const policy = (
  compatibility
    ? original.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
    : candidate
)
  .split("Content-Security-Policy:")[1]
  .trim();
if (previewOutput) {
  const destination = resolve(previewOutput);
  assert(
    !destination.startsWith(exportRoot) && !exportRoot.startsWith(destination),
    "Use a separate preview directory"
  );
  await cp(exportRoot, destination, { recursive: true, errorOnExist: true, force: false });
  await writeFile(join(destination, "_headers"), sourceHeaders.replace(original, candidate));
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
const server = createServer((request, response) => {
  const requested = new URL(request.url, "http://localhost").pathname;
  // Serve explicit aliases too; this is not an emulator of Pages redirect rules.
  const path = requested === "/" ? "/index.html" : requested;
  const found = files.has(path) ? path : files.has(`${path}.html`) ? `${path}.html` : undefined;
  const matched = found ?? "/404.html";
  const status = found ? 200 : 404;
  response.writeHead(status, {
    "Content-Type": mime[extname(matched)] ?? "application/octet-stream",
    "Content-Security-Policy": policy,
    "X-Content-Type-Options": "nosniff",
  });
  response.end(files.get(matched));
});
await new Promise((resolveListening) => server.listen(0, "127.0.0.1", resolveListening));
const baseURL = remoteURL ?? `http://127.0.0.1:${server.address().port}`;
const results = [];
try {
  for (const name of browserNames) {
    const browserType = browserTypes[name];
    const browser = await browserType.launch();
    try {
      for (const colorScheme of ["light", "dark"]) {
        const context = await browser.newContext({
          colorScheme,
          viewport: { width: 390, height: 844 },
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await context.addInitScript(() => {
          window.cspViolations = [];
          document.addEventListener("securitypolicyviolation", (event) => {
            window.cspViolations.push({
              directive: event.effectiveDirective,
              blocked: event.blockedURI,
            });
          });
        });
        const routes = inventory.flatMap(({ route }) => [route, route.replace(/\.html$/, "")]);
        for (const route of routes) {
          const response = await page.goto(`${baseURL}${route}`);
          assert.equal(response.headers()["content-security-policy"], policy);
          if (remoteURL) {
            const hostedResponse = await fetch(`${baseURL}${route}`);
            assert.equal(hostedResponse.headers.get("content-security-policy"), policy);
            const html = new JSDOM(await hostedResponse.text());
            for (const script of html.window.document.querySelectorAll("script:not([src])")) {
              assert(
                hashes.has(
                  `'sha256-${createHash("sha256").update(script.textContent).digest("base64")}'`
                ),
                `Unexpected hosted inline script on ${route}`
              );
            }
            html.window.close();
          }
          await expect(page.locator("html")).toHaveClass(new RegExp(colorScheme));
          if (route !== "/index.html" && route !== "/index") {
            await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
          } else {
            await expect(
              page.getByRole("button", {
                name: `Activate ${colorScheme === "light" ? "dark" : "light"} mode`,
              })
            ).toBeVisible();
          }
          assert.deepEqual(
            await page.evaluate(() => window.cspViolations),
            [],
            `${browserType.name()} ${route}`
          );
          // Let route prefetches finish before replacing the document. WebKit can
          // report canceled fetches as access-control page errors on hosted runs.
          await page.waitForLoadState("networkidle");
        }
        await page.goto(baseURL);
        const target = colorScheme === "light" ? "dark" : "light";
        await page.getByRole("button", { name: `Activate ${target} mode` }).click();
        await expect(page.locator("html")).toHaveClass(new RegExp(target));
        await page.waitForLoadState("networkidle");
        await page.reload();
        await expect(page.locator("html")).toHaveClass(new RegExp(target));
        await expect(
          page.getByRole("button", { name: `Activate ${colorScheme} mode` })
        ).toBeVisible();
        await page.getByRole("button", { name: "Open menu" }).click();
        await expect(page.getByRole("button", { name: "Close menu" })).toBeVisible();
        await page.getByRole("link", { name: "About", exact: true }).click();
        await expect(page).toHaveURL(/#about$/);
        await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
        assert.deepEqual(await page.evaluate(() => window.cspViolations), []);
        await page.waitForLoadState("networkidle");
        const response = await page.goto(`${baseURL}/missing-csp-fixture`);
        assert.equal(response.status(), 404);
        assert.equal(response.headers()["content-security-policy"], policy);
        await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible();
        await expect(page.locator("html")).toHaveClass(new RegExp(target));
        await page.waitForLoadState("networkidle");
        assert.deepEqual(await page.evaluate(() => window.cspViolations), []);
        await page.getByRole("link", { name: "Back to Home" }).click();
        await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
        assert.deepEqual(await page.evaluate(() => window.cspViolations), []);
        assert.deepEqual(errors, [], "No runtime or hydration errors");
        await page.evaluate(() => {
          const script = document.createElement("script");
          script.textContent = "window.unapprovedCspProbe = true";
          document.body.append(script);
        });
        if (compatibility) {
          assert.equal(await page.evaluate(() => window.unapprovedCspProbe), true);
        } else {
          await expect.poll(() => page.evaluate(() => window.cspViolations.length)).toBe(1);
          assert.equal(await page.evaluate(() => window.unapprovedCspProbe), undefined);
          assert.match(
            (await page.evaluate(() => window.cspViolations[0])).directive,
            /^script-src/
          );
        }
        results.push({ browser: browserType.name(), systemTheme: colorScheme, passed: true });
        console.log(`${browserType.name()} / ${colorScheme}: passed`);
        await context.close();
      }
    } finally {
      await browser.close();
    }
  }
  console.log(
    JSON.stringify(
      { inventory, distinctHashes: hashes.size, headerCharacters: candidate.length, results },
      null,
      2
    )
  );
} finally {
  server.closeAllConnections();
  await new Promise((resolveClosed) => server.close(resolveClosed));
}
