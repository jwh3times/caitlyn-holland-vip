# Third-party skills install from one pinned snapshot, never edited here

The skills from [`mattpocock/skills`](https://github.com/mattpocock/skills) install from one commit, the same in every repository that shares [`jwh3times/skills`](https://github.com/jwh3times/skills), and are never edited here. The commit and the skill list are in the install command in the `shared-skills` block of `AGENTS.md`, and `scripts/check-skills.mjs` fails when an installed copy differs from `skills-lock.json`, or the lock from that command. What the skills need to know about this repository goes in `AGENTS.md` or `docs/agents/`. This supersedes [ADR-0006](0006-vendored-skill-policy.md).

ADR-0006 forked the set to fit it to this repository. The cost was a flow of its own: it removed `/implement`, `/code-review`, `/triage` and `/wayfinder`, so the development flow the other repositories share could not apply here, and fixes upstream stopped arriving. The owner decided on 2026-11-01 that this repository takes the same set as the others.

## Considered options

Keeping the fork, and taking only the `shared-skills` text, was the alternative. It lets this repository word every skill as it likes, but it leaves one repository outside the shared flow and every upstream fix to be read and applied by hand. ADR-0006's reason to fork, that a correction in `AGENTS.md` does not reliably reach a skill loaded into a subagent, still holds in part, and this decision accepts that.

## Consequences

- The skill count goes from 18 to 28, restoring `/implement`, `/code-review`, `/triage`, `/wayfinder`, `/wizard`, `/teach` and the rest. `/grilling` keeps its name, and `/grill-with-docs` is the route into it that keeps a paper trail. `/code-review` here is the installed skill, not the harness's built-in.
- `docs/agents/dev-flow.md` holds only what this repository adds, and the `development-flow` block in `AGENTS.md` replaces its summary there. `docs/agents/triage-labels.md` exists, because the installed skills read it.
- `npm run sync:agents` no longer runs Prettier, and all of `.agents/skills/` is in `.prettierignore`: a formatter's pass would fail the check.
- The repository facts the fork wrote into skills moved to `AGENTS.md` and `docs/agents/dev-flow.md`: the test layout, and that a throwaway route deploys.
- Moving to a newer snapshot is one change in `jwh3times/skills`, and the check fails here until this repository re-installs.
