#!/usr/bin/env node
// Generate the mirrored AI-tool configs from their authored sources.
//
// Two source trees, because the two kinds of config have different shapes:
//   - Skills: .agents/skills/<name>/**  ->  .claude/skills/<name>/**
//     The whole skill directory is mirrored, not just SKILL.md, so every
//     auxiliary file (agents/openai.yaml, scripts/*.sh, reference docs) is
//     covered by drift detection. Vendored skills are fetched into .agents/
//     by the skills installer and pinned in skills-lock.json.
//   - Agents: .claude/agents/*.md  ->  .codex/agents/*.toml
//     This stays .claude-authored because it is a format conversion
//     (markdown + YAML frontmatter -> TOML), not a copy.
//
// Edit the source, then run `npm run sync:ai`. The generated trees
// (.claude/skills/ and .codex/) must not be edited by hand — the
// `AI Config Parity` CI job fails if they drift.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname, extname } from "node:path";
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

// Mirror a markdown skill file: keep the frontmatter verbatim, insert a
// generated-marker comment, apply swaps to the body.
export function skillTransform(raw, sourcePath) {
  const { frontmatter, body } = splitFrontmatter(raw);
  const marker = `<!-- AUTO-GENERATED from ${sourcePath} by scripts/sync-ai.mjs — do not edit. Edit the source and run \`npm run sync:ai\`. -->`;
  const outBody = applySwapMap(body).replace(/^\n+/, "");
  return `${frontmatter}\n${marker}\n\n${outBody}`;
}

// Mirror a YAML skill file. A leading `#` comment is valid anywhere in YAML,
// so the marker goes on top without disturbing the document.
export function yamlTransform(raw, sourcePath) {
  const norm = raw.replace(/\r\n/g, "\n");
  const marker = `# AUTO-GENERATED from ${sourcePath} by scripts/sync-ai.mjs — do not edit.\n# Edit the source and run \`npm run sync:ai\`.`;
  return `${marker}\n${applySwapMap(norm)}`;
}

// Pick the mirror transform for a skill file. Markdown and YAML get a
// provenance banner; everything else (shell templates, and any binary-ish
// asset a skill ships) is copied byte-for-byte. Executables must stay
// executable and shebangs must stay on line 1, so no banner is injected
// there — drift is still caught, because the mirror is compared by content.
export function skillFileTransform(raw, sourcePath) {
  const ext = extname(sourcePath).toLowerCase();
  if (ext === ".md") return skillTransform(raw, sourcePath);
  if (ext === ".yaml" || ext === ".yml") return yamlTransform(raw, sourcePath);
  return applySwapMap(raw.replace(/\r\n/g, "\n"));
}

// Recursively list files under `dir`, returned as paths relative to `dir`
// with forward slashes, sorted so output order is stable across platforms.
function listFilesRecursive(dir, prefix = "") {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...listFilesRecursive(join(dir, entry.name), rel));
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out.sort();
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
  const skillsDir = join(ROOT, ".agents", "skills");
  if (existsSync(skillsDir)) {
    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      // A directory without a SKILL.md is not a skill; skip it rather than
      // mirroring stray files into .claude/.
      if (!existsSync(join(skillsDir, entry.name, "SKILL.md"))) continue;
      for (const rel of listFilesRecursive(join(skillsDir, entry.name))) {
        pairs.push({
          kind: "skill",
          src: `.agents/skills/${entry.name}/${rel}`,
          dest: `.claude/skills/${entry.name}/${rel}`,
        });
      }
    }
  }
  return pairs;
}

// Generate every mirror. Returns [{ dest, content }]; writes to disk unless write=false.
export function syncAll({ write = true } = {}) {
  const results = [];
  for (const { kind, src, dest } of discover()) {
    const raw = readFileSync(join(ROOT, src), "utf8");
    const content = kind === "agent" ? agentMarkdownToToml(raw, src) : skillFileTransform(raw, src);
    if (write) {
      const destAbs = join(ROOT, dest);
      mkdirSync(dirname(destAbs), { recursive: true });
      writeFileSync(destAbs, content);
    }
    results.push({ dest, content });
  }
  if (write) {
    pruneOrphans(results.map((r) => r.dest));
  }
  return results;
}

// Delete anything under .claude/skills/ that the current sources no longer
// produce. Without this, removing a skill from .agents/ would leave its
// mirror behind as a committed orphan that `AI Config Parity` cannot see:
// the job diffs the working tree after regenerating, and an untouched
// committed file is not dirty. Pruning turns that into a visible deletion.
export function pruneOrphans(generatedDests) {
  const skillsDest = join(ROOT, ".claude", "skills");
  if (!existsSync(skillsDest)) return [];
  const expected = new Set(generatedDests);
  const removed = [];
  for (const entry of readdirSync(skillsDest, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dirAbs = join(skillsDest, entry.name);
    for (const rel of listFilesRecursive(dirAbs)) {
      const dest = `.claude/skills/${entry.name}/${rel}`;
      if (!expected.has(dest)) {
        rmSync(join(ROOT, dest));
        removed.push(dest);
      }
    }
    // Drop the directory itself once it holds no generated files.
    if (listFilesRecursive(dirAbs).length === 0) {
      rmSync(dirAbs, { recursive: true, force: true });
    }
  }
  return removed;
}

function main() {
  for (const { dest } of syncAll()) {
    console.log(`wrote ${dest}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
