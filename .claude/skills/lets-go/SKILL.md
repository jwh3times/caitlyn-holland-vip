---
name: lets-go
description: Pick up this repo's active Proton Drive handoff from the other machine and continue the work.
disable-model-invocation: true
---

<!-- AUTO-GENERATED from .agents/skills/lets-go/SKILL.md by scripts/sync-ai.mjs — do not edit. Edit the source and run `npm run sync:ai`. -->

# Let's Go

**Announce at start:** "I'm using the lets-go skill to pick up this repo's handoff."

`/lets-go` is the other half of `/handoff`. The handoff skill wrote a document to Proton Drive
on the other machine and registered it in the handoff map. This skill finds that document,
claims it so it is not picked up twice, updates the checkout, and continues the work.

First, read [docs/agents/handoffs.md](../../../docs/agents/handoffs.md). It has the folder paths,
the map format, and the rules for editing the map.

Git and script commands run in a bash/POSIX shell, including git-bash on Windows.

## 1. Find the active handoff

Resolve the Handoffs folder and read `handoff_map.json`. Look up the `caitlyn-holland-vip` key.

- **`null` or missing:** say "No active handoff for caitlyn-holland-vip." and stop.
- **Names a file that is not in the folder:** Proton Drive has not finished syncing it. Report
  the filename, leave the map unchanged, and stop.

## 2. Read the handoff document

Read the entire document before acting on any of it. Note where it says to resume (branch, PR,
next action), its unmerged-work list, its human follow-up links, and its suggested skills.

## 3. Claim it

Set the `caitlyn-holland-vip` key to `null`, following the map editing rules. Claim the handoff
now, before any work starts, so a second `/lets-go` on either machine cannot pick up the same
handoff. Leave the document in the folder.

Step 3 is done when the map parses and re-reading it shows `null` for this repository.

## 4. Update the checkout

```bash
git branch --show-current
git status --porcelain
```

**If the tree has uncommitted changes,** report them and ask the user how to proceed. Do not
discard, stash, or commit them, and do not switch branches around them.

**Otherwise,** run `npm run sync:main`. It brings this checkout and `private/` to the latest
`origin/main`. Then, if the handoff names a working branch:

```bash
git switch <branch>
git pull --ff-only
```

If the branch is not on `origin`, the other machine never pushed it. Tell the user that this
work has to be pushed from the other machine before it can continue here, and stop. Do the same
for any item the handoff's unmerged-work list marked as local only that the work depends on.

## 5. Continue the work

Tell the user in a few lines what the handoff says: the goal, the resume point, and any
unmerged work or human follow-ups it listed. Then invoke the suggested skills and start on the
handoff's next action. From here on, the handoff document is your context, just as the earlier
conversation would have been.
