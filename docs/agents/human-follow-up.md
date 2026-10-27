# Human follow-up

Required human actions left by completed agent work follow the procedure in the installed skills'
`human-follow-up` settings definition (for example
`.agents/skills/end-session/settings/human-follow-up.md`). `docs/agents/issue-tracker.md` records
the standing authorization to publish them. Keep public originating records free of private
locators and details.

## Follow-up destination

`discover: git -C private remote get-url origin` — issues in the private companion, selected
explicitly with `--repo`, even for follow-ups from public work.

## Follow-up label

`ready-for-human` (remove a conflicting `needs-triage` or `ready-for-agent`)

## Follow-up board

same as Board — `Status` `Blocked` while waiting on the human, `Gate` to the real reason
(`Owner decision`, `Repo admin access` or `Evidence needed`), and `Area` to the part of the
project.

## Follow-up wiki

The private companion's wiki: `discover: git -C private remote get-url origin`, with `.wiki.git` in
place of `.git`. Index page `human-todo`, linked from `Home`. Push without asking: the standing
authorization covers it. Before committing, verify the wiki's private parent and remote, review the
diff, and run the secret scan in `docs/agents/secret-prevention.md`.
