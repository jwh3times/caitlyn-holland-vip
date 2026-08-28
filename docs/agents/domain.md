# Domain docs

How the engineering skills should consume this repo's domain documentation when exploring the
codebase.

## Before exploring, read these

- **[`CONTEXT.md`](../../CONTEXT.md)** at the repo root — the glossary. This repo is
  single-context, so there is one.
- **[`docs/adr/`](../adr/)** — the ADRs touching the area you are about to work in. One decision
  per file, newest number last.

The `/domain-modeling` skill maintains both — reached directly, or pulled in by `/grilling`, which
runs it alongside the interview whenever there is a repo under the conversation. Terms and
decisions are recorded as they get resolved, not batched up front.

## Use the glossary's vocabulary

When your output names a domain concept — an issue title, a refactor proposal, a hypothesis, a test
name — use the term as `CONTEXT.md` defines it, and avoid the synonyms it lists. The glossary
carries two vocabularies: one for the site, one for the repo machinery that keeps AI-tool config in
sync.

If the concept you need is not in the glossary, that is a signal — either you are inventing language
the project does not use (reconsider), or there is a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it rather than silently overriding:

> _Contradicts [ADR-0005](../adr/0005-theme-access-behind-use-theme-toggle.md) (theme access goes
> through `useThemeToggle()`) — but worth reopening because…_

A superseded decision stays in place with a `status:` note pointing at its replacement — see
[ADR-0004](../adr/0004-test-split-vitest-playwright.md). Do not delete an ADR to reverse it; write
the new one and mark the old.
