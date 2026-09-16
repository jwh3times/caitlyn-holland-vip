# Cross-device handoffs

The owner alternates between a Windows PC and a Fedora PC. `/handoff` parks a session in
Proton Drive and registers it in a shared map; `/lets-go` claims it on the other machine. This
file is the reference both skills share: how the Handoffs folder reaches each machine, what the
map looks like, and how to read and write it.

Run the shell commands through the POSIX shell (Git Bash on Windows). The map is read and written
only through `node scripts/handoff-map.mjs`, never with `jq` or by hand.

## How the Handoffs folder reaches this machine

Two transports, decided by what is installed:

- **Desktop client** (Windows): the Proton Drive client keeps
  `~/Proton Drive/<account>/My files/Documents/Handoffs` in sync on its own. Writing into that
  folder is the whole sync, so skip the **Pull** and **Push** blocks in both skills.
- **CLI mirror** (Fedora, where Proton ships no sync client): `proton-drive`, the Proton Drive
  CLI, is on `PATH` and `HANDOFFS_DIR` names a local mirror folder. Nothing syncs by itself.
  Run each **Pull** and **Push** block explicitly. The cloud folder is always
  `/my-files/Documents/Handoffs`. If the CLI replies `You need to login first`, the user has to
  run `proton-drive auth login` interactively. Suggest they type `! proton-drive auth login`.

Decide once at the start: if `command -v proton-drive` succeeds **and** `HANDOFFS_DIR` is set,
use the CLI mirror. Otherwise use the desktop client. The test uses `HANDOFFS_DIR` rather than
whether a `~/Proton Drive` folder exists, because a CLI download can create that folder on a
machine with no desktop client.

The CLI exits 0 even when a remote file is missing (`Node not found`), so read its output rather
than its exit code. The script's `exists` field is still the authoritative check for a document.

## The script

```bash
node scripts/handoff-map.mjs get               # dir, repo, key, file, path, exists
node scripts/handoff-map.mjs set <file-name>   # make <file-name> this repository's active handoff
node scripts/handoff-map.mjs clear             # set this repository's entry to null
```

The folder comes from `--dir <path>`, then `HANDOFFS_DIR`, then the desktop client's folder under
the home directory. The repository comes from `--repo <name>`, then the `origin` remote's name.
If `get` reports no map found, ask the user where the Handoffs folder is on this machine, rerun
with `--dir <path>`, and suggest they export `HANDOFFS_DIR` in their shell profile.

`set` and `clear` change only this repository's entry and `Last_Updated`, then echo the entry
read back from disk. `set` refuses a file that is not in the folder.

## Handoff documents

Handoff documents are named `caitlyn-holland-vip-handoff-YYYY-MM-DD.md`. If that name is already
taken, add `-<topic>` before `.md`. Documents stay in the folder after they are picked up. The
map, not the folder, decides which handoff is active, so leave older documents where they are.

## The map

`handoff_map.json` records at most one active handoff per repository, for all of the owner's
repositories:

```json
{
  "FileName": "handoff_map.json",
  "Last_Updated": "09-15-2026 13:54:25",
  "Active_Handoffs": {
    "caitlyn-holland-vip": null,
    "LeaseBook": "leasebook-handoff-2026-09-15.md"
  }
}
```

- This repository's key is **`caitlyn-holland-vip`**. The script matches keys case- and
  punctuation-insensitively. The value is a document filename in the Handoffs folder, or `null`
  when there is no active handoff.
- `Last_Updated` is local time as `MM-DD-YYYY HH:mm:ss`, on a 24-hour clock.

If a conflict copy of the map shows up next to it, Proton Drive could not merge edits from the
two machines. Stop and ask the owner which copy is current before running `set` or `clear`.
