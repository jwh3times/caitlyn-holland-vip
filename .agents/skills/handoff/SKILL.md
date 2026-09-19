---
name: handoff
description: Hand the session off to the other machine — write a handoff document to Proton Drive, register it in the handoff map, alert on unmerged work, then close out with end-session.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

# Handoff

**Announce at start:** "I'm using the handoff skill to park this session in Proton Drive."

The owner switches between a Windows PC and a Fedora PC. Only two things reach the other
machine: what is on GitHub and what is in Proton Drive. The handoff document carries the
conversation. The unmerged-work alert catches work that would otherwise be left behind on this
machine. `/lets-go` picks the handoff up on the other side.

Before step 2, read [docs/agents/handoffs.md](../../../docs/agents/handoffs.md). It has the
two transports (desktop client and CLI mirror), the map script, the document naming, and the map
format. Decide the transport before step 2.

Run the shell commands through the POSIX shell (Git Bash on Windows). The map is read and written
only through `node scripts/handoff-map.mjs`, never with `jq` or by hand. If `gh` is unavailable,
use the equivalent GitHub MCP operation.

## 1. Check for unmerged work

Collect everything that is not on `origin/main`:

```bash
git fetch origin --prune
git branch --show-current
git status --porcelain
git stash list
git for-each-ref refs/heads --format='%(refname:short) %(upstream:short) %(upstream:track)'
git branch --no-merged origin/main
gh pr list --author "@me" --state open --json number,title,headRefName,url
```

If `private/` exists, run `git -C private status --porcelain` and
`git -C private log --oneline @{u}..HEAD` too.

`--no-merged` can overstate the risk: a branch squash-merged before the repo moved to
merge-commit-only PRs is not an ancestor of `main`, so it still lists even though its work landed.
Check each branch with `gh pr list --head <branch> --state merged --json number`. A branch with
a merged PR is not at risk.

Sort each remaining item into one of two groups:

- **Local only.** The other machine cannot see this work: uncommitted changes, stashes,
  unpushed commits, branches with no upstream, and uncommitted or unpushed work in `private/`.
- **Pushed, not merged.** The other machine can reach this work, but it is not on `main` yet:
  pushed branches and open PRs.

**If you find anything, show the user an "⚠ Unmerged work" alert right away,** before you write
the document. Name each item and its group, and say plainly that local-only work will not be
available on the other machine unless it is pushed first. Offer `/ship` for finished branches.
Do not commit or push anything in this skill. The alert does not stop the handoff; the same list
goes into the document and into the final report. If you find nothing, say "All work is merged
to `main`."

## 2. Write the handoff document

**Pull** (CLI mirror only). Refresh the map before reading it, so the entry written on the other
machine is the one this run supersedes:

```bash
mkdir -p "$HANDOFFS_DIR"
proton-drive filesystem download -f remove /my-files/Documents/Handoffs/handoff_map.json "$HANDOFFS_DIR"
```

Then resolve the Handoffs folder and this repository's current entry:

```bash
node scripts/handoff-map.mjs get
```

Write a handoff document that a fresh agent on the other machine can resume from. Save it
directly in the `dir` that `get` printed, using the name from the handoffs doc.

- **Start with where to resume.** Give the branch, its PR URL if there is one, and the first
  concrete next action.
- Include the unmerged-work list from step 1.
- Include a **Suggested skills** section that lists the skills the next agent should invoke.
- Reference other artifacts by path or URL (specs, plans, ADRs, issues, commits, diffs) instead
  of copying their content.
- Redact sensitive information, such as API keys, passwords, and personally identifiable
  information. Link to `private/` content and private issues instead of quoting them.
- If the user passed arguments, treat them as what the next session will focus on, and shape
  the document around that.

Before handing off completed work, apply the required human follow-up procedure in
`docs/agents/issue-tracker.md#required-human-follow-ups-from-completed-agent-work`. Create or
reuse the private issue, the board entry, and the step-by-step private wiki instructions. Put
their links, and any publication blocker, into the handoff. A handoff document on its own does
not record a required human action.

**If the Handoffs folder cannot be resolved** (`get` finds no map and the user cannot name the
folder), write the document to the OS temp directory
instead. Tell the user it will not reach the other machine, and stop. Skip steps 3 and 4, since
closing out would make this a handoff nobody can pick up.

Step 2 is done when the document exists in the Handoffs folder and reading it back shows the
full content.

## 3. Register it in the handoff map

```bash
node scripts/handoff-map.mjs set <file-name>
```

If `get` in step 2 showed a different document, leave that file in place and name it in the
report as superseded.

Step 3 is done when the echoed entry shows `file` equal to `<file-name>` and a fresh
`lastUpdated`.

**Push** (CLI mirror only). The document and the map both leave this machine now:

```bash
proton-drive filesystem upload -f create-new-revision -t \
  "$HANDOFFS_DIR/<file-name>" "$HANDOFFS_DIR/handoff_map.json" /my-files/Documents/Handoffs
```

`create-new-revision` keeps the cloud's earlier map as a revision instead of trashing it. The
push is done when the transfer summary lists both files as uploaded. An unchanged file reports as
skipped, which also counts as done. If the summary lists neither file, the user's login has
lapsed; see the transport section of the handoffs doc.

## 4. Close out with end-session

Invoke the `end-session` skill. If your harness cannot invoke skills, read
`.agents/skills/end-session/SKILL.md` and follow it. Tell it the session is being handed off to
the other machine. The work will continue from GitHub there, not in this checkout, so
end-session's branch step can return this checkout to `main`. Its other stop conditions still
apply. Tell it the handoff document's path too, so its workspace cleanup leaves the Handoffs
folder alone.

If end-session changes a fact the handoff document states, such as pushing work, closing an
issue, or deleting a branch, edit the document to match. On the CLI mirror, push the edited
document again with the same **Push** command, because `/lets-go` reads the cloud copy.

## 5. Report

Report:

- the handoff document's full path
- the map entry you set, and any superseded document
- end-session's close-out summary

End with the step 1 alert repeated word for word, or "All work is merged to `main`." Then tell
the user to run `/lets-go` in this repository on the other machine once the document is in the
cloud folder. The desktop client syncs it within a minute or so; a **Push** puts it there at
once.
