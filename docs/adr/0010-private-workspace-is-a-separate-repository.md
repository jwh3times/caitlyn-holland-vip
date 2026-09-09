# Durable private knowledge lives in a separate repository, indexed by 1Password

The project's private working documents live in an independent private Git repository cloned into
this repository's ignored `/private/` directory, and 1Password holds the credentials plus the
locator that finds it. This repository stays canonical for code and public-safe documentation; the
companion is a document and issue workspace, not a credential store; 1Password is the credential
manager and bootstrap index, not the document store. Each piece of information has exactly one home
([the recovery runbook](../agents/private-workspace.md) is the executable form of this decision).

The problem was that durable private knowledge — audits, analyses, decisions that are not
public-safe — existed only as ignored files on one computer. Ignored files are invisible to every
recovery path this project has: they are not in the public remote, not in any backup the repository
provides, and not discoverable from another machine. Meanwhile the reproducible ignored state
(`node_modules/`, build output, completed agent-run artifacts) genuinely should stay local, so
"back up everything ignored" was not the answer either. The split is between _durable_ and
_reproducible_, not between tracked and ignored.

Making it a separate repository rather than a submodule keeps the two histories independent: no
gitlink records a private commit in a public one, and a public clone does not require access to the
private one. That is a structural default rather than a containment guarantee. `/private/` is
excluded by repository-owned ignore rules, so a forced `git add -f`, a copied excerpt, or a paste
into a public issue still publishes private prose; the separation keeps accidents out, and keeping
deliberate or careless disclosure out remains a matter of convention. `npm run bootstrap:private`
is idempotent and refuses to clone anything GitHub does not report as `PRIVATE`, but that check
runs when it clones and under `--verify` — an ordinary run leaves an existing `private/.git`
checkout unverified, which is why the runbook verifies an existing companion explicitly during
recovery.

## Considered options

Committing the private documents into this repository, encrypted, was the alternative — it needs no
second remote and no 1Password dependency. It was rejected because an encrypted blob in a public
repository is a permanent artifact: a key compromise is retroactive across the whole history, and
the material cannot be selectively shared. A private GitHub repository gets access control and
issues for free — but not advisories, which GitHub offers on public repositories only.

Storing the documents in 1Password itself was also considered and rejected. 1Password is built for
secrets, not for versioned Markdown — no diffs, no history, no review. Keeping it as the index
rather than the store is what makes a fresh machine bootstrappable from one credential.

## Consequences

- Genuine unpublished vulnerabilities go in **draft security advisories in this public repository**,
  which GitHub keeps private until disclosure — not in the companion, which has no advisory lane.
- Credentials never enter either repository. The public one carries no companion locator, no
  1Password vault or item identifier, and no private prose; public instructions use placeholders.
- Commits under `private/` go only to the private remote. `/private/` and
  `/.claude/settings.local.json` are ignored by **repository-owned** rules, not by a machine's
  global git exclude file, so the boundary travels with the checkout.
- A private document that contradicts a public ADR is a real failure mode, since neither side sees
  the other. Mark superseded private recommendations explicitly.
- 1Password's own recovery material must be kept outside 1Password, or recovery depends on access to
  the account being recovered. A service-account token is an automation credential, not an account
  recovery method.
