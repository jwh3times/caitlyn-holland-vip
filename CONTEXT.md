# caitlyn.holland.vip

A single-page personal website, statically exported and served from a CDN. The repo carries two distinct vocabularies: one for the site itself, and one for the machinery that keeps its AI-tool configuration in sync.

## Language

### Site

**Section**:
A top-level region of the single page — one component in `components/sections/`, re-exported from the barrel and anchored by an `id` that the navigation links to.
_Avoid_: block, panel, module

**Profile**:
The shared facts about the site's subject — `name`, `siteUrl`, `description`, `bio` — held in `lib/profile.ts` and consumed by metadata, the sitemap, and repeated page copy.
_Avoid_: bio, site info, site data

**CTA**:
A navigation link styled as a call to action, rendered by `CtaLink`. Distinct from a `Button`, which performs an action rather than navigating.
_Avoid_: action button, button link

**Tone**:
A CTA's semantic emphasis — `primary` or `secondary`. Chosen for meaning, not appearance.
_Avoid_: variant, style, kind, colour

**Theme token**:
A CSS custom property in `app/globals.css` carrying one colour for both light and dark, read through a semantic utility class rather than referenced directly.
_Avoid_: colour variable, palette entry, CSS var

**Mounted guard**:
The `useSyncExternalStore` gate that keeps theme-dependent UI rendering its server-matching fallback until the client has hydrated.
_Avoid_: hydration check, client check

### Repo machinery

**Source**:
An authored configuration file — anything under `.agents/skills/` or `.claude/agents/`. The only place an edit is valid.
_Avoid_: original, master copy

**Mirror**:
A file generated from a Source by `npm run sync:ai` — anything under `.claude/skills/` or `.codex/agents/`. Never edited by hand.
_Avoid_: copy, duplicate, build output

**Skill**:
A capability authored under `.agents/skills/<name>/` and mirrored into `.claude/skills/`.
_Avoid_: command, macro

**Agent**:
A subagent definition authored at `.claude/agents/<name>.md` and converted into `.codex/agents/<name>.toml` — the opposite direction from a Skill.
_Avoid_: persona, bot

**Parity**:
The invariant that every Mirror matches what regenerating from its Source would produce, enforced by the `AI Config Parity` CI job.
_Avoid_: sync, drift check

**Minted version**:
The SemVer that merging a branch to `main` will create, computed by `scripts/next-version.sh`. Changelog entries are written for the Minted version.
_Avoid_: next version, release number, upcoming version

**Floor**:
The `version` field in `package.json`, acting only as a lower bound on the Minted version — not a record of the current release.
_Avoid_: current version, package version
