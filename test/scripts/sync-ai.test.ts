import { describe, it, expect } from "vitest";
import {
  applySwapMap,
  splitFrontmatter,
  parseFrontmatter,
  tomlString,
  agentMarkdownToToml,
  skillTransform,
} from "../../scripts/sync-ai.mjs";

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

describe("applySwapMap", () => {
  it("applies replacements in order", () => {
    expect(applySwapMap("a b a", [["a", "X"]])).toBe("X b X");
    expect(
      applySwapMap("foo", [
        ["foo", "bar"],
        ["bar", "baz"],
      ])
    ).toBe("baz");
  });
  it("is a no-op with the default empty map", () => {
    expect(applySwapMap("unchanged")).toBe("unchanged");
  });
});

describe("splitFrontmatter", () => {
  it("separates frontmatter and body", () => {
    const { frontmatter, body } = splitFrontmatter(SKILL_FIXTURE);
    expect(frontmatter).toBe("---\nname: sample-skill\ndescription: A sample skill.\n---\n");
    expect(body).toBe("\n# Sample\n\nBody text.\n");
  });
  it("normalizes CRLF", () => {
    const { body } = splitFrontmatter("---\r\nname: x\r\n---\r\nB\r\n");
    expect(body).toBe("B\n");
  });
  it("throws on unterminated frontmatter", () => {
    expect(() => splitFrontmatter("---\nname: x\n")).toThrow(/Unterminated/);
  });
});

describe("parseFrontmatter", () => {
  it("parses flat keys and strips quotes", () => {
    const { data } = parseFrontmatter(AGENT_FIXTURE);
    expect(data.name).toBe("sample-agent");
    expect(data.description).toBe("A sample agent — does things.");
    expect(data.model).toBe("sonnet");
  });
});

describe("tomlString", () => {
  it("uses a basic string and escapes backslashes/quotes", () => {
    expect(tomlString("plain")).toBe('"plain"');
    expect(tomlString("a\\b")).toBe('"a\\\\b"');
  });
  it("uses a literal string when the value has a double quote but no single quote", () => {
    expect(tomlString('say "hi"')).toBe(`'say "hi"'`);
  });
});

describe("agentMarkdownToToml", () => {
  const toml = agentMarkdownToToml(AGENT_FIXTURE, ".claude/agents/sample-agent.md");

  it("emits the generated header with the source path", () => {
    expect(toml).toContain(
      "# AUTO-GENERATED from .claude/agents/sample-agent.md by scripts/sync-ai.mjs — do not edit."
    );
  });
  it("emits name and description as TOML strings", () => {
    expect(toml).toContain('name = "sample-agent"');
    expect(toml).toContain('description = "A sample agent — does things."');
  });
  it("drops Claude-only frontmatter (tools, model)", () => {
    expect(toml).not.toMatch(/^tools = /m);
    expect(toml).not.toMatch(/^model = /m);
  });
  it("embeds the body in a TOML literal string", () => {
    expect(toml).toContain("developer_instructions = '''");
    expect(toml).toContain("# Heading");
    expect(toml.trimEnd().endsWith("'''")).toBe(true);
  });
  it("preserves backslashes/regex verbatim (literal string, no escaping)", () => {
    expect(toml).toContain("s/^v([0-9]+\\.[0-9]+)$/\\1/");
  });
  it("throws when the body contains a ''' sequence", () => {
    const bad = "---\nname: x\ndescription: y\n---\n\nhas ''' triple\n";
    expect(() => agentMarkdownToToml(bad, ".claude/agents/x.md")).toThrow(/'''/);
  });
});

describe("skillTransform", () => {
  const out = skillTransform(SKILL_FIXTURE, ".claude/skills/sample-skill/SKILL.md");

  it("preserves the frontmatter verbatim at the top", () => {
    expect(out.startsWith("---\nname: sample-skill\ndescription: A sample skill.\n---\n")).toBe(
      true
    );
  });
  it("inserts the generated marker after the frontmatter, before the body", () => {
    expect(out).toContain(
      "<!-- AUTO-GENERATED from .claude/skills/sample-skill/SKILL.md by scripts/sync-ai.mjs — do not edit."
    );
    expect(out.indexOf("AUTO-GENERATED")).toBeLessThan(out.indexOf("# Sample"));
  });
  it("keeps the body", () => {
    expect(out).toContain("# Sample");
    expect(out).toContain("Body text.");
  });
});
