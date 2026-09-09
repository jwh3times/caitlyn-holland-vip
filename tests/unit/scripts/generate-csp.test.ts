import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { generateCsp } from "../../../scripts/generate-csp.mjs";

const temporary: string[] = [];
const template =
  "/*\n  X-Content-Type-Options: nosniff\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'\n";
const hash = (text: string) => `'sha256-${createHash("sha256").update(text).digest("base64")}'`;
async function fixture(html = "<script>window.ready = true;</script>", source = template) {
  const root = await mkdtemp(join(tmpdir(), "csp-test-"));
  temporary.push(root);
  const out = join(root, "out");
  await mkdir(out);
  const headers = join(root, "source-headers");
  await writeFile(headers, source);
  await writeFile(join(out, "index.html"), html);
  await writeFile(join(out, "404.html"), "<script>window.missing = true;</script>");
  await writeFile(join(out, "_headers"), "sentinel");
  return { out, headers };
}
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("static export CSP generation", () => {
  it("hashes browser-visible UTF-8 text, preserves whitespace and ignores external scripts", async () => {
    const script = '\nwindow.text = "café &amp; tea";\n';
    const { out, headers } = await fixture(
      `<script>${script}</script><script src="/app.js">ignored</script><script type="application/ld+json">{"name":"Caitlyn"}</script>`
    );
    await generateCsp(out, headers);
    const result = await readFile(join(out, "_headers"), "utf8");
    expect(result).toContain(hash(script));
    expect(result).toContain(hash('{"name":"Caitlyn"}'));
    expect(result).not.toContain(hash(script.trim()));
    expect(result).not.toContain(hash("ignored"));
    expect(await readFile(headers, "utf8")).toBe(template);
    expect(result).toContain("X-Content-Type-Options: nosniff");
    expect(result).toContain("style-src 'self' 'unsafe-inline'");
    expect(result).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it("includes nested and fallback documents, deduplicates and regenerates after content changes", async () => {
    const { out, headers } = await fixture();
    await mkdir(join(out, "nested"));
    await writeFile(
      join(out, "nested", "index.html"),
      "<script>window.ready = true;</script><script>window.nested = true;</script>"
    );
    await writeFile(join(out, "ignored.txt"), "<script>ignored</script>");
    expect(await generateCsp(out, headers)).toMatchObject({ documents: 3, hashes: 3 });
    const first = await readFile(join(out, "_headers"), "utf8");
    expect(first).toContain(hash("window.missing = true;"));
    expect(first).toContain(hash("window.nested = true;"));
    await generateCsp(out, headers);
    expect(await readFile(join(out, "_headers"), "utf8")).toBe(first);
    await writeFile(join(out, "404.html"), "<script>window.changed = true;</script>");
    await generateCsp(out, headers);
    const changed = await readFile(join(out, "_headers"), "utf8");
    expect(changed).toContain(hash("window.changed = true;"));
    expect(changed).not.toContain(hash("window.missing = true;"));
  });

  it("fails before writing when the complete header line exceeds the platform limit", async () => {
    const { out, headers } = await fixture(
      Array.from({ length: 40 }, (_, i) => `<script>window.value = ${i}</script>`).join("")
    );
    await expect(generateCsp(out, headers)).rejects.toThrow("2,000 characters");
    expect(await readFile(join(out, "_headers"), "utf8")).toBe("sentinel");
  });

  it.each(["index.html", "404.html"])("rejects an incomplete export missing %s", async (file) => {
    const { out, headers } = await fixture();
    await rm(join(out, file));
    await expect(generateCsp(out, headers)).rejects.toThrow("Missing exported");
  });

  it("rejects an empty inline-script inventory", async () => {
    const { out, headers } = await fixture("<p>empty</p>");
    await writeFile(join(out, "404.html"), "<p>missing</p>");
    await expect(generateCsp(out, headers)).rejects.toThrow("No inline scripts");
  });

  it.each([
    "/*\n  X-Frame-Options: DENY",
    template + "  Content-Security-Policy: script-src 'self'\n",
    template.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"),
    template.replace("script-src 'self'", "script-src 'self'; script-src-elem 'unsafe-inline'"),
  ])("rejects an unexpected template", async (source) => {
    const { out, headers } = await fixture(undefined, source);
    await expect(generateCsp(out, headers)).rejects.toThrow();
    expect(await readFile(join(out, "_headers"), "utf8")).toBe("sentinel");
  });
});
