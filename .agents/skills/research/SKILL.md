---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a subagent.
---

Dispatch a **subagent** to do the research. Subagents here run to completion and report back — you do not keep working alongside one, so scope the question tightly enough that the wait is worth it. Several independent questions can be dispatched at once; one question split across several agents usually cannot.

Its job:

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Classify the findings before saving them, and route the file accordingly:
   - **Public-safe** — the ordinary case, and the default. Save under `docs/research/<slug>.md` in this repository. Do not write research notes to the repo root — this repo deploys from its root and gates every PR on `prettier --check .`.
   - **Would leak private material** — private context, or findings that only make sense alongside it. Save it in the private companion under `private/` and commit it to that remote only.
   - **Details of an unpublished vulnerability** — a draft security advisory in this repository. Never a research file, in either repository.
   - **Credentials, tokens, or repository locators** — never written to either repository. Use placeholders and leave the real values in 1Password.

   [The destination policy](../../../docs/agents/issue-tracker.md#where-a-work-item-goes) is canonical when a document straddles these, and [secret prevention](../../../docs/agents/secret-prevention.md) covers the scan to run before publishing. Read the finished file yourself before committing it: the subagent wrote it without classifying it, and `docs/research/` is public the moment it merges.

4. Run `npm run format` afterwards. A new unformatted Markdown file fails the `Format Check` job.
