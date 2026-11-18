# Triage labels

The labels and what they mean are in `.agents/skills/ship/settings/triage-labels.md`. A skill's role name is the GitHub label to apply.

Topic labels (`enhancement`, `documentation`, `dependencies`, `github-actions`, …) are additive and
independent of triage state.

An issue waiting on an upstream release (a dependency, a toolchain line, a development-only advisory
with no patched parent) is `enhancement` plus `ready-for-agent`, not `bug` or `needs-triage`: the
label says who picks it up once it unblocks. The block lives on the board, as Status `Parked` or
`Blocked` with Gate `Upstream capability`. On re-triage, re-check the upstream trigger with live
evidence (`npm view`, `nodejs.org/dist/index.json`, the advisory API), and add a comment only when the
body is missing something or the trigger has moved.
