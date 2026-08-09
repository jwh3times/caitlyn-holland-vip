import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { syncAll } from "../../scripts/sync-ai.mjs";

const AGENT_FIXTURE = `---
name: sample-agent
description: A sample agent — does things.
tools: Read, Write, Grep
model: sonnet
---

# Heading

Body with \`code\` and a regex like s/^v([0-9]+\\.[0-9]+)$/\\1/ and pipes | here.
`;

const SKILL_FIXTURE = `---
name: sample-skill
description: A sample skill.
---

# Sample

Body text.
`;

let fixtureRoot: string;

function writeFixture(relativePath: string, content: string) {
  const absolutePath = join(fixtureRoot, relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content);
}

beforeEach(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), "sync-ai-"));
});

afterEach(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

describe("syncAll", () => {
  it("discovers and transforms agents beneath the supplied root", () => {
    writeFixture(".claude/agents/sample-agent.md", AGENT_FIXTURE);

    const results = syncAll({ root: fixtureRoot, write: false });

    expect(results).toHaveLength(1);
    const result = results[0]!;
    expect(result.dest).toBe(".codex/agents/sample-agent.toml");
    expect(result.content).toContain('name = "sample-agent"');
    expect(result.content).toContain('description = "A sample agent — does things."');
    expect(result.content).toContain("# Heading");
    expect(result.content).toContain(
      "# AUTO-GENERATED from .claude/agents/sample-agent.md by scripts/sync-ai.mjs"
    );
    expect(result.content).not.toMatch(/^tools = /m);
    expect(result.content).not.toMatch(/^model = /m);
    expect(result.content).toContain("s/^v([0-9]+\\.[0-9]+)$/\\1/");
  });

  it("mirrors complete skill trees and skips directories without SKILL.md", () => {
    const shell = "#!/usr/bin/env bash\nset -euo pipefail\n";
    writeFixture(".agents/skills/sample/SKILL.md", SKILL_FIXTURE);
    writeFixture(
      ".agents/skills/sample/agents/openai.yaml",
      "interface:\r\n  display_name: Sample\r\n"
    );
    writeFixture(".agents/skills/sample/scripts/run.sh", shell);
    writeFixture(".agents/skills/sample/data.txt", "raw\r\n");
    writeFixture(".agents/skills/stray/notes.md", "not a skill\n");

    const results = syncAll({ root: fixtureRoot, write: false });

    expect(results.map(({ dest }) => dest).sort()).toEqual([
      ".claude/skills/sample/SKILL.md",
      ".claude/skills/sample/agents/openai.yaml",
      ".claude/skills/sample/data.txt",
      ".claude/skills/sample/scripts/run.sh",
    ]);
    expect(results.find(({ dest }) => dest.endsWith("SKILL.md"))?.content).toContain(
      "<!-- AUTO-GENERATED"
    );
    expect(results.find(({ dest }) => dest.endsWith("openai.yaml"))?.content).toContain(
      "# AUTO-GENERATED"
    );
    expect(results.find(({ dest }) => dest.endsWith("openai.yaml"))?.content).toContain(
      "interface:\n  display_name: Sample\n"
    );
    expect(results.find(({ dest }) => dest.endsWith("data.txt"))?.content).toBe("raw\n");
    expect(results.find(({ dest }) => dest.endsWith("run.sh"))?.content).toBe(shell);
  });

  it("handles quoted frontmatter and TOML escaping through the public interface", () => {
    const source = `---
name: "quoted-name"
description: 'Path C:\\temp'
---

body
`;
    writeFixture(".claude/agents/quoted.md", source);

    const result = syncAll({ root: fixtureRoot, write: false })[0]!;

    expect(result.content).toContain('name = "quoted-name"');
    expect(result.content).toContain('description = "Path C:\\\\temp"');
  });

  it("rejects agent bodies that cannot be embedded in TOML literal strings", () => {
    writeFixture(
      ".claude/agents/invalid.md",
      "---\nname: invalid\ndescription: invalid\n---\n\ncontains ''' here\n"
    );

    expect(() => syncAll({ root: fixtureRoot, write: false })).toThrow(/'''/);
  });

  it("rejects unterminated frontmatter through the public interface", () => {
    writeFixture(".claude/agents/invalid.md", "---\nname: invalid\n");

    expect(() => syncAll({ root: fixtureRoot, write: false })).toThrow(/Unterminated/);
  });

  it("deletes orphaned mirrors and removes empty skill directories", () => {
    writeFixture(".agents/skills/sample/SKILL.md", SKILL_FIXTURE);
    syncAll({ root: fixtureRoot, write: true });
    const sourceDir = join(fixtureRoot, ".agents", "skills", "sample");
    const mirrorDir = join(fixtureRoot, ".claude", "skills", "sample");
    const mirrorFile = join(mirrorDir, "SKILL.md");
    expect(existsSync(mirrorFile)).toBe(true);

    rmSync(sourceDir, { recursive: true });
    syncAll({ root: fixtureRoot, write: true });

    expect(existsSync(mirrorFile)).toBe(false);
    expect(existsSync(mirrorDir)).toBe(false);
  });

  it("does not change the fixture tree when write is false", () => {
    writeFixture(".agents/skills/sample/SKILL.md", SKILL_FIXTURE);
    writeFixture(".claude/skills/orphan/SKILL.md", "orphan\n");
    const generatedMirror = join(fixtureRoot, ".claude", "skills", "sample", "SKILL.md");
    const orphanMirror = join(fixtureRoot, ".claude", "skills", "orphan", "SKILL.md");

    const results = syncAll({ root: fixtureRoot, write: false });

    expect(results.map(({ dest }) => dest)).toContain(".claude/skills/sample/SKILL.md");
    expect(existsSync(generatedMirror)).toBe(false);
    expect(existsSync(orphanMirror)).toBe(true);
  });

  it("exports syncAll as its only public interface", async () => {
    const syncModule = await import("../../scripts/sync-ai.mjs");

    expect(Object.keys(syncModule)).toEqual(["syncAll"]);
  });
});
