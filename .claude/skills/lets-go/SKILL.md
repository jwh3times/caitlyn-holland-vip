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

First, read [docs/agents/handoffs.md](../../../docs/agents/handoffs.md). It has the two
transports (desktop client and CLI mirror), the map script, and the map format. Decide the
transport before step 1.

Run the shell commands through the POSIX shell (Git Bash on Windows). The map is read and written
only through `node scripts/handoff-map.mjs`, never with `jq` or by hand.

## 1. Find the active handoff

**Pull** (CLI mirror only). Fetch the current map before reading it:

```bash
mkdir -p "$HANDOFFS_DIR"
proton-drive filesystem download -f remove /my-files/Documents/Handoffs/handoff_map.json "$HANDOFFS_DIR"
```

Then look up this repository's entry:

```bash
node scripts/handoff-map.mjs get
```

Branch on the result:

- **No map found:** ask the user where the Handoffs folder is on this machine, rerun with
  `--dir <path>`, and suggest they export `HANDOFFS_DIR`.
- **`key` or `file` is null:** say "No active handoff for caitlyn-holland-vip." and stop. Leave
  the map untouched.
- **`exists` is false, CLI mirror:** fetch the document by name, then rerun `get`:

  ```bash
  proton-drive filesystem download -f remove "/my-files/Documents/Handoffs/<file>" "$HANDOFFS_DIR"
  ```

  A `Node not found` reply means the other machine has not uploaded the document yet. Tell the
  user the filename and stop without clearing, so a retry still works.

- **`exists` is false, desktop client:** the client has not synced the document here yet. Tell
  the user the filename and stop without clearing, so a retry after sync still works.
- **`exists` is true:** continue.

## 2. Read the handoff document

Read the entire document at `path` before acting on any of it. Note where it says to resume
(branch, PR, next action), its unmerged-work list, its human follow-up links, and its suggested
skills.

## 3. Claim it

```bash
node scripts/handoff-map.mjs clear
```

Claim the handoff now, before any work starts, so a second `/lets-go` on either machine cannot
pick up the same handoff. Leave the document in the folder.

Step 3 is done when the echoed entry shows `file: null`.

**Push** (CLI mirror only). The cleared map goes back to the cloud, so the other machine cannot
resume the same handoff a second time:

```bash
proton-drive filesystem upload -f create-new-revision -t "$HANDOFFS_DIR/handoff_map.json" /my-files/Documents/Handoffs
```

The push is done when the transfer summary lists the map as uploaded.

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
