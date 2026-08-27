# Private workspace recovery

The project is split across two independent repositories:

- this public repository is canonical for code and public-safe documentation;
- its ignored `/private/` directory is a separate private Git repository for durable private
  Markdown and private non-vulnerability Issues.

1Password is the canonical credential manager and bootstrap index. It stores the scoped automation
credential and project repository locators; it is not the document store. Keep 1Password's own
recovery material in a safe location outside the account so recovery does not depend on access to
the account being recovered.

## Recover on another Windows computer

1. Confirm that the owner's independently stored 1Password recovery material is available. The
   automated recovery path uses a scoped service account and does not require desktop-app
   interaction.
2. Install 1Password CLI 2 with `winget install 1password-cli`. For an automated agent session,
   provision the scoped service-account token through an authorized machine-secret channel as
   `OP_SERVICE_ACCOUNT_TOKEN`, then run:

   ```powershell
   op whoami
   op vault list
   ```

   Never print the token, paste it into a command, write it to a repository, or persist it in a
   shell profile. A service-account token enables scoped automation; it does not replace the
   owner's independent 1Password account-recovery material.

3. Retrieve only the non-secret private-repository locator from the configured 1Password item:

   ```powershell
   $privateRepositoryUrl = op read "op://<vault>/<bootstrap-item>/private_repository_url"
   ```

   Printing this locator for a clone is acceptable. Do not use `op read` to print passwords,
   tokens, private keys, recovery codes, or backup passphrases. Credential fields stay inside
   1Password and are consumed through browser authentication or the SSH agent.

4. Authenticate GitHub CLI through the browser over HTTPS and configure its Git credential helper:

   ```powershell
   gh auth login --web --git-protocol https
   gh auth setup-git
   gh auth status
   ```

   Do not print the GitHub token, copy it into a workspace, or place it in an environment variable.

5. Clone the public repository using its public URL and enter the checkout:

   ```powershell
   git clone "https://github.com/<owner>/<public-repository>.git"
   Set-Location "<public-repository>"
   ```

6. Clone the private companion into the ignored root-level directory. Configure the non-secret
   1Password reference for the current shell, then run the idempotent bootstrap command:

   ```powershell
   $env:CAITLYN_HOLLAND_PRIVATE_REPOSITORY_REFERENCE = "op://<vault>/<bootstrap-item>/private_repository_url"
   npm run bootstrap:private
   Remove-Item Env:CAITLYN_HOLLAND_PRIVATE_REPOSITORY_REFERENCE
   git -C private status --short
   ```

   The reference identifies the locator field; it is not a credential. Alternatively, pass a
   one-time reference with `npm run bootstrap:private -- --op-reference "op://..."`, or an already
   retrieved credential-free GitHub URL with `npm run bootstrap:private -- --url $privateRepositoryUrl`.
   Automated sessions that must retrieve the scoped service-account token from an existing
   1Password identity may set `CAITLYN_HOLLAND_OP_SERVICE_ACCOUNT_REFERENCE` or pass
   `--service-account-reference`. Do not persist either reference in this public repository.

   The bootstrap refuses to overwrite a non-empty non-Git directory, validates that the clone URL
   is a credential-free GitHub HTTPS or SSH URL, and verifies that GitHub reports the repository as
   `PRIVATE` before cloning. It exits successfully without changing an existing `private/.git`
   checkout, so it is safe to run when creating each new worktree.

   Never add `private/` as a submodule or stage its contents in the outer repository.

7. Recreate generated local state and run the normal checks:

   ```powershell
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
