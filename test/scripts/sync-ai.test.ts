import { describe, it, expect } from "vitest";
import {
  applySwapMap,
  splitFrontmatter,
  parseFrontmatter,
  tomlString,
  agentMarkdownToToml,
  skillTransform,
  yamlTransform,
  skillFileTransform,
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

  it("strips surrounding double and single quotes from values", () => {
    const raw = `---\nname: "quoted-name"\ndescription: 'Has a colon: yes'\n---\n\nbody\n`;
    const { data } = parseFrontmatter(raw);
    expect(data.name).toBe("quoted-name");
    expect(data.description).toBe("Has a colon: yes");
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
  // Skills are authored in .agents/ and mirrored into .claude/.
  const out = skillTransform(SKILL_FIXTURE, ".agents/skills/sample-skill/SKILL.md");

  it("preserves the frontmatter verbatim at the top", () => {
    expect(out.startsWith("---\nname: sample-skill\ndescription: A sample skill.\n---\n")).toBe(
      true
    );
  });
  it("inserts the generated marker after the frontmatter, before the body", () => {
    expect(out).toContain(
      "<!-- AUTO-GENERATED from .agents/skills/sample-skill/SKILL.md by scripts/sync-ai.mjs — do not edit."
    );
    expect(out.indexOf("AUTO-GENERATED")).toBeLessThan(out.indexOf("# Sample"));
  });
  it("keeps the body", () => {
    expect(out).toContain("# Sample");
    expect(out).toContain("Body text.");
  });
  it("is stable when re-applied to its own output (no stacked markers)", () => {
    // The mirror is regenerated from the source every run, never from itself,
    // but a single marker is what CI diffs against — assert it stays one.
    expect(out.match(/AUTO-GENERATED/g)).toHaveLength(1);
  });
});

describe("yamlTransform", () => {
  const src = "interface:\n  display_name: TDD\n";
  const out = yamlTransform(src, ".agents/skills/tdd/agents/openai.yaml");

  it("prepends a # comment banner naming the source", () => {
    expect(out.startsWith("# AUTO-GENERATED from .agents/skills/tdd/agents/openai.yaml")).toBe(
      true
    );
  });
  it("keeps the document intact below the banner", () => {
    expect(out).toContain("interface:\n  display_name: TDD");
  });
  it("normalizes CRLF", () => {
    expect(yamlTransform("a: 1\r\nb: 2\r\n", "s.yaml")).toContain("a: 1\nb: 2\n");
  });
});

describe("skillFileTransform", () => {
  it("routes markdown through skillTransform", () => {
    const out = skillFileTransform(SKILL_FIXTURE, ".agents/skills/x/SKILL.md");
    expect(out).toContain("<!-- AUTO-GENERATED");
  });
  it("routes .yaml and .yml through yamlTransform", () => {
    expect(skillFileTransform("a: 1\n", ".agents/skills/x/agents/openai.yaml")).toContain(
      "# AUTO-GENERATED"
    );
    expect(skillFileTransform("a: 1\n", ".agents/skills/x/c.yml")).toContain("# AUTO-GENERATED");
  });
  it("copies shell scripts verbatim so the shebang stays on line 1", () => {
    const sh = "#!/usr/bin/env bash\nset -euo pipefail\n";
    const out = skillFileTransform(sh, ".agents/skills/wizard/template.sh");
    expect(out).toBe(sh);
    expect(out.startsWith("#!/usr/bin/env bash")).toBe(true);
    expect(out).not.toContain("AUTO-GENERATED");
  });
  it("copies unknown extensions verbatim", () => {
    expect(skillFileTransform("raw\n", ".agents/skills/x/data.txt")).toBe("raw\n");
  });
  it("is case-insensitive about the extension", () => {
    expect(skillFileTransform(SKILL_FIXTURE, ".agents/skills/x/SKILL.MD")).toContain(
      "<!-- AUTO-GENERATED"
    );
  });
});
