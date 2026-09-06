import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

/**
 * @typedef {(url: URL, options: RequestInit) => Promise<Response>} FetchRequest
 * @typedef {(milliseconds: number) => Promise<void>} Sleep
 */

/** Validate the site's policy baseline independently of the deployed values. */
export function validateSecurityHeaders(headers) {
  const errors = [];
  const check = (valid, message) => {
    if (!valid) errors.push(message);
  };
  check(
    headers.get("x-content-type-options")?.trim().toLowerCase() === "nosniff",
    "X-Content-Type-Options must be nosniff"
  );
  check(
    ["SAMEORIGIN", "DENY"].includes(headers.get("x-frame-options")?.trim().toUpperCase()),
    "X-Frame-Options must be SAMEORIGIN or DENY"
  );
  check(
    ["no-referrer", "same-origin", "strict-origin", "strict-origin-when-cross-origin"].includes(
      headers.get("referrer-policy")?.trim().toLowerCase()
    ),
    "Referrer-Policy must limit cross-origin referrers"
  );

  const hsts = (headers.get("strict-transport-security") ?? "")
    .split(";")
    .map((part) => part.trim().toLowerCase());
  const ages = hsts.filter((part) => part.startsWith("max-age="));
  check(
    ages.length === 1 && /^max-age=\d+$/.test(ages[0]) && Number(ages[0].slice(8)) >= 31536000,
    "HSTS max-age must be at least one year"
  );
  check(hsts.includes("includesubdomains"), "HSTS must include subdomains");

  const permissions = (headers.get("permissions-policy") ?? "")
    .split(",")
    .map((part) => part.trim());
  for (const feature of ["camera", "microphone", "geolocation"]) {
    const matches = permissions.filter((part) => new RegExp(`^${feature}\\s*=`).test(part));
    check(
      matches.length === 1 && new RegExp(`^${feature}\\s*=\\s*\\(\\s*\\)$`).test(matches[0]),
      `Permissions-Policy must disable ${feature}`
    );
  }

  const directives = new Map();
  for (const part of (headers.get("content-security-policy") ?? "").split(";")) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (!name) continue;
    const key = name.toLowerCase();
    check(!directives.has(key), `Duplicate CSP directive: ${key}`);
    directives.set(key, sources);
  }
  const expected = {
    "default-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "frame-ancestors": ["'self'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
  };
  for (const [name, allowed] of Object.entries(expected)) {
    const sources = directives.get(name);
    check(
      sources?.length > 0 && sources.every((value) => allowed.includes(value)),
      `CSP ${name} is missing or exceeds the allowed sources`
    );
  }
  for (const name of ["script-src", "script-src-elem", "script-src-attr"]) {
    if (name !== "script-src" && !directives.has(name)) continue;
    const sources = directives.get(name);
    check(
      sources?.length > 0 &&
        sources.every(
          (value) =>
            ["'self'", "'unsafe-inline'", "'none'"].includes(value) ||
            /^'sha(256|384|512)-[A-Za-z0-9+/]+=*'$/.test(value)
        ),
      `CSP ${name} contains missing or unapproved script sources`
    );
  }
  for (const name of ["style-src-elem", "style-src-attr"]) {
    if (!directives.has(name)) continue;
    check(
      directives
        .get(name)
        .every((value) => ["'self'", "'unsafe-inline'", "'none'"].includes(value)),
      `CSP ${name} contains unapproved style sources`
    );
  }
  return errors;
}

/** GET with bounded retries and no redirect following, including on sitemap/robots. */
async function request(url, { fetchImpl, sleep }, options = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetchImpl(new URL(url), {
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
        ...options,
      });
      if (response.status === 429 || response.status >= 500) {
        await response.body?.cancel();
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      if (attempt === 2) throw error;
      await sleep(1000);
    }
  }
}

/** @param {{siteUrl?: string, fetchImpl?: FetchRequest, sleep?: Sleep}} [options] */
export async function checkSite({
  siteUrl = "https://caitlyn.holland.vip",
  fetchImpl = fetch,
  sleep = delay,
} = {}) {
  const cases = [
    ["/", 200, "Caitlyn Holland", true],
    ["/__smoke_missing_page__", 404, "Page Not Found", true],
    ["/sitemap.xml", 200, null, false],
    ["/robots.txt", 200, null, false],
  ];
  for (const [path, status, marker, security] of cases) {
    const response = await request(new URL(path, siteUrl), { fetchImpl, sleep });
    assert.equal(
      response.status,
      status,
      `${path}: expected HTTP ${status}, received ${response.status}`
    );
    const body = await response.text();
    if (marker) assert(body.includes(marker), `${path}: missing content marker ${marker}`);
    if (security)
      assert.deepEqual(
        validateSecurityHeaders(response.headers),
        [],
        `${path}: security-header validation failed`
      );
  }
}

/**
 * Poll the official Pages check on the pushed commit, never a preview URL from event data.
 * @param {{repository: string, sha: string, token: string, fetchImpl?: FetchRequest, sleep?: Sleep, attempts?: number}} options
 */
export async function waitForDeployment({
  repository,
  sha,
  token,
  fetchImpl = fetch,
  sleep = delay,
  attempts = 60,
}) {
  assert(/^[\w.-]+\/[\w.-]+$/.test(repository), "Invalid repository");
  assert(/^[a-f0-9]{40}$/.test(sha), "Invalid commit SHA");
  assert(token, "GitHub token is required for deployment polling");
  const url = `https://api.github.com/repos/${repository}/commits/${sha}/check-runs?per_page=100&filter=latest`;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await request(
      url,
      { fetchImpl, sleep },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    assert.equal(response.status, 200, `Could not read deployment checks: HTTP ${response.status}`);
    const data = await response.json();
    const check = data.check_runs
      .filter(
        (item) =>
          item.name === "Cloudflare Pages" &&
          item.app?.slug === "cloudflare-workers-and-pages" &&
          item.head_sha === sha
      )
      .sort((left, right) => right.id - left.id)[0];
    if (check?.status === "completed") {
      assert.equal(
        check.conclusion,
        "success",
        `Cloudflare deployment ended with ${check.conclusion}`
      );
      return;
    }
    if (attempt + 1 < attempts) await sleep(10000);
  }
  throw new Error("Timed out waiting for Cloudflare Pages deployment");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    if (process.argv.includes("--wait-for-deployment")) {
      await waitForDeployment({
        repository: process.env.GITHUB_REPOSITORY,
        sha: process.env.GITHUB_SHA,
        token: process.env.GH_TOKEN,
      });
      console.log("Cloudflare Pages deployment succeeded for this commit.");
    } else {
      await checkSite({ siteUrl: process.env.SITE_URL });
      console.log(
        "Live-site smoke checks passed: homepage, 404, security values, sitemap, robots."
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
