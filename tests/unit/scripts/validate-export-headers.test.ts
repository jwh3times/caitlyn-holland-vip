import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateExportHeaders } from "../../../scripts/validate-export-headers.mjs";

const temporary: string[] = [];
async function fixture(change = (text: string) => text) {
  const root = await mkdtemp(join(tmpdir(), "compat-csp-test-"));
  temporary.push(root);
  const out = join(root, "out");
  await mkdir(out);
  const headers = join(root, "source-headers");
  const source = change(await readFile("public/_headers", "utf8"));
  await writeFile(headers, source);
  await writeFile(join(out, "_headers"), source);
  await writeFile(join(out, "index.html"), "<script>window.ready=true</script>");
  await writeFile(join(out, "404.html"), "<p>Page Not Found</p>");
  return { out, headers, source };
}
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});
describe("static compatibility export headers", () => {
  it("validates copied policy without adding hashes, cache overrides or rewriting files", async () => {
    const { out, headers, source } = await fixture();
    await validateExportHeaders(out, headers);
    expect(await readFile(join(out, "_headers"), "utf8")).toBe(source);
    expect(source).not.toContain("sha256-");
    expect(source).not.toContain("no-transform");
  });
  it("rejects stale generated headers without modifying them", async () => {
    const { out, headers } = await fixture();
    await writeFile(join(out, "_headers"), "stale");
    await expect(validateExportHeaders(out, headers)).rejects.toThrow("match public/_headers");
    expect(await readFile(join(out, "_headers"), "utf8")).toBe("stale");
  });
  it.each(["index.html", "404.html"])("requires %s", async (file) => {
    const { out, headers } = await fixture();
    await rm(join(out, file));
    await expect(validateExportHeaders(out, headers)).rejects.toThrow();
  });
  it.each([
    (s: string) => s + "\n/other\n  X-Frame-Options: DENY\n",
    (s: string) => s + "#".repeat(2001),
    (s: string) => s.replace("script-src 'self'", "script-src 'self' 'sha256-abc='"),
    (s: string) => s.replace("https://static.cloudflareinsights.com", ""),
    (s: string) => s.replace("object-src 'none'", "object-src *"),
    (s: string) => s + "  Cache-Control: no-transform\n",
  ])("rejects invalid policy, size or scope", async (change) => {
    const { out, headers, source } = await fixture(change);
    await expect(validateExportHeaders(out, headers)).rejects.toThrow();
    expect(await readFile(join(out, "_headers"), "utf8")).toBe(source);
  });
});
