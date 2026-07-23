#!/usr/bin/env node
// Generate the Codex AI-tool configs from the authored .claude/ sources.
// Single source of truth: edit .claude/agents/*.md and .claude/skills/*/SKILL.md,
// then run `npm run sync:ai`. The .codex/ and .agents/ mirrors are generated —
// do not edit them by hand. The `AI Config Parity` CI job fails if they drift.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Repo root is the parent of scripts/.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Exact-string replacements applied to generated (Codex) content. Empty today
// because the .claude/ sources are authored tool-neutral; this is the seam for
// genuinely tool-specific tokens or a future third tool. Order matters.
export const SWAP_MAP = [];

export function applySwapMap(text, swaps = SWAP_MAP) {
  return swaps.reduce((acc, [from, to]) => acc.split(from).join(to), text);
}

// Split raw file text into its frontmatter block (including the `---`
// delimiters) and the body. Newlines are normalized to \n so output is
// identical on Windows and Linux.
export function splitFrontmatter(raw) {
  const norm = raw.replace(/\r\n/g, "\n");
  if (!norm.startsWith("---\n")) {
    return { frontmatter: "", body: norm };
  }
  const end = norm.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error("Unterminated frontmatter (missing closing ---)");
  }
  return {
    frontmatter: norm.slice(0, end + 5), // through the closing "---\n"
    body: norm.slice(end + 5),
  };
}

// Parse the flat `key: value` frontmatter into an object. Quoted values are
// unquoted. Assumes single-line values (matches our sources).
export function parseFrontmatter(raw) {
  const { frontmatter, body } = splitFrontmatter(raw);
  const inner = frontmatter.replace(/^---\n/, "").replace(/\n---\n$/, "");
  /** @type {Record<string, string>} */
  const data = {};
  for (const line of inner.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[m[1]] = value;
  }
  return { data, body };
}

// Render a single-line TOML string. Uses a literal string when the value has a
// double quote but no single quote; otherwise a basic string with backslashes
// and double quotes escaped.
export function tomlString(value) {
  if (value.includes('"') && !value.includes("'")) {
    return `'${value}'`;
  }
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

// Convert a Claude agent (.md + YAML frontmatter) into a Codex agent (.toml).
// Drops Claude-only frontmatter (tools, model). The body is embedded in a TOML
// multi-line *literal* string ('''), which performs no escape processing, so
// arbitrary markdown/regex/backslashes embed verbatim. The one sequence a
// literal string cannot hold is ''' itself — assert it is absent.
export function agentMarkdownToToml(raw, sourcePath) {
  const { data, body } = parseFrontmatter(raw);
  const outBody = applySwapMap(body).replace(/\s+$/, "");
  if (outBody.includes("'''")) {
    throw new Error(
      `Agent body for ${sourcePath} contains ''' which cannot be embedded in a TOML literal string`
    );
  }
  return [
    `# AUTO-GENERATED from ${sourcePath} by scripts/sync-ai.mjs — do not edit.`,
    "# Edit the source and run `npm run sync:ai`.",
    `name = ${tomlString(applySwapMap(data.name ?? ""))}`,
    `description = ${tomlString(applySwapMap(data.description ?? ""))}`,
    "developer_instructions = '''",
    outBody,
    "'''",
    "",
  ].join("\n");
}

// Convert a Claude skill (SKILL.md) into a Codex skill (SKILL.md): keep the
// frontmatter verbatim, insert a generated-marker comment, apply swaps to body.
export function skillTransform(raw, sourcePath) {
  const { frontmatter, body } = splitFrontmatter(raw);
  const marker = `<!-- AUTO-GENERATED from ${sourcePath} by scripts/sync-ai.mjs — do not edit. Edit the source and run \`npm run sync:ai\`. -->`;
  const outBody = applySwapMap(body).replace(/^\n+/, "");
  return `${frontmatter}\n${marker}\n\n${outBody}`;
}

// Discover source -> dest pairs by convention. Paths use forward slashes so the
// text embedded in generated files is identical on every platform.
function discover() {
  const pairs = [];
  const agentsDir = join(ROOT, ".claude", "agents");
  if (existsSync(agentsDir)) {
    for (const file of readdirSync(agentsDir)) {
      if (!file.endsWith(".md")) continue;
      pairs.push({
        kind: "agent",
        src: `.claude/agents/${file}`,
        dest: `.codex/agents/${file.replace(/\.md$/, ".toml")}`,
      });
    }
  }
  const skillsDir = join(ROOT, ".claude", "skills");
  if (existsSync(skillsDir)) {
    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const rel = `.claude/skills/${entry.name}/SKILL.md`;
      if (!existsSync(join(ROOT, rel))) continue;
      pairs.push({ kind: "skill", src: rel, dest: `.agents/skills/${entry.name}/SKILL.md` });
    }
  }
  return pairs;
}

// Generate every mirror. Returns [{ dest, content }]; writes to disk unless write=false.
export function syncAll({ write = true } = {}) {
  const results = [];
  for (const { kind, src, dest } of discover()) {
    const raw = readFileSync(join(ROOT, src), "utf8");
    const content = kind === "agent" ? agentMarkdownToToml(raw, src) : skillTransform(raw, src);
    if (write) {
      const destAbs = join(ROOT, dest);
      mkdirSync(dirname(destAbs), { recursive: true });
      writeFileSync(destAbs, content);
    }
    results.push({ dest, content });
  }
  return results;
}

function main() {
  for (const { dest } of syncAll()) {
    console.log(`wrote ${dest}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
