# Repository state and next steps

_Assessment date: 2026-09-02. This report is intentionally public-safe. It names no private
repository locator, private issue URL, credential reference, private document content, or personal
data._

> **Remediation update, 2026-09-02:** The current branch implements #136 and #137. The skill
> sources and generated mirrors now support GitHub MCP when `gh` is absent, and npm's
> `devEngines` gate rejects mismatched Node/npm toolchains before they can rewrite the lockfile.
> #143 is complete and closed: the active ruleset now requires `AI Config Parity` while preserving
> its seven existing checks. References below to these items as open describe the assessment
> snapshot; #136 and #137 remain open only until the implementation branch merges.

## Executive conclusion

The two-repository recovery design is implemented, documented, and present in clean synchronized
checkouts. The public repository's default branch is healthy at `v1.7.2`; its latest CI, CodeQL,
release, and deployed-site smoke runs succeeded. The private companion's default branch is also
clean and synchronized. It has no open Issues, milestones, or dedicated project board, and its live
README delegates the executable recovery procedure to the public runbook instead of maintaining a
second copy.

Portability is not finished, however. Three open public Issues remain on that boundary, in this
priority order:

1. [#136](https://github.com/jwh3times/caitlyn-holland-vip/issues/136) — finish making the `ship`
   and `end-session` skills runnable in remote Linux/web environments where `gh` is absent. The
   issue's owner comment records that the general documentation and recovery-runbook portions
   shipped, but the two skill sources still contain a Windows-machine assumption and a hard
   `gh auth status` precondition without an MCP path.
2. [#137](https://github.com/jwh3times/caitlyn-holland-vip/issues/137) — decide and implement the
   dependency-install policy for remote environments whose Node/npm versions do not match
   `.nvmrc`. The failure is reproduced and `main` is unaffected; the unresolved choice is whether
   to configure the environment, default non-dependency work to `npm ci`, add a preflight/guard, or
   combine those measures.
3. [#143](https://github.com/jwh3times/caitlyn-holland-vip/issues/143) — a human with repository
   administration access must add `AI Config Parity` to the active `No Push to Main` ruleset while
   preserving the existing required checks. Live ruleset inspection confirms it is still absent.
   It also found `Dependency Review` required instead, so the hand-authored documentation's claim
   that the seven checks are the six `ci.yml` jobs plus CodeQL is currently inaccurate.

Complete these before taking ordinary backlog work. Of them, #136 is the most direct remaining
cross-platform execution defect; #137 is the remaining fresh-environment install hazard; #143 is
the short human-only integrity step for portable AI configuration.

## Evidence and interpretation

### Recovery and private-companion work already completed

- [PR #144](https://github.com/jwh3times/caitlyn-holland-vip/pull/144) added the public-safe
  cross-device recovery design and records a successful fresh-recovery rehearsal, including
  locator retrieval, the private-visibility gate, history/content verification, installation,
  build checks, and a clean public checkout.
- [PR #145](https://github.com/jwh3times/caitlyn-holland-vip/pull/145) added the idempotent
  `npm run bootstrap:private` command, credential-free locator validation, and the private
  visibility check.
- [PR #147](https://github.com/jwh3times/caitlyn-holland-vip/pull/147) generalized the public
  recovery runbook across Linux, macOS, and Windows and recorded that the Node bootstrap itself is
  shell-independent.
- [PR #154](https://github.com/jwh3times/caitlyn-holland-vip/pull/154) consolidated the durable
  decision into ADR-0010 and removed competing historical plans. [PR
  #155](https://github.com/jwh3times/caitlyn-holland-vip/pull/155) then corrected stale skill and
  companion-document facts.
- The current [recovery runbook](../agents/private-workspace.md), [ADR-0010](../adr/0010-private-workspace-is-a-separate-repository.md),
  and [`README.md`](../../README.md#owner-recovery) agree on the boundary: public policy and code
  here, durable private material in an independent ignored checkout, and credentials outside both
  repositories.

These merged changes supersede historical working documents. The archived material in the private
companion explicitly identifies itself as historical, so its old checklists and recommendations
must not be counted as open work.

### Remaining portability work

#### #136: remote/web skill execution

[#136](https://github.com/jwh3times/caitlyn-holland-vip/issues/136) remains open with
`needs-triage`. Its latest owner comment precisely separates shipped scope from remaining scope.
The issue-tracker and recovery docs now describe GitHub MCP as the fallback when `gh` is missing,
but the canonical sources for `ship` and `end-session` still describe a particular Windows machine
and make `gh` authentication read as a hard prerequisite. The next executable work is to choose
MCP fallthrough as the supported path, update both `.agents/skills/**/SKILL.md` sources, point their
GitHub operations at the shared fallback policy, run `npm run sync:ai`, and validate parity. This
closes an observed cross-platform failure rather than adding a theoretical compatibility layer.

#### #137: Node/npm mismatch in remote agents

[#137](https://github.com/jwh3times/caitlyn-holland-vip/issues/137) remains open with
`needs-triage`. It records a repeatable lockfile rewrite when a remote agent's older npm performs
`npm install` against a lockfile generated under the Node/npm line pinned by `.nvmrc`; no bad diff
was committed. The public recovery runbook already says to match `.nvmrc` and use `npm ci`, which
protects the documented fresh-machine path, but it does not make arbitrary remote agent sessions
safe. Triage should establish one canonical policy: configure matching Node when possible, use
`npm ci` for ordinary work, and fail early or clearly warn before an intentional dependency update
under a mismatched toolchain.

#### #143: AI configuration parity is reporting but not blocking

[#143](https://github.com/jwh3times/caitlyn-holland-vip/issues/143) remains open and is labeled
`ready-for-human`. [PR #77](https://github.com/jwh3times/caitlyn-holland-vip/pull/77) implemented
the single-source AI configuration and CI parity job, but explicitly left the administrative
ruleset change as follow-up. Live inspection on the assessment date found the active ruleset
requires `Build & Lint`, `Playwright Tests`, `CodeQL`, `Format Check`, `Dependency Review`,
`Coverage`, and `Changelog Version`; it does not require `AI Config Parity`. Therefore #143 is
current, and the required-check list in `AGENTS.md` should be corrected in the same change or its
shipping documentation refresh.

### Public backlog after portability

The public repository has eleven open Issues and no milestones. After #136, #137, and #143, the
ready-for-agent sequence can resume with:

- [#141](https://github.com/jwh3times/caitlyn-holland-vip/issues/141) — theme persistence E2E
  coverage;
- [#142](https://github.com/jwh3times/caitlyn-holland-vip/issues/142) — document the static-export
  CSP exception;
- [#151](https://github.com/jwh3times/caitlyn-holland-vip/issues/151) — semantic accent/border
  tokens;
- [#152](https://github.com/jwh3times/caitlyn-holland-vip/issues/152) — run Mobile Chrome in CI;
- [#153](https://github.com/jwh3times/caitlyn-holland-vip/issues/153) — add a static-export preview
  command.

Issues [#149](https://github.com/jwh3times/caitlyn-holland-vip/issues/149) and
[#150](https://github.com/jwh3times/caitlyn-holland-vip/issues/150) need owner decisions before
implementation. [#119](https://github.com/jwh3times/caitlyn-holland-vip/issues/119) is an upstream
capability watch, not immediately actionable. None outranks the observed portability defects.

## Tracker and access audit

- GitHub CLI authentication had repository and project read access sufficient for both
  repositories, Issues, labels, milestones, actions, and the owner's Projects v2 list.
- The public repository has eleven open Issues; the private companion has none. Neither repository
  has a milestone.
- The owner's only Projects v2 board is explicitly scoped to another repository and was excluded.
  No project board governs work in either repository assessed here.
- GitHub's legacy repository-project API returned `404` for both repositories. This does not create
  a material gap because the Projects v2 inventory was available and the canonical repository
  workflow places live work in Issues.
- Private conclusions above are deliberately status-only. The public report does not reproduce or
  link private repository metadata or content.

## Recommended execution order

1. Implement and close #136, including regenerated mirrors and parity verification.
2. Triage #137 immediately afterward and encode the selected Node/npm policy in automation or a
   preflight, not documentation alone.
3. Have an administrator complete #143 and reconcile the documented required-check inventory with
   the live ruleset.
4. Re-query both repositories. If the portability set is closed and the private companion remains
   empty, take the ready-for-agent public backlog in small independent changes.
