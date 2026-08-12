import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guards the ADR-0008 opt-out: `next dev` on Next.js 16.3+ appends a managed
// <!-- BEGIN:nextjs-agent-rules --> block to AGENTS.md whenever it detects a coding
// agent, unless `agentRules: false` is set. Both halves are asserted here because
// dropping the flag re-dirties the tree silently, on someone else's machine.
// Vitest runs from the repo root; import.meta.url is not a file URL under jsdom.
const read = (file: string) => readFileSync(join(process.cwd(), file), "utf-8");

const AGENT_RULES_MARKER = "nextjs-agent-rules";

describe("next.config.ts", () => {
  it("opts out of Next.js agent-rules auto-generation", () => {
    expect(read("next.config.ts")).toMatch(/agentRules:\s*false/);
  });

  it("uses Next.js's default project-local TypeScript CLI", () => {
    expect(read("next.config.ts")).not.toContain("useTypeScriptCli");
  });
});

describe.each(["AGENTS.md", "CLAUDE.md"])("%s", (file) => {
  it("carries no tool-generated agent-rules block", () => {
    // The marker is named rather than inlined so this test does not itself
    // contain the literal string the generator looks for.
    expect(read(file)).not.toContain(`<!-- BEGIN:${AGENT_RULES_MARKER} -->`);
  });
});
