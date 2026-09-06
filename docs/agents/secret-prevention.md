# Secret-file prevention

Credentials belong in 1Password, never in Git. The repository ignores `.env`, `.env.*`, private
key files, and common credential exports at every directory depth. Only `.env.example` and
`.env.*.example` are allowed environment templates; use empty values or obvious placeholders
and review them before staging. An example filename does not make its contents safe.

Ignore rules prevent ordinary accidental additions. They do not remove already tracked files,
prevent `git add --force`, or detect credentials copied into source code or Markdown.

## Local scanning before publication

Install a reviewed [Gitleaks release](https://github.com/gitleaks/gitleaks/releases) and verify
its downloaded archive against that release's checksums. The commands below use the Gitleaks
8.30.1 CLI. Gitleaks scans locally; it does not require a hosted scanning subscription or an
account token. Follow the [upstream usage guide](https://github.com/gitleaks/gitleaks#usage) when
updating the tool.

Review and stage only the files intended for the current repository, then run:

```bash
git diff --cached --stat
gitleaks git --pre-commit --staged --redact --no-banner .
```

This checks staged additions, including files intentionally allowed by `.gitignore`. For a
history review, fetch the relevant branches and tags and scan every locally available ref:

```bash
gitleaks git --log-opts="--all" --redact --no-banner .
```

History scanning excludes uncommitted content; staged scanning excludes unstaged and untracked
content. Use `gitleaks dir --redact --no-banner <directory>` for an uncommitted document directory.
Keep any reports in a private location: redaction hides detected secret values, but filenames,
commit metadata, and surrounding context can still be private. Do not upload private scan output
to public CI artifacts or issues.

These are manual checks, not an installed Git hook or an additional CI gate. A successful scan
only means the enabled rules found no matches in the examined input. Review staged content too;
unknown credential formats, encoded data, and files outside the scan can escape detection. If a
credential is found, stop publication, revoke or rotate it through the provider, and follow
[the private reporting policy](../../SECURITY.md) when a vulnerability is involved.

## Separate repositories and wikis

Run the checks independently in each authorized repository. Scanning the public repository's
Git history does not scan the ignored private companion or its wiki. A wiki has its own Git
repository and must be cloned separately into a private location and scanned there. Ordinary
repository hooks and CI do not cover edits made through GitHub's wiki editor.

GitHub-hosted scanning availability depends on repository visibility and account entitlements;
see [GitHub's secret-scanning documentation](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning).
Verify the actual repository setting before relying on it. Local scanning complements hosted
protection and also works when hosted scanning is unavailable.
