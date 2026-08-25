# Cross-device private working documents

**Research date:** 2026-08-25

## Question

How should this public repository separate reproducible local artifacts from durable working
knowledge, while making private material recoverable on another computer?

## Recommendation

Create a second, **private GitHub repository** as the canonical store for durable private
Markdown and private work items. Clone that repository into this repository's already-ignored
`private/` directory on each development computer. Keep the public repository canonical for
code and public-safe documentation, and rebuild dependencies and output locally.

Use the GitHub features around those two repositories according to the kind of information:

- public-safe actionable work: Issues in this public repository;
- private, non-vulnerability work: Issues in the private companion repository;
- genuine unpublished vulnerabilities in this public project: draft repository security
  advisories in this repository;
- an optional private GitHub Project: a planning view over public and private issues, not the
  document store;
- credentials, recovery codes, and encryption keys: a password manager or similarly protected
  vault, not either Git repository.

This gives the private prose the same clone, commit history, diff, and recovery workflow as the
public code without putting ciphertext, private filenames, or a fragile decryption setup in the
public repository. GitHub documents that a clone includes all repository data and all versions
of every file and folder, which is the property needed for cross-device resumption
([GitHub: Cloning a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)).

## Local inventory

The inventory used `git ls-files --others --exclude-standard`,
`git ls-files --others --ignored --exclude-standard`, `git status --ignored`, and
`git check-ignore -v`, including a host-level check outside the workspace sandbox so the global
Git exclude file was applied. It inspected names and document structure, but does not reproduce
private prose. A limited scan found no common credential-token or private-key shapes; that is
not a substitute for a dedicated secret scan.

Immediately before this report was created, there were **no untracked, non-ignored files** and
**21,292 ignored files**. This report is now the only untracked, non-ignored file.

| Present path or group         |  Count | Source of status               | Classification                  | Portability decision                                                                                                                                                                                                       |
| ----------------------------- | -----: | ------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/settings.local.json` |      1 | Host-level global Git ignore   | Machine/tool-local policy       | Contains a small command-permission allowlist, not a secret. Do not put it in the private document store. Recreate the ignore on each machine, or deliberately promote only public-safe policy to a tracked shared config. |
| `node_modules/`               | 21,264 | Root `.gitignore`              | Generated dependency tree/cache | Recreate from the tracked lockfile with `npm ci`. This includes package binaries and a Vitest/Vite result cache; none is durable project knowledge.                                                                        |
| `.superpowers/sdd/`           |     24 | Its own catch-all `.gitignore` | Completed agent-run artifacts   | One nested ignore file, 14 Markdown briefs/reports/ledgers, and 9 review diffs. Preserve only any still-live follow-up as an Issue; the rest duplicates completed work and Git history.                                    |
| `private/`                    |      3 | Root `.gitignore`              | Durable, intentionally private  | Migrate all three documents to the private companion repository before removing or replacing the local copies.                                                                                                             |

The three private documents total about 58 KB and comprise a dated dependency audit, a broad
repository assessment, and its follow-through ledger. They contain durable rationale and
backlog/history, even where the implementation work is already complete. They do not appear to
contain credentials, but they are still sensitive because the owner has designated their
analysis, prioritization, and working notes as non-public. “No secret detected” is not the same
as “intended for publication.”

The `.superpowers/sdd/` material is different. Its briefs, exact command reports, commit-range
diffs, and completion ledger describe a finished AI-configuration change. The Git commits are
the durable implementation record. The only potentially durable residue is an explicit human
follow-up in the progress material; turn that residue into an appropriately visible Issue before
discarding or locally retaining the run artifacts.

### Ignored patterns with no files currently present

The root ignore rules also anticipate PnP/Yarn state, coverage, Playwright reports and results,
Next.js output, static export output, production builds, macOS metadata, debug logs, local
environment files, Vercel state, TypeScript build info, and PEM files. None of those patterns
matched a present file during this audit. `.git/info/exclude` also contains a local exclusion for
`.claude/worktrees/`; the directory currently exists but contains no files.

Most of these are reproducible. Two classes deserve different handling if they appear later:

- `.env*.local`, PEM files, and credentials should be restored from a secrets/password manager,
  never from a documentation repository.
- tool settings that affect consistent project behavior should be split into a public-safe,
  tracked shared policy and a genuinely machine-local override where the tool supports that
  distinction.

## Options considered

### 1. Private companion GitHub repository — recommended

GitHub repositories hold files and their revision history. Public repositories are accessible to
everyone on the internet; private repositories are limited to the owner, explicitly invited
people, and certain organization members. GitHub Free supports unlimited private repositories,
although some advanced private-repository features require paid plans
([GitHub: About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)).

Strengths:

- native versioning, history, Markdown rendering, Issues, search, clone, pull, and backup from a
  fresh computer;
- an access boundary independent of this public repository;
- no encryption key bootstrap merely to read working notes;
- the existing `private/` ignore rule permits a private clone at that path without changing the
  public repository's tracked tree.

Tradeoffs:

- it is a second repository to clone and keep current;
- a private repository owned by a personal account gives invited collaborators write access,
  not a read-only role, so an organization-owned repository is preferable if granular future
  collaboration matters
  ([GitHub: Permission levels for a personal account repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository));
- deleting a collaborator's remote access cannot revoke copies already present in their local
  clones, so private-repository access still requires careful membership and device hygiene.

Avoid making the companion a Git submodule unless exact cross-repository commit pinning becomes
important. A submodule would publish its URL/path and commit identifier in this repository and
would make a normal public clone fail to populate that content without private credentials. An
independent clone at ignored `private/` preserves the useful boundary with less coupling.

### 2. GitHub Issues and Projects — useful index, incomplete document store

Issues are well suited to ideas, tasks, bugs, and discussion
([GitHub: About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues)).
Repository visibility is the access boundary: GitHub defines a public repository as accessible
to everyone and a private repository as accessible only to authorized people. Therefore, the
body of an Issue in this public repository must be treated as public. Put sensitive Issues in the
private companion repository.

A GitHub Project can itself be public or private; only users with at least read access can see a
private Project. That privacy does **not** change the permissions of linked items, and a viewer
still needs access to each item's repository
([GitHub: Managing project visibility](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-visibility-of-your-projects)).
Projects accept Issues, pull requests, and project-only draft Issues with a Markdown body
([GitHub: Adding items to a project](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-items-in-your-project/adding-items-to-your-project)).

A private user Project is consequently a good optional cross-repository dashboard. It is a poor
canonical home for long-form notes: its model is planning items and fields, and the documented
export is a view-level TSV rather than a Git history of a document tree
([GitHub: Exporting project data](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/exporting-your-projects-data)).
Use it to organize canonical Issues, not replace the companion repository.

### 3. Security advisories and private vulnerability reporting — only for vulnerabilities

For a real, unpublished vulnerability in this public project, a draft repository security
advisory is the right private workspace. GitHub explicitly describes it as a way to privately
discuss and fix a security vulnerability, supports invited collaborators and a temporary private
fork, and provides a publication workflow
([GitHub: Creating a repository security advisory](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/fix-reported-vulnerabilities/create-repository-advisory)).
Owners, organization owners, security managers, and repository admins can create and access all
of the repository's advisories
([GitHub: Repository security advisory permissions](https://docs.github.com/en/code-security/reference/permissions/repository-security-advisory)).

Private vulnerability reporting is the inbound channel that lets anyone submit a vulnerability
privately when a public repository has enabled it. An administrator does not need to report to
their own repository; GitHub directs administrators to create a draft advisory instead
([GitHub: Privately reporting a security vulnerability](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately)).

Neither feature is a general private notebook. Advisories ask for vulnerability impact,
affected products/versions, severity, and weakness metadata and are designed to culminate in
closure or publication. Use them for exploitable defects and coordinated fixes, not dependency
research, roadmaps, personal notes, or ordinary hardening ideas. Non-vulnerability security work
belongs in a private companion Issue or document.

### 4. OneDrive — viable private file store or recovery layer

This checkout's path is beneath a OneDrive `Documents` directory, but the path alone does not
prove that sync is enabled or complete. Microsoft documents that files in a synced OneDrive
folder are synchronized to the cloud and accessible across computers, mobile devices, and the
web
([Microsoft: Sync files and folders with OneDrive](https://support.microsoft.com/en-US/onedrive/sync-your-computer-s-files-and-folders-with-onedrive)).
OneDrive also provides file version history
([Microsoft: Restore a previous version](https://support.microsoft.com/en-US/onedrive/restore-a-previous-version-of-a-file-stored-in-onedrive)).

OneDrive is therefore a viable simpler alternative for a separate private-documents folder, and
Personal Vault adds reauthentication, automatic locking, and blocks sharing
([Microsoft: Protect OneDrive files in Personal Vault](https://support.microsoft.com/en-US/onedrive/protect-your-onedrive-files-in-personal-vault)).
It is less integrated with Git history, Issues, and repository work. Prefer it as a separate
recovery location for account recovery material or unusually sensitive archives. Do not rely on
the mere presence of the public checkout inside a OneDrive path as proof that ignored notes have
been uploaded. Also avoid making both Git and OneDrive competing synchronization authorities for
actively edited working trees; that recommendation is an operational inference, not a stated
Microsoft limitation.

### 5. Secret Gists — unsuitable

GitHub states explicitly that secret Gists are not private: anyone who discovers the URL can
view one. GitHub recommends a private repository when the content must be kept away from others
([GitHub: Creating gists](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists)).
They are inappropriate for these documents.

### 6. Encrypted files committed to the public repository — possible, not preferred

Tools can keep ciphertext in Git. SOPS supports encrypted structured files and binary blobs with
age, PGP, and cloud KMS keys
([SOPS project documentation](https://github.com/getsops/sops/blob/main/README.rst)).
`git-crypt` transparently encrypts selected paths, but its own documentation says filenames,
commit messages, symlink targets, file lengths, and change patterns remain visible; access cannot
be revoked from old history; and some Git clients can leave files unencrypted
([git-crypt limitations](https://github.com/AGWA/git-crypt#limitations)).

This approach keeps public and private content commit-coupled, but creates a harder cross-device
problem: the new machine must retrieve a decryption identity from a separate secure channel. It
also puts permanent public metadata and an accidental-plaintext failure mode next to the public
site. It is defensible for a small number of machine-consumed secrets with mature key management,
not the best default for human-authored Markdown. A private companion repository is simpler and
provides a clearer access boundary.

## Concrete migration path

1. **Create the destination first.** Create a new repository under the same GitHub account with
   visibility explicitly set to private. Enable strong account recovery and authentication. Do
   not initialize it from this public repository or push this repository's history into it.
2. **Seed it from a temporary private checkout.** Give it a short README defining the boundary,
   then copy the three existing private Markdown documents into an `archive/` or `docs/` tree.
   Commit and push them. Do not copy credentials even if a later scan finds any.
3. **Normalize work tracking.** Convert live, private action items into Issues in the private
   repository. Move public-safe engineering tasks to this repository's Issues. Preserve completed
   assessments as versioned documents rather than hundreds of closed Issues.
4. **Triage agent-run artifacts.** Extract the one still-relevant follow-up from
   `.superpowers/sdd/` into the appropriate Issue. Do not migrate the completed briefs, command
   transcripts, and review diffs unless there is a specific audit-retention need.
5. **Prove recovery before cleanup.** Clone the new private repository into a fresh temporary
   directory using normal GitHub authentication and verify all intended documents and history
   are available. Only then replace the current ignored `private/` directory with a clone of the
   companion repository.
6. **Keep the local contract simple.** On every computer, clone the public repository, then clone
   the private companion into `private/`, then run `npm ci`. The existing `private/` ignore rule
   keeps the outer public repository clean. Do not add the nested private repository to the
   public index.
7. **Resolve the local settings file.** The current computer ignores
   `.claude/settings.local.json` through its global Git exclude file, which a fresh computer will
   not inherit. Recreate that local rule where needed. If its allowlist is intended project
   policy, promote only the non-sensitive, portable portion through the tool's supported
   shared-settings mechanism after a separate review.
8. **Add planning only if useful.** Create a private user Project and add selected Issues from
   both repositories. Keep the documents and Issues canonical; treat the Project as a view that
   can be rebuilt.
9. **Use the security lane correctly.** Enable private vulnerability reporting for outside
   reporters if desired. For owner-discovered exploitable findings, create a draft advisory in
   this public repository. Put ordinary security maintenance in the private companion instead.
10. **Test the runbook periodically.** On a clean machine or disposable environment, verify that
    GitHub account recovery, both clones, the private path, `npm ci`, and the documented project
    commands are sufficient to resume work. A portability design is complete only when recovery
    has been exercised.

## Resulting information architecture

| Information type                       | Canonical location                                |
| -------------------------------------- | ------------------------------------------------- |
| Code and public-safe durable docs      | This public repository                            |
| Public-safe actionable work            | Issues in this public repository                  |
| Private Markdown and historical audits | Private companion repository cloned at `private/` |
| Private non-vulnerability work         | Issues in the private companion repository        |
| Cross-repository planning              | Optional private GitHub Project                   |
| Unpublished exploitable vulnerability  | Draft security advisory in this public repository |
| Third-party vulnerability submissions  | Private vulnerability reporting                   |
| Credentials and recovery material      | Password manager or protected vault               |
| Dependencies, builds, tests, caches    | Rebuilt locally from tracked source and lockfiles |
| Machine-local agent permissions        | Recreated/ignored local configuration             |

This design makes “clone two repositories and rebuild” the recovery story. It keeps access
control aligned with content sensitivity and avoids treating planning boards, unlisted links, or
vulnerability workflows as general-purpose private document storage.
