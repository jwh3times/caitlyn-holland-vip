---
name: ask-matt
description: Ask which skill or flow fits your situation. A router over the skills in this repo.
disable-model-invocation: true
---

<!-- AUTO-GENERATED from .agents/skills/ask-matt/SKILL.md by scripts/sync-ai.mjs — do not edit. Edit the source and run `npm run sync:ai`. -->

# Ask Matt

You don't remember every skill, so ask.

A **flow** is a path through the skills. Most paths run along one **main flow**; everything else is standalone, or a vocabulary layer that runs underneath.

## The main flow: idea → ship

The route most work travels. You have an idea and want it built and merged.

1. **`/grilling`** — sharpen the idea by interview. In a repo it runs `/domain-modeling` alongside, so terms land in `CONTEXT.md` and hard-to-reverse decisions land in `docs/adr/` as they settle. Outside a working directory it runs the interview alone.
2. **Branch — can you settle every question in conversation?** If a question needs a runnable answer (state, business logic, a UI you have to see), detour through a prototype, bridged by **`/handoff`** in both directions — a prototype lives in its own directory, which is exactly what `/handoff` is for (see Phase boundaries):
   - **`/handoff`** out, then open a fresh session against that file,
   - **`/prototype`** to answer the question with throwaway code,
   - **`/handoff`** back what you learned, and reference it from the original idea thread.
3. **Branch — is this a multi-session build?**
   - **Yes** → **`/to-spec`** to turn the thread into a spec, then **`/to-tickets`** to split it into tracer-bullet tickets, each declaring its blocking edges as GitHub issue dependencies. Work each ticket in its own session, **`/clear`ing context between them** — each is self-contained, so the last one's context is disposable.
   - **No** → build it right here, in the same context window.
4. **Build with `/tdd`** — one red-green slice at a time. Reach for it on its own whenever you want a concrete behaviour built test-first without a full spec.
5. **Review the diff.** This repo no longer vendors a review skill; Claude Code's built-in `/code-review` covers it. Do this before shipping, not after.
6. **`/ship`** — the terminal step, and the one most easily forgotten. It refreshes the docs, computes the version this merge will mint, writes the `CHANGELOG.md` entry for that version, runs the fast checks, pushes, and opens the PR. Stopping at "committed" leaves the branch short of the `Changelog Version` CI gate. Say "ship it" when the branch is ready.

### Context hygiene

Keep steps 1–3 in **one unbroken context window** — don't compact or clear until after `/to-tickets` — so the grilling, spec, and tickets all build on the same thinking. Each build session then starts fresh from the ticket.

The limit is the **[smart zone](https://www.aihero.dev/ai-coding-dictionary/smart-zone)**: the window within which the model still reasons sharply, which is well short of the context window it advertises. If a session starts to drift before `/to-tickets`, don't push on degraded — `/compact` at the nearest phase boundary and carry on (see Phase boundaries).

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Something's broken** → **`/diagnosing-bugs`**. For the hard ones: the bug that resists a first glance, the intermittent flake, the regression that crept in between two known-good states. It refuses to theorise until it has a **tight feedback loop** — one command that already goes red on _this_ bug — then fixes with a regression test.

## Vocabulary underneath

Two model-invoked references that run _beneath_ the other skills — each the single source of truth for its vocabulary. Reach for them directly when the **words**, not the process, are the problem; or let the skills above pull them in.

- **`/domain-modeling`** — sharpen the project's _domain_ language: challenge a fuzzy term, resolve an overloaded word, record a hard-to-reverse decision as an ADR. It is the discipline `/grilling` drives to keep `CONTEXT.md` a clean glossary.
- **`/codebase-design`** — the deep-module vocabulary (module, interface, depth, seam, adapter, leverage, locality) for designing a module's _shape_: a lot of behaviour behind a small interface at a clean seam. `/tdd` speaks it.

## Phase boundaries

A **phase** is a chunk of work inside a session — the grilling, the implementation, the QA. At the **boundary** between two of them you have five options, and picking between them is the fuzziest decision in this whole map:

- **Continue** — stay put. Costs nothing, loses nothing.
- **`/clear`** — empty the window, when nothing here matters to what's next.
- **`/handoff`** — write a portable markdown file. Narrow: only for a **new harness**, a **new directory**, a **colleague**, or forking a side task **mid-phase**. What it buys is portability.
- **Subagent** — send a tightly-scoped task to its own window and get a report back.
- **`/compact`** — compress this context and seed a fresh session with it. The **default**, at the bottom of the tree rather than the first reach.

Read [PHASE-BOUNDARIES.md](PHASE-BOUNDARIES.md) for the ordered tree — the five questions, the reasoning behind each branch, and why the primary-source cost makes **Continue** the one to rule out first. Make the decision **at** a boundary; mid-phase, continue or split the rest into subagents.

## Standalone

Off the main flow entirely.

- **`/resolving-merge-conflicts`** — work an in-progress merge or rebase conflict hunk by hunk, resolving by **intent** traced to each side's primary source rather than by picking lines, then finish the operation. It never runs `--abort`. Reach for it when you are already mid-conflict.
- **`/prototype`** — a small, throwaway program that answers one design question. Throwaway is a constraint on how the code is written, not a promise to destroy it: the answer folds into the real code, and the prototype is kept as a **primary source** on a `prototype/<name>` branch out of main. It's the detour in step 2, but reach for it any time a design question is hard to settle on paper.
- **`/research`** — delegate reading legwork: it investigates a question against **primary sources**, then leaves a cited Markdown file in the repo. What it produces is something to take _into_ the main flow at `/grilling` — research feeds the thinking, it doesn't replace it.
- **`/wait-what`** — the corrective for a message that didn't land. Use it mid-conversation, inside any other skill, and the agent re-pitches what it just said in plain English, using the `CONTEXT.md` vocabulary. It works after the fact; `/grilling` is the upfront cure, because a shared language agreed early is what stops the jargon arriving at all.
- **`/writing-for-agents`** — reference for writing documents agents consume: skills, `AGENTS.md`, pointed-at docs.

## What this repo deliberately does not have

Several skills from the upstream set were removed as a poor fit for a statically exported personal site — among them `/implement`, `/code-review`, `/triage`, `/wayfinder`, `/wizard`, and `/teach`. See [ADR-0006](../../../docs/adr/0006-vendored-skill-policy.md) for the policy and the full list. If you find a reference to one of them anywhere, it is stale.
