---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a subagent.
---

Dispatch a **subagent** to do the research. Subagents here run to completion and report back — you do not keep working alongside one, so scope the question tightly enough that the wait is worth it. Several independent questions can be dispatched at once; one question split across several agents usually cannot.

Its job:

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it under `docs/research/<slug>.md`. Do not write research notes to the repo root — this repo deploys from its root and gates every PR on `prettier --check .`.
4. Run `npm run format` afterwards. A new unformatted Markdown file fails the `Format Check` job.
