# Post-portability next-work priority

_Assessment date: 2026-09-02. This report is intentionally public-safe. It does not disclose the
private companion's locator, document contents, issue URLs, or the identity of an unrelated private
project board._

## Decision

There is **no unfinished portability or cross-device recovery work** in the two Caitlyn repositories.
The portability override therefore does not select a work item today. If a portability regression is
discovered later, it should immediately return to priority zero.

There is also no justified agent-ready feature or engineering issue to start immediately. The public
repository has one open Issue, [#119](https://github.com/jwh3times/caitlyn-holland-vip/issues/119),
but its required native Oxlint rule still does not exist. The private companion has no open Issues,
open pull requests, milestones, or repository-linked project items. Its Markdown beyond the README
is explicitly archived historical context, not a second backlog.

The next active work should therefore be selected in this order:

1. **Portability regression, if one appears — P0, immediately executable once evidenced.** None is
   known now. Do not invent a portability ticket merely to keep this category occupied.
2. **Review the next routine grouped dependency pull request — P1, executable when Dependabot opens
   it.** A reproducible `npm outdated --json` check found six compatible updates on the assessment
   date, while `npm audit --json` reported zero vulnerabilities. The repository already asks
   Dependabot to open one daily minor/patch group, so duplicating that work manually would only race
   the configured automation; review its generated PR and gates instead
   ([configuration](../../.github/dependabot.yml)).
3. **Choose and ticket the next owner-valued site outcome — P2, needs a product decision before an
   agent starts.** The previously selected SEO, content-structure, mobile-CI, preview, theme,
   semantic-color, smoke-test, and portability work all shipped and are recorded in the
   [changelog](../../CHANGELOG.md).
   The next feature should begin as one canonical public Issue with acceptance criteria. A content
   freshness review with the site owner is a better discovery starting point than an unsolicited
   infrastructure refactor because the site is a professional profile and its facts are deliberately
   centralized in [`lib/profile.ts`](../../lib/profile.ts) and the owning sections.
4. **Keep #119 as a capability watch — P3, blocked upstream and not executable.** Recheck it after a
   future Oxlint release; implement only when the native rule ships and behavioral parity can be
   demonstrated. Oxlint 1.81.0, released 2026-09-01, added `nextjs/no-typos`, not the missing
   location-assignment rule
   ([release](https://github.com/oxc-project/oxc/releases/tag/apps_v1.81.0)). The Oxc tracker still
   leaves `nextjs/no-location-assign-relative-destination` unimplemented
   ([tracker](https://github.com/oxc-project/oxc/issues/1929)), and the rule is absent from the
   [current native Next.js rule source](https://github.com/oxc-project/oxc/tree/main/crates/oxc_linter/src/rules/nextjs).

If the goal is specifically to hand an autonomous agent a ticket **right now**, there is none. Wait
for the dependency PR or obtain the owner's next desired site outcome and create the canonical Issue
before implementation.

## Why portability is complete

The public recovery runbook now covers Linux, macOS, and Windows, an idempotent private-companion
bootstrap, scoped credential handling, runtime matching, and the rebuild checks
([runbook](../agents/private-workspace.md)). The last public cross-environment defects were resolved
by [PR #159](https://github.com/jwh3times/caitlyn-holland-vip/pull/159): the shipping/session skills
gained a GitHub MCP fallback and the Node/npm preflight prevents lockfile damage. The ruleset action
in [#143](https://github.com/jwh3times/caitlyn-holland-vip/issues/143) is closed. Finally,
[PR #167](https://github.com/jwh3times/caitlyn-holland-vip/pull/167) added one guarded command to
fast-forward both clean checkouts.

At assessment time, the public checkout was clean at `v1.11.0` and tracking `origin/main`; the
private checkout was also clean and tracking its `origin/main`. The public merge commit passed the
[full CI run](https://github.com/jwh3times/caitlyn-holland-vip/actions/runs/33682677865), and
`v1.11.0` was published by the
[release workflow](https://github.com/jwh3times/caitlyn-holland-vip/releases/tag/v1.11.0).
The latest scheduled deployed-site check also passed
([smoke run](https://github.com/jwh3times/caitlyn-holland-vip/actions/runs/33642574424)).

The private companion's live README delegates the executable process to the public runbook and
marks its other documents as historical. An authenticated inspection of its default branch, issue
tracker, milestones, and pull requests found no live action. This private evidence is intentionally
described generically rather than linked or copied into the public repository.

## Issue and project inventory

| Scope                | Current primary-source state                                                                                                                           | Priority consequence                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Public Issues        | One open Issue: [#119](https://github.com/jwh3times/caitlyn-holland-vip/issues/119); zero open issue-dependency blockers and no project assignment     | Watch only; not ready to implement        |
| Public pull requests | Zero open                                                                                                                                              | No branch to review now                   |
| Public milestones    | Zero open                                                                                                                                              | No milestone ordering overrides the list  |
| Private companion    | Zero open Issues, pull requests, milestones, or repository-linked project items                                                                        | No private task to pick up                |
| Account Projects v2  | The only board visible to the authenticated review is unrelated to either Caitlyn repository; its current items contain no unfinished portability work | Exclude it from this repository's backlog |

The project-board conclusion comes from authenticated GitHub Projects v2 and underlying Issue API
queries performed on 2026-09-02. The board is private and outside this repository's domain, so its
name, URL, issue text, and other contents are deliberately omitted.

## Options considered and rejected

- **Start #119 now:** rejected because removing the JavaScript bridge would remove an enforced lint
  behavior without a native replacement. The current configuration shows the compatibility alias
  is still the only implementation path ([`.oxlintrc.json`](../../.oxlintrc.json)); the earlier
  rule-level analysis reaches the same no-go conclusion
  ([research](oxlint-native-location-assign-rule.md)).
- **Promote recommendations from the private audits:** rejected because their live README marks
  them historical, and their remaining durable action is already represented by #119. Reviving
  their old package or architecture advice would recreate a second, stale task tracker.
- **Treat the unrelated account board as this repository's roadmap:** rejected because none of its
  items belongs to either repository. Repository-linked project queries also return no project item
  for #119 and no private-companion issue at all.
- **Open speculative cleanup work:** rejected because the repository has a clean release, passing
  CI and smoke checks, no audit vulnerability, and no documented failing behavior. A new ticket
  should express an owner-valued outcome or an observed defect, not merely keep an agent busy.

## Reassessment triggers

Re-run this ordering when any of the following occurs:

- a recovery or cross-environment rehearsal exposes a portability gap;
- a public or private Issue, pull request, milestone, or relevant board item opens;
- Dependabot opens the next grouped update;
- the site owner requests a new content or product outcome;
- Oxlint ships `nextjs/no-location-assign-relative-destination`.

## Method

Primary sources only were used: both local Git worktrees and histories; the public runbook,
configuration, ADR-backed documentation, changelog, and source; the private companion's live README
and archived-document status banners; GitHub REST/GraphQL responses for all open Issues, pull
requests, milestones, issue dependencies, project assignments, account project items, releases,
workflow runs, and security alerts; the Oxc repository tracker, release, and source tree; and local
`npm outdated --json` / `npm audit --json` results. No secondary articles or search summaries were
used.
