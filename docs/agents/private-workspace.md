# Private workspace recovery

The project is split across two independent repositories:

- this public repository is canonical for code and public-safe documentation;
- its ignored `/private/` directory is a separate private Git repository for durable private
  Markdown and private non-vulnerability Issues.

1Password is the canonical credential manager and bootstrap index. It stores the scoped automation
credential and project repository locators; it is not the document store. Keep 1Password's own
recovery material in a safe location outside the account so recovery does not depend on access to
the account being recovered.

## Recover on another computer

The recovery sequence is the same on Linux, macOS, and Windows. Only two things differ by
platform: how 1Password CLI is installed, and how a shell variable is set. Where the commands
diverge, a POSIX block (bash or zsh, including git-bash on Windows) is followed by a PowerShell
block; unmarked blocks are identical in every shell. `npm run bootstrap:private` is plain Node
with no shell dependency, so it behaves the same everywhere.

1. Confirm that the owner's independently stored 1Password recovery material is available. The
   automated recovery path uses a scoped service account and does not require desktop-app
   interaction.
2. Install 1Password CLI 2 using the platform's documented path
   ([1Password CLI setup](https://www.1password.dev/cli/get-started)):

   - **Linux** — install the package for the distribution from the official installation guide.
   - **macOS** — `brew install 1password-cli`
   - **Windows** — `winget install 1password-cli`

   For an automated agent session, provision the scoped service-account token through an
   authorized machine-secret channel as `OP_SERVICE_ACCOUNT_TOKEN`, then run:

   ```bash
   op whoami
   op vault list
   ```

   Never print the token, paste it into a command, write it to a repository, or persist it in a
   shell profile. A service-account token enables scoped automation; it does not replace the
   owner's independent 1Password account-recovery material.

3. Retrieve only the non-secret private-repository locator from the configured 1Password item:

   ```bash
   private_repository_url="$(op read "op://<vault>/<bootstrap-item>/private_repository_url")"
   ```

   ```powershell
   $privateRepositoryUrl = op read "op://<vault>/<bootstrap-item>/private_repository_url"
   ```

   Printing this locator for a clone is acceptable. Do not use `op read` to print passwords,
   tokens, private keys, recovery codes, or backup passphrases. Credential fields stay inside
   1Password and are consumed through browser authentication or the SSH agent.

4. Authenticate GitHub CLI through the browser over HTTPS and configure its Git credential helper:

   ```bash
   gh auth login --web --git-protocol https
   gh auth setup-git
   gh auth status
   ```

   Do not print the GitHub token, copy it into a workspace, or place it in an environment
   variable. Where `gh` is unavailable — a remote or web agent session, for example — use the
   GitHub MCP tools for the equivalent repository operations.

5. Clone the public repository using its public URL and enter the checkout:

   ```bash
   git clone "https://github.com/<owner>/<public-repository>.git"
   cd "<public-repository>"
   ```

   ```powershell
   git clone "https://github.com/<owner>/<public-repository>.git"
   Set-Location "<public-repository>"
   ```

6. Clone the private companion into the ignored root-level directory. Point the non-secret
   1Password reference at the locator field for the single command, then run the idempotent
   bootstrap:

   ```bash
   CAITLYN_HOLLAND_PRIVATE_REPOSITORY_REFERENCE="op://<vault>/<bootstrap-item>/private_repository_url" \
     npm run bootstrap:private
   git -C private status --short
   ```

   ```powershell
   $env:CAITLYN_HOLLAND_PRIVATE_REPOSITORY_REFERENCE = "op://<vault>/<bootstrap-item>/private_repository_url"
   npm run bootstrap:private
   Remove-Item Env:CAITLYN_HOLLAND_PRIVATE_REPOSITORY_REFERENCE
   git -C private status --short
   ```

   The reference identifies the locator field; it is not a credential. Alternatively, pass a
   one-time reference with `npm run bootstrap:private -- --op-reference "op://..."`, or an already
   retrieved credential-free GitHub URL with
   `npm run bootstrap:private -- --url "<private-repository-url>"`. Automated sessions that must
   retrieve the scoped service-account token from an existing 1Password identity may set
   `CAITLYN_HOLLAND_OP_SERVICE_ACCOUNT_REFERENCE` or pass `--service-account-reference`. Do not
   persist either reference in this public repository.

   The bootstrap refuses to overwrite a non-empty non-Git directory, validates that the clone URL
   is a credential-free GitHub HTTPS or SSH URL, and verifies that GitHub reports the repository as
   `PRIVATE` before cloning. Its ordinary mode leaves an existing `private/.git` checkout alone
   without verifying it. During recovery, verify an existing companion explicitly:

   ```bash
   npm run bootstrap:private -- --verify --op-reference "op://<vault>/<bootstrap-item>/private_repository_url"
   ```

   This command also works in PowerShell. Alternatively, supply `--verify --url
"<private-repository-url>"` using the independently retrieved locator. Do not use the existing
   checkout's own remote as the expected identity; that would only compare it with itself.

   Verification checks a real worktree rooted at `private/`, exactly one safe fetch and push URL
   for `origin` matching the intended GitHub repository, and current `PRIVATE` visibility. Linked
   worktrees with a `.git` file are supported. The command does not clone, repair remotes, change
   branches, or modify files/index content; dirty worktrees can be verified too. Unexpected
   contents, missing access, or mismatched identity/visibility fail verification. Investigate the
   mismatch using the trusted locator before making any repair.

   Never add `private/` as a submodule or stage its contents in the outer repository.

7. Match the Node version pinned in [.nvmrc](../../.nvmrc) before installing — `nvm use` on a
   machine with nvm, or the distribution equivalent. An older npm rewrites `package-lock.json`.
   Then recreate generated local state and run the normal checks:

   ```bash
   npm ci
   npm run format:check
   npm run lint
   npx tsc --noEmit
   npm run build
   ```

8. Recreate `.claude/settings.local.json` as machine-local policy if needed. The file is ignored by
   repository-owned rules and must remain untracked.

## Ongoing boundaries

- Public-safe work belongs in this repository's Issues.
- Private non-vulnerability work belongs in the companion repository's Issues.
- Genuine unpublished exploitable vulnerabilities belong in draft security advisories in this
  public repository, which remain private until disclosure.
- Credentials and recovery material never belong in Git.
- Commits made under `private/` go only to the private remote; public policy and recovery-doc
  commits go only to this repository.
