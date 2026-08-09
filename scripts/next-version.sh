#!/usr/bin/env bash
# Prints the next SemVer build version (e.g. 1.1.6) this repo will tag on the next
# merge to main. Single source of truth shared by:
#   - .github/workflows/version.yml   (tag/release workflow)
#   - .github/workflows/ci.yml        ("Changelog Version" PR guard)
#   - .agents/skills/ship/SKILL.md    (the ship skill — the authored source, not the mirror)
#
# floor = package.json "version" (x.y.z: the major/minor line and the build floor)
# build = highest existing v<major>.<minor>.<int> tag + 1, never below the floor's
#         build; if no matching tag exists, build = the floor's build.
# Legacy 4-part tags (v1.0.0.1 …) are ignored: their stripped suffix ("0.1") fails
# the single-integer filter below.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pkg="${root}/package.json"

version="$(grep -m1 '"version"' "$pkg" \
  | sed -E 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')"

if ! printf '%s' "$version" | grep -Eq '^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'; then
  echo "next-version: package.json version '$version' must be plain SemVer x.y.z" >&2
  exit 1
fi

IFS=. read -r major minor requested_build <<< "$version"

last_build="$(
  git tag --list "v${major}.${minor}.*" \
    | sed -E "s/^v${major}\.${minor}\.//" \
    | grep -E '^(0|[1-9][0-9]*)$' \
    | sort -n \
    | tail -1 || true
)"

if [ -z "$last_build" ]; then
  build="$requested_build"
else
  build=$(( last_build + 1 ))
  if [ "$build" -lt "$requested_build" ]; then
    build="$requested_build"
  fi
fi

printf '%s.%s.%s\n' "$major" "$minor" "$build"
