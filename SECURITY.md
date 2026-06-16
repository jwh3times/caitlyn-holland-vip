# Security Policy

## Supported versions

This is a single, continuously deployed static website. Only the version
currently live at **caitlyn.holland.vip** (the latest commit on `main`) is
supported. There are no released versions or backports.

## Reporting a vulnerability

If you believe you've found a security issue, please report it privately —
**do not open a public issue.**

- **Preferred:** use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
  (the **Security → Report a vulnerability** tab on this repository).
- **Email:** caitlyn@holland.vip

Please include enough detail to reproduce the issue (affected URL/endpoint,
steps, and impact). You can expect an acknowledgement within a few days. Since
this is a personal project maintained in spare time, response and fix times are
best-effort.

## Scope

This site is a static export with no backend, no authentication, no database,
and no user-submitted data. The most relevant areas are therefore:

- The Content Security Policy and HTTP security headers in
  [`public/_headers`](public/_headers).
- Third-party npm dependencies (monitored via Dependabot and the
  dependency-review workflow).

Out of scope: issues in third-party hosting infrastructure (Cloudflare Pages,
GitHub), and findings that require physical or privileged access to a
maintainer's machine.
