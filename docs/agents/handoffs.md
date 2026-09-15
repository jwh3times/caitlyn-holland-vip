# Cross-device handoffs

The owner alternates between a Windows PC and a Fedora PC. `/handoff` parks a session in
Proton Drive and registers it in a shared map; `/lets-go` claims it on the other machine. This
file is the reference both skills share: where the folder is, what the map looks like, and how
to edit it safely.

## Handoffs folder

The Proton Drive client syncs one folder between the machines:

| OS      | Path                                                   |
| ------- | ------------------------------------------------------ |
| Windows | `~/Proton Drive/jwh3times/My files/Documents/Handoffs` |
| Fedora  | `~/Proton Drive/My Files/Documents/Handoffs`           |

Use whichever path exists and contains `handoff_map.json`. If neither does, the sync client is
not running or not signed in. Stop and report it, and do not create a map: a new file would
conflict with the synced one and could erase every other repository's entry.

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

- This repository's key is **`caitlyn-holland-vip`**. The value is a document filename in the
  Handoffs folder, or `null` when there is no active handoff. If the key is missing, treat it as
  `null`.
- `Last_Updated` is local time as `MM-DD-YYYY HH:mm:ss`, on a 24-hour clock.

### Editing the map

The map is shared by every repository and both machines, so edit it narrowly:

1. Read the file immediately before writing, not from an earlier read in the session.
2. Change only this repository's key and `Last_Updated`. Add the key if it is missing. Keep
   every other entry, the key order, and the 2-space indentation exactly as they are.
3. Check that the result parses:

   ```bash
   node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "<map path>"
   ```

   If parsing fails, write back the content from step 1 and report the failure.

4. Read the file again and confirm this repository's key holds the value you wrote.

If a conflict copy of the map shows up next to it, Proton Drive could not merge edits from the
two machines. Stop and ask the owner which copy is current before editing either one.
