import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { checkSite, validateSecurityHeaders, waitForDeployment } from "../../../scripts/smoke.mjs";

const headerEntries = readFileSync("public/_headers", "utf8")
  .split(/\r?\n/)
  .filter((line) => /^\s+\S+:/.test(line))
  .map((line): [string, string] => {
    const colon = line.indexOf(":");
    return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
  });
const policy = () => new Headers(headerEntries);

describe("deployed security policy", () => {
  it("accepts the production baseline", () => {
    expect(validateSecurityHeaders(policy())).toEqual([]);
  });

  it.each([
    ["x-content-type-options", ""],
    ["x-content-type-options", "nosniff, invalid"],
    ["x-frame-options", "ALLOWALL"],
    ["referrer-policy", "unsafe-url"],
    ["strict-transport-security", "max-age=0; includeSubDomains"],
    ["strict-transport-security", "max-age=31536000"],
    ["strict-transport-security", "max-age=31536000; max-age=0; includeSubDomains"],
    ["strict-transport-security", "max-age=31536000junk; includeSubDomains"],
    ["permissions-policy", "camera=*, microphone=(), geolocation=()"],
    ["permissions-policy", "camera=(), microphone=(self), geolocation=()"],
    ["permissions-policy", "camera=(), microphone=(), geolocation=*"],
    ["permissions-policy", "camera=(), camera=*, microphone=(), geolocation=()"],
    ["content-security-policy", "default-src *"],
  ])("rejects weak or malformed %s: %s", (name, value) => {
    const headers = policy();
    headers.set(name, value);
    expect(validateSecurityHeaders(headers).length).toBeGreaterThan(0);
  });

  it.each([
    "default-src",
    "script-src",
    "style-src",
    "img-src",
    "font-src",
    "connect-src",
    "frame-ancestors",
    "base-uri",
    "form-action",
    "object-src",
  ])("rejects a broadened or missing %s directive", (directive) => {
    for (const replacement of [`${directive} *`, ""]) {
      const headers = policy();
      headers.set(
        "content-security-policy",
        headers
          .get("content-security-policy")!
          .replace(new RegExp(`${directive} [^;]+`), replacement)
      );
      expect(validateSecurityHeaders(headers).length).toBeGreaterThan(0);
    }
  });

  it.each([
    "script-src 'unsafe-eval'",
    "script-src-elem https:",
    "script-src-attr *",
    "style-src-elem *",
    "style-src-attr https:",
  ])("rejects duplicate or overriding directives: %s", (directive) => {
    const headers = policy();
    headers.append("content-security-policy", directive);
    expect(validateSecurityHeaders(headers).length).toBeGreaterThan(0);
    headers.set(
      "content-security-policy",
      `${policy().get("content-security-policy")}; ${directive}`
    );
    expect(validateSecurityHeaders(headers).length).toBeGreaterThan(0);
  });

  it("accepts reordered directives and stricter script/permission controls", () => {
    const headers = policy();
    const csp = headers
      .get("content-security-policy")!
      .replace("script-src 'self' 'unsafe-inline'", `script-src 'self' 'sha256-${"a".repeat(43)}='`)
      .split(";")
      .reverse()
      .join(";");
    headers.set("content-security-policy", `${csp}; script-src-attr 'none'; style-src-attr 'none'`);
    headers.set("x-frame-options", "DENY");
    headers.set("referrer-policy", "no-referrer");
    headers.set("permissions-policy", "geolocation=(), microphone = (), camera = ()");
    expect(validateSecurityHeaders(headers)).toEqual([]);
  });

  it("rejects missing headers", () => {
    expect(validateSecurityHeaders(new Headers()).length).toBeGreaterThan(6);
  });
});

function siteResponse(url: URL) {
  if (url.pathname === "/__smoke_missing_page__")
    return new Response("Page Not Found", { status: 404, headers: policy() });
  return new Response("Caitlyn Holland", { headers: policy() });
}

describe("live-site checks", () => {
  it("checks homepage, real 404, sitemap and robots without following redirects", async () => {
    const fetchImpl = vi.fn(async (url: URL) => siteResponse(url));
    await checkSite({ fetchImpl });
    expect(fetchImpl.mock.calls.map(([url]) => url.pathname)).toEqual([
      "/",
      "/__smoke_missing_page__",
      "/sitemap.xml",
      "/robots.txt",
    ]);
    for (const call of fetchImpl.mock.calls as unknown[][])
      expect(call[1]).toMatchObject({ redirect: "manual" });
  });

  it.each([
    ["/", 200, "wrong content"],
    ["/", 302, "Caitlyn Holland"],
    ["/__smoke_missing_page__", 200, "Page Not Found"],
    ["/__smoke_missing_page__", 404, "wrong content"],
    ["/sitemap.xml", 404, "missing"],
    ["/robots.txt", 301, "redirect"],
  ])("rejects an unexpected response from %s", async (path, status, body) => {
    await expect(
      checkSite({
        fetchImpl: async (url: URL) =>
          url.pathname === path
            ? new Response(body, { status, headers: policy() })
            : siteResponse(url),
      })
    ).rejects.toThrow();
  });

  it("checks header values on the 404 response too", async () => {
    await expect(
      checkSite({
        fetchImpl: async (url: URL) =>
          url.pathname.includes("missing")
            ? new Response("Page Not Found", { status: 404 })
            : siteResponse(url),
      })
    ).rejects.toThrow("security-header validation failed");
  });

  it("retries transient HTTP and network failures", async () => {
    const sleep = vi.fn(async () => {});
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockImplementation(async (url: URL) => siteResponse(url));
    await checkSite({ fetchImpl, sleep });
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("fails after three unsuccessful requests", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 429 }));
    await expect(checkSite({ fetchImpl, sleep: async () => {} })).rejects.toThrow("HTTP 429");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});

const sha = "a".repeat(40);
const deployment = (overrides = {}) => ({
  id: 1,
  name: "Cloudflare Pages",
  app: { slug: "cloudflare-workers-and-pages" },
  head_sha: sha,
  status: "completed",
  conclusion: "success",
  ...overrides,
});
const options = {
  repository: "owner/repo",
  sha,
  token: "synthetic-test-token",
  sleep: async () => {},
};
const checksResponse = (checks: object[]) => new Response(JSON.stringify({ check_runs: checks }));

describe("production deployment wait", () => {
  it("waits for a matching official check to finish", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(checksResponse([]))
      .mockResolvedValueOnce(
        checksResponse([deployment({ status: "in_progress", conclusion: null })])
      )
      .mockResolvedValueOnce(checksResponse([deployment()]));
    await waitForDeployment({ ...options, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(`/commits/${sha}/check-runs`);
  });

  it("ignores other apps, commits and check names", async () => {
    const fetchImpl = vi.fn(async () =>
      checksResponse([
        deployment({ app: { slug: "untrusted-app" } }),
        deployment({ head_sha: "b".repeat(40) }),
        deployment({ name: "Unrelated" }),
      ])
    );
    await expect(waitForDeployment({ ...options, fetchImpl, attempts: 2 })).rejects.toThrow(
      "Timed out"
    );
  });

  it("uses the newest matching check and rejects deployment failure", async () => {
    const fetchImpl = async () =>
      checksResponse([deployment(), deployment({ id: 2, conclusion: "failure" })]);
    await expect(waitForDeployment({ ...options, fetchImpl })).rejects.toThrow(
      "Cloudflare deployment ended with failure"
    );
  });

  it("fails on an unauthorized API response", async () => {
    await expect(
      waitForDeployment({ ...options, fetchImpl: async () => new Response(null, { status: 403 }) })
    ).rejects.toThrow("HTTP 403");
  });

  it.each([{ repository: "bad/path/more" }, { sha: "invalid" }, { token: "" }])(
    "rejects invalid configuration %j",
    async (invalid) => {
      const fetchImpl = vi.fn();
      await expect(waitForDeployment({ ...options, ...invalid, fetchImpl })).rejects.toThrow();
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  );

  it("CLI reports invalid site URLs without making requests", () => {
    const result = spawnSync(process.execPath, ["scripts/smoke.mjs"], {
      env: { ...process.env, SITE_URL: "invalid" },
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Invalid URL");
  });
});
