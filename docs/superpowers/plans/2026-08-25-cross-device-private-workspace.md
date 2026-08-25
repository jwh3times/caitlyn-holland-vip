# Cross-Device Private Workspace Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Preserve the only local copies of
> private documents until the recovery rehearsal passes. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Make the project resumable from another computer by combining this public repository,
an independent private GitHub companion repository, and 1Password as the canonical credential
manager accessible through the 1Password CLI.

**Architecture:** This public repository remains canonical for code and public-safe documentation.
Its ignored `private/` directory becomes an independent Git repository whose private GitHub remote
stores durable private Markdown and private Issues. 1Password stores the GitHub login, SSH key,
recovery material, private-repository locator, and any backup credential; it does not become the
document store. Generated dependencies and agent-run artifacts remain reproducible local state.

**Tech Stack:** Git, GitHub private repositories and Issues, 1Password CLI 2, a scoped 1Password
service account, GitHub CLI's Git credential helper, PowerShell, Node.js.

**Research:** The inventory and option analysis are in
[Cross-device private working documents](../../research/cross-device-private-working-docs.md).

## Current snapshot

- `private/` contains three durable Markdown documents and is ignored by the public repository.
- `.superpowers/sdd/` contains 24 completed agent-run artifacts; only one follow-up may still be
  actionable.
- `node_modules/` contains 21,264 reproducible ignored files.
- `.claude/settings.local.json` is ignored only by this computer's global Git exclude file.
- 1Password CLI 2 is installed and authenticates as a service account through a securely
  provisioned `OP_SERVICE_ACCOUNT_TOKEN`.
- The original service account was read-only. A replacement service account was securely
  bootstrapped from 1Password and created the project bootstrap item in the approved
  general-development fallback after dedicated-vault creation was unavailable.
- GitHub CLI is authenticated and its keyring-backed HTTPS credential helper is configured; no
  GitHub token is copied into the workspace or an environment variable.
- The research report and this plan are public-safe; neither reproduces private prose or secrets.

## Global constraints

- **Visibility gate:** verify that the companion GitHub repository reports `PRIVATE` before its
  remote is added or any document is pushed.
- **Preservation gate:** retain the three original documents until a fresh clone reproduces their
  contents and history.
- **Credential boundary:** 1Password is the single credential manager. Store no passwords, tokens,
  private keys, recovery codes, or backup passphrases in either Git repository.
- **Token boundary:** the scoped `OP_SERVICE_ACCOUNT_TOKEN` is provisioned through an authorized
  machine-secret channel for automation. Never print it, paste it into a command, persist it in a
  shell profile, or write it to either repository. Authenticate `gh` through its browser flow and
  Git through `gh auth setup-git`; never copy a GitHub token into the workspace or environment.
- **No public locator:** keep the companion repository's slug, URL, and concrete 1Password secret
  references out of tracked public files. Public instructions use placeholders; the real locator
  lives in 1Password.
- **Separate histories:** commits inside `private/` go only to the private remote. Public policy and
  onboarding commits go only to this repository.
- **Windows authentication:** run authenticated `gh` and remote Git commands outside the native
  elevated sandbox so they can use the host credential and SSH integrations.
- **Recovery of 1Password:** keep the 1Password recovery code or Emergency Kit in a safe location
  outside the 1Password account, avoiding a circular recovery dependency. 1Password documents that
  a Secret Key is needed on a new device and that recovery codes should be stored somewhere safe
  and accessible
  ([Secret Key](https://support.1password.com/secret-key/),
  [recovery codes](https://support.1password.com/recovery-codes/)).

## Target information map

| Information                                                  | Canonical location                         |
| ------------------------------------------------------------ | ------------------------------------------ |
| Code and public-safe durable documentation                   | This public repository                     |
| Public-safe actionable work                                  | Issues in this public repository           |
| Private Markdown, audits, and history                        | Private companion repository at `private/` |
| Private non-vulnerability work                               | Issues in the private companion repository |
| Unpublished exploitable vulnerability                        | Draft advisory in this public repository   |
| GitHub login, SSH key, repository locator, recovery material | 1Password                                  |
| 1Password's own recovery material                            | Safe offline location outside 1Password    |
| Dependencies, builds, tests, caches, completed agent runs    | Rebuilt or regenerated locally             |

---

### Task 1: Install and authenticate the 1Password CLI

**External state:** installs local software and consumes a pre-provisioned service-account token.

- [x] **Step 1: Confirm the scoped service-account token is available**

Use the token already provisioned through the authorized machine-secret channel. Test only for
its presence; never print its value, paste it into a command, persist it in a shell profile, or
write it to either repository.

- [x] **Step 2: Install 1Password CLI 2 on Windows**

Run outside the sandbox:

```powershell
winget install 1password-cli
```

Open a new PowerShell session and verify:

```powershell
op --version
```

1Password documents `winget install 1password-cli` as its Windows installation path
([1Password CLI setup](https://www.1password.dev/cli/get-started)).

- [x] **Step 3: Verify service-account CLI access without revealing item values**

```powershell
op whoami
op vault list
```

Require `op whoami` to identify a service account. Do not add `--reveal` to item commands.

**Completion criterion:** `op --version`, `op whoami`, and `op vault list` succeed from a fresh
PowerShell session with the securely provisioned service-account token.

### Task 2: Make 1Password the project bootstrap index

**External state:** creates a project-specific item in an approved 1Password vault.

- [x] **Step 1: Grant the service account write access to an approved vault**

Prefer a dedicated project vault. The approved general-development vault is the fallback. The
replacement service account has item read/write permission in the fallback. Dedicated-vault
creation was unavailable, so the fallback was used.

- [x] **Step 2: Create the project bootstrap item**

Create a project-specific Secure Note rather than adding project locators to a general GitHub
Login item. Add non-concealed text fields for:

- `private_repository_owner`
- `private_repository_name`
- `private_repository_url`
- `public_repository_url`
- `recovery_runbook` with a short note pointing to this public plan

The actual vault, item, and field references stay in 1Password rather than this public repository.
1Password secret references use the form `op://<vault>/<item>/<field>` and can be resolved with
`op read`
([secret references](https://www.1password.dev/cli/secret-references)).

- [ ] **Step 3: Establish 1Password's own recovery path**

Generate or confirm a 1Password recovery code where supported. Store it outside 1Password in a
physically safe or otherwise independent protected location. Confirm access to the email address
required by the recovery flow. Do not test the recovery code immediately after generation because
1Password documents a waiting period for recent sign-ins.

**Completion criterion:** the approved vault contains the project bootstrap item and its
companion-repository locator; the service account can read it; and an independent owner recovery
path has been verified without exposing any value in the terminal or repository. The service
account token is an automation credential, not a substitute for account recovery.

### Task 3: Authenticate GitHub without exposing a token

**External state:** authenticates GitHub CLI and configures its Git credential helper.

- [x] **Step 1: Verify GitHub CLI authentication**

```powershell
gh auth login --web --git-protocol https
gh auth status
```

Use the existing browser-authenticated account. Do not paste or print its token.

- [x] **Step 2: Configure Git's GitHub credential helper**

```powershell
gh auth setup-git
```

**Completion criterion:** `gh auth status` identifies the intended GitHub account, and Git
operations authenticate through GitHub CLI's keyring-backed helper without writing a token to the
workspace or environment.

### Task 4: Create and verify the private companion repository

**External state:** creates a new private GitHub repository.

- [x] **Step 1: Select the owner and a neutral repository name**

Use a neutral name such as `project-private-workspace-example`. Do not add the concrete name to
this public plan or another public file.

- [x] **Step 2: Create an empty private repository**

Run outside the sandbox, substituting the selected values:

```powershell
gh repo create "<owner>/<private-repository>" --private
```

Do not initialize it with a README, license, or `.gitignore`; the existing local `private/`
directory will provide the first commit.

- [x] **Step 3: Enforce the visibility gate**

```powershell
gh repo view "<owner>/<private-repository>" --json visibility --jq .visibility
```

Expected: exactly `PRIVATE`. Stop on any other output.

- [x] **Step 4: Record the locator in 1Password**

Populate the reserved owner, name, and URL fields from Task 2. Verify only the non-secret URL field
through the CLI when needed:

```powershell
op read "op://<vault>/<bootstrap-item>/private_repository_url"
```

This command prints the repository URL, so use it only for the non-secret locator field. Do not use
`op read` to print passwords, tokens, private keys, or recovery codes.

**Completion criterion:** GitHub reports `PRIVATE`, the initial push passed an empty-repository
gate, and the locator is retrievable from 1Password CLI without being written into this public
repository.

### Task 5: Review and import the existing private documents

**Files in the private repository:**

- Preserve: `private/dependency-modernization-2026-08.md`
- Preserve: `private/repo-analysis.md`
- Preserve: `private/todo.md`
- Create: `private/README.md`
- Create: `private/.gitignore`

- [x] **Step 1: Review all three documents for credential material**

Inspect every document for passwords, tokens, private keys, recovery codes, credential-bearing
URLs, personal information, and environment values. Move any credential to 1Password, replace it
with a plain-language reference, and repeat the scan. “No common token shape found” is insufficient;
the human intent of each value decides whether it belongs in Git.

- [x] **Step 2: Write the private repository boundary**

Create `private/README.md` describing:

- the public/private information map;
- the document and Issue workflow;
- the fresh-machine recovery sequence;
- 1Password as the credential manager and bootstrap locator;
- draft security advisories as the lane for genuine unpublished vulnerabilities;
- the prohibition against credentials in Git.

Create `private/.gitignore` with private-repository-local rules for temporary files, editor state,
and decrypted backup material. Keep its rules independent from the outer public `.gitignore`.

- [x] **Step 3: Initialize the nested repository in place**

First verify that `private/.git` does not already exist. Then:

```powershell
git -C private init -b main
git -C private status --short
```

- [x] **Step 4: Make the initial private commit**

```powershell
git -C private add README.md .gitignore dependency-modernization-2026-08.md repo-analysis.md todo.md
git -C private commit -m "chore: import private project working documents"
```

- [x] **Step 5: Add the verified HTTPS remote and push**

Run the remote operation outside the sandbox:

```powershell
gh auth setup-git
git -C private remote add origin "https://github.com/<owner>/<private-repository>.git"
git -C private push -u origin main
```

Git authenticates through GitHub CLI's keyring-backed credential helper. Re-run the GitHub
visibility check immediately before the push if the implementation session has been interrupted.
The visibility gate passed immediately before and after the push; the nested working tree is clean.

**Completion criterion:** the private repository contains the initial import, updated recovery
authentication guidance, a cross-device line-ending rule, and all three reviewed documents;
GitHub still reports `PRIVATE`; the outer repository shows only `private/` as ignored and exposes
no nested path.

### Task 6: Convert durable actions to the correct Issue trackers

**External state:** creates GitHub Issues after a sensitivity review.

- [x] **Step 1: Classify every live action in the imported private documents**

For each incomplete item, choose exactly one lane:

- public-safe engineering work → Issue in this public repository;
- private non-vulnerability work → Issue in the private companion repository;
- genuine unpublished exploitable vulnerability → draft security advisory here;
- completed or superseded item → retain only in the imported historical document.

- [x] **Step 2: Create the Issues in the selected repositories**

Use `gh issue create --repo <owner>/<repository>` outside the sandbox. Preserve enough rationale to
resume the work, while copying private prose only into authorized private locations.

- [x] **Step 3: Turn `todo.md` into a historical index**

After all live actions have canonical Issues, update `private/todo.md` to point to them and mark the
imported list as historical. Commit and push this private-only change.

**Completion criterion:** every live action has one canonical Issue or advisory, and no sensitive
action has been copied into a public Issue.

### Task 7: Add public repository guardrails and recovery instructions

**Files in this public repository:**

- Modify: `.gitignore`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Delete: `next-env.d.ts` (generated by Next.js and now ignored as its installed documentation
  requires)
- Create: `docs/agents/private-workspace.md`
- Preserve: `docs/research/cross-device-private-working-docs.md`
- Preserve: `docs/superpowers/plans/2026-08-25-cross-device-private-workspace.md`

- [x] **Step 1: Make the ignore boundary portable**

Replace the broad `private/` entry with the root-anchored `/private/` entry and add
`/.claude/settings.local.json`. Ignore and untrack the Next.js-managed `next-env.d.ts`, whose
development and production forms otherwise dirty a clean checkout. These rules make local and
generated state portable rather than depending on `C:\Users\<user>\.config\git\ignore`.

- [x] **Step 2: Write the public-safe recovery runbook**

Create `docs/agents/private-workspace.md` with this executable sequence:

1. Confirm independent owner recovery material for 1Password.
2. Install `op`, securely provision the scoped service-account token, and run `op whoami`.
3. Retrieve the private repository locator from the configured 1Password item.
4. Authenticate `gh` through the browser over HTTPS and configure `gh auth setup-git`.
5. Clone this public repository.
6. Clone the private companion into `/private/`.
7. Run `npm ci` and the normal project checks.
8. Recreate `.claude/settings.local.json` as machine-local policy.

Use placeholders for vault, item, field, owner, and repository identifiers. Explain that
`op read` is acceptable for the non-secret repository URL, while credentials stay in authorized
secret stores or the GitHub CLI keyring and never enter either repository.

- [x] **Step 3: Add a sharp `AGENTS.md` context pointer**

Add one short pointer that triggers when an agent handles private working documents, ignored
project knowledge, credential recovery, or cross-device setup. The target is
`docs/agents/private-workspace.md`. State that `private/` is a separate private Git repository and
that its contents remain outside public outputs.

- [x] **Step 4: Add a human-facing README pointer**

Add a short owner-only setup note pointing to `docs/agents/private-workspace.md`. Do not name the
private repository or a real 1Password reference.

- [x] **Step 5: Prove the outer repository boundary**

```powershell
git status --short --ignored
git check-ignore -v private/README.md
git check-ignore -v .claude/settings.local.json
git ls-files private
```

Expected: nested private files and local settings are ignored; `git ls-files private` returns no
tracked path.

**Completion criterion:** another authorized computer can discover the recovery process from public
documentation, while the public repository contains no companion-repository locator, 1Password
identifier, credential, or private prose.

### Task 8: Triage disposable agent-run artifacts

- [x] **Step 1: Review the outstanding `.superpowers/sdd/` follow-up**

Move it to the public or private Issue tracker according to Task 6's visibility test.

- [x] **Step 2: Verify the completed artifacts are represented elsewhere**

Confirm their implementation is in public Git history and any durable rationale is already in
tracked public documentation or the private repository.

- [x] **Step 3: Remove the completed local artifacts only after verification**

Resolve the exact `.superpowers/sdd/` path inside this workspace before removal. Report what was
removed and note that the generated artifacts are recoverable only by rerunning the workflow; the
durable implementation remains in Git.

**Completion criterion:** the one live follow-up has a canonical Issue, and `.superpowers/sdd/`
contains no unique durable project knowledge.

### Task 9: Perform a clean recovery rehearsal

- [x] **Step 1: Create a fresh temporary recovery directory outside this checkout**

Record its resolved absolute path. Keep it scoped beneath the system temporary directory and do not
reuse the current workspace.

- [ ] **Step 2: Bootstrap 1Password as a new computer would**

Verify that the documented offline 1Password recovery material is available without revealing it.
Use the securely provisioned service-account token for the rehearsal, then run:

```powershell
op whoami
op vault list
```

- [x] **Step 3: Retrieve the private locator and clone both repositories**

Retrieve only the non-secret locator field with `op read`. Authenticate GitHub through the browser
and its keyring-backed Git credential helper from Task 3. Clone the public repository, then clone
the private repository into its `private/` directory.

- [x] **Step 4: Compare the recovered private documents**

Use `Get-FileHash` to compare all three source documents with the fresh clone. Open each recovered
document and inspect `git -C private log` to verify history. A private-repository `.gitattributes`
rule pins Markdown to LF so the raw hashes remain stable across Windows clones; the regression
clone reproduced all three recorded hashes exactly.

- [x] **Step 5: Rebuild generated state**

From the fresh public clone:

```powershell
npm ci
npm run format:check
npm run lint
npx tsc --noEmit
npm run build
```

- [x] **Step 6: Verify repository separation**

The public clone must remain clean after the private clone and build. `git status --ignored` should
summarize `private/`, dependencies, and outputs without exposing or tracking their contents.

**Completion criterion:** starting with GitHub and independently recoverable 1Password access is
sufficient to restore both repositories, all three private documents and their history, and a
successful production build on a clean path.

### Task 10: Validate, commit, and ship the public changes

- [x] **Step 1: Run public repository checks**

```powershell
npm run format
npm run format:check
npm run lint
npx tsc --noEmit
git status --short
```

- [x] **Step 2: Inspect the public diff for disclosure**

Review every added line in `.gitignore`, `AGENTS.md`, `README.md`, `docs/agents/private-workspace.md`,
the research report, and this plan. Search for the real private repository name or URL, real
1Password vault/item identifiers, tokens, private filenames beyond the already approved inventory,
and private prose. Remove any disclosure before staging.

- [x] **Step 3: Confirm private and public commits are independent**

`git -C private status --short` must be clean after its private push. The outer `git status --short`
must list only public-safe files and must not list anything below `private/`.

- [x] **Step 4: Commit the public portability changes**

Commit the public policy, runbook, research, plan, and ignore rules on a feature branch. Do not stage
from inside `private/` with the outer repository.

- [ ] **Step 5: Ship through the repository's normal PR workflow**

Invoke the `ship` skill when the branch is ready. Its documentation refresh may adjust `AGENTS.md`
or `README.md`; repeat the disclosure review before pushing.

**Completion criterion:** the private repository is pushed and recoverable, the public PR contains
only public-safe portability material, all fast checks pass, and the recovery rehearsal is recorded
as successful.

## Final acceptance checklist

- [x] `op` is installed and authenticates as the scoped 1Password service account.
- [x] Git uses GitHub CLI's keyring-backed credential helper; no GitHub token is exposed.
- [x] 1Password contains the project bootstrap item and private-repository locator in an approved
      vault accessible to the service account.
- [ ] 1Password's own recovery material is available outside 1Password.
- [x] GitHub reports the companion repository as `PRIVATE`.
- [x] The private repository contains all three reviewed documents and their commit history.
- [x] Every live work item has exactly one correctly visible Issue or advisory.
- [x] `.claude/settings.local.json` and `/private/` are ignored by repository-owned rules.
- [x] The public repository contains no private locator, concrete 1Password reference, credential,
      or private prose.
- [x] A fresh recovery clone passes hash comparison and `npm run build`.
- [x] Public and private working trees are clean after their separate commits and pushes.
