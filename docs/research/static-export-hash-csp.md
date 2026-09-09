# Hash-based script CSP for a static export

Primary-source review and local measurements: 2026-09-06. This document records
platform constraints, browser evidence, and deployment acceptance criteria. Local
results do not establish compatibility with the deployed Cloudflare configuration.

## Feasibility

An export can authorize its inline scripts using hashes computed after the build.
CSP matches the UTF-8 encoded script contents against a base64 digest, so whitespace
and emitted content matter. Hash the browser-visible script text, excluding the
surrounding tags, without trimming or reformatting it. Regenerate the policy for
each export; source-code hashes cannot substitute for emitted-script hashes.
These are implementation consequences of the
[CSP inline matching algorithm](https://www.w3.org/TR/CSP3/#match-element-to-source-list).

Next.js documents that per-request nonces require dynamic rendering. Its
experimental SRI feature adds integrity attributes to JavaScript assets and is
webpack-only; it is not a post-export inline-script hashing mechanism for this
Turbopack project. These constraints are also documented in the installed
`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`.
See the [Next.js CSP guide](https://nextjs.org/docs/app/guides/content-security-policy).

The installed `next-themes` 0.4.6 bundle emits an inline theme initializer containing
serialized provider configuration. The corresponding
[upstream implementation](https://github.com/pacocoursey/next-themes/blob/main/next-themes/src/index.tsx)
uses `dangerouslySetInnerHTML` for that initializer and injects a temporary style
element when disabling transitions. A script hash can authorize the initializer;
this does not justify removing `style-src 'unsafe-inline'`. The project's
[theme provider](../../components/theme-provider.tsx) enables that transition behavior.

## Cloudflare Pages limits

Pages permits 100 header rules and limits each `_headers` line to 2,000 characters,
including indentation, header name, separator, and value. All matching rules apply;
repeated header values are comma-joined. A narrower path rule does not automatically
replace a matching wildcard header. Cloudflare documents explicit header removal
syntax. See [Pages headers](https://developers.cloudflare.com/pages/configuration/headers/).

The complete generated line must fit, not merely its hash list. A quoted SHA-256
source expression takes 53 characters, plus its separating space; the available
hash count depends on all the other policy directives. This arithmetic makes a
single global union of route hashes a potential deployment blocker. Cloudflare
recommends Pages Functions for headers beyond the limit, which would change this
project's static-only deployment. See
[Pages limits](https://developers.cloudflare.com/pages/platform/limits/).

Splitting one script allowlist across multiple CSP headers does not evade the
limit: browsers enforce every policy, so a script must satisfy each list. A
hash allowed by only one list remains blocked by another. See
[CSP multiple-policy semantics](https://www.w3.org/TR/CSP3/#multiple-policies).

Pages serves custom `404.html` content for missing paths and redirects HTML file
URLs to extensionless equivalents. Therefore per-route header designs must cover
actual request paths, including unknown paths that receive the fallback document.
See [Pages serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Validation criteria

The following are project acceptance criteria derived from those constraints:

- Inventory inline scripts across every emitted HTML document, including fallback
  pages. Deduplicate exact contents and measure the final header lines.
- Compute hashes from the finished export and write policy and HTML into the same
  deployment artifact. Fail generation if any line exceeds the platform limit.
- Confirm normal hydration, navigation, mobile disclosure, both system themes,
  stored theme preference, theme toggling, and reload persistence in a production
  export served with the candidate HTTP header.
- Capture unexpected CSP violations and browser errors. Include a negative control
  proving an injected unapproved inline script is blocked.
- Validate root, explicit HTML aliases, extensionless routes, and an unknown-path
  404 against their actual responses. A local content-only preview cannot establish
  Cloudflare header matching or deployment behavior.
- Check the deployed response header against the exact deployed script contents;
  any CDN transformation or injected script must be included in this verification.

Retaining `'self'` for external JavaScript is a deliberate scope choice. Removing
broad inline execution is an improvement, but it does not by itself establish the
stronger hash/nonce-only policy described as
[strict CSP](https://www.w3.org/TR/CSP3/#strict-csp).

## Measured export and browser evidence

On 2026-09-06, `npm run build` produced the following documents using Next.js 16.3.4,
next-themes 0.4.6, Node 26.8.1, and the repository's locked dependencies:

| Export document   | Inline scripts |
| ----------------- | -------------: |
| `index.html`      |             17 |
| `404.html`        |              9 |
| `_not-found.html` |              9 |

The union contains **23 distinct SHA-256 hashes**. Replacing only the current
`script-src 'unsafe-inline'` allowance produces a complete header line of **1,479
characters**, leaving 521 characters under the Pages limit. These are measurements
of this build, not a fixed budget for future exports. The inventory conservatively
includes the JSON-LD script along with executable scripts.

The reproducible evaluator is [benchmarks/hash-csp.mjs](../../benchmarks/hash-csp.mjs).
It reads finished HTML with an HTML parser, hashes script text, deduplicates hashes,
asserts the line limit, and serves the candidate as an HTTP response header from a
loopback-only server. It keeps the other CSP directives, including inline styles,
unchanged. It does not modify `public/_headers` or any exported file.

```bash
npm run build
npm run benchmark:csp
# Explicit subset when only these browser runtimes are available:
npm run benchmark:csp -- --browsers=chromium,firefox
```

Chromium and Firefox passed with both light and dark system color schemes, using
a mobile viewport. The assertions cover each exported document and its local
extensionless alias, theme initialization, hydrated theme controls, toggling,
stored preference after reload, mobile-menu opening and closing, anchor navigation,
unknown-path 404 content, and recovery to the homepage. No unexpected CSP violations
or runtime page errors occurred. Each browser/theme combination also rejected an
unapproved injected inline script and emitted the expected script CSP violation.

The all-browser run could not launch WebKit on the host: Playwright reported missing
`libicu74`, `libjpeg-turbo8`, and `gstreamer1.0-libav`. That is an environment failure,
not a successful WebKit result. The evaluator fails on missing browsers rather than
silently skipping them. The application error boundary was not artificially
triggered; the error documents examined were the exported 404 documents.

## Hosted verification on 2026-09-08

A fresh export on Windows with Node 26.4.0, Next.js 16.3.4, and Playwright 1.63.0
retained the 23-hash union and 1,479-character header line. Chromium, Firefox, and
WebKit passed locally in both system themes. Installing the Windows WebKit runtime
resolved the earlier host dependency limitation without an administrator action.

The same export was directly uploaded to a Cloudflare Pages preview with its generated
candidate header. The evaluator supports `--preview-output=<fresh-directory>` to copy
the completed export and replace only that copy's CSP, and `--url=<preview-url>` to
run its checks against hosted responses. Never upload a parent directory containing
private working documents. The original `out/` and `public/_headers` remain unchanged.

The candidate preview is
[0fe35ff4](https://0fe35ff4.caitlyn-holland-vip.pages.dev).
A control preview of the identical export with the original policy is
[9f24c9a5](https://9f24c9a5.caitlyn-holland-vip.pages.dev).
Use `--policy=compatibility` only for the control: its negative probe must execute,
whereas the candidate must block that probe.

The full hosted run passed Chromium, Firefox, and WebKit in both themes. It checked
the exact candidate response header and hashes of hosted inline script text across
HTML aliases and extensionless paths, plus hydration, navigation, stored-theme
persistence, fallback 404 behavior, and rejection of the unapproved inline probe.
No unexpected CSP violations or runtime errors remained in that completed run.

Initial hosted WebKit runs reported intermittent access-control page errors for
Next.js route-data fetches. The identical compatibility-policy control reproduced
the error. Waiting for prefetch traffic to settle before replacing documents in
the evaluator eliminated the observed failure without suppressing page errors or
CSP violations. This is evidence of a navigation-timing artifact in the evaluator,
not evidence that the candidate requires a broader script policy.

## Deployment decision

A global hash union is locally feasible for this export and avoids route-specific
header matching. This evaluation supports a post-export generation design with a
hard failure if the final line exceeds 2,000 characters. Hashes must be regenerated
from every final build rather than copied from this measurement.

`npm run build` now runs [scripts/generate-csp.mjs](../../scripts/generate-csp.mjs)
after Next.js finishes. It hashes browser-visible inline script text across all HTML
documents, requires the homepage and 404 export, and writes a global union into
`out/_headers`. The source `public/_headers` is a restrictive template with only
`script-src 'self'`; generation leaves that template unchanged. Validation errors,
including a complete header line longer than 2,000 characters, fail the build before
the generated header is written. Unit tests cover exact hashing, deduplication,
nested/error pages, changed content, invalid templates, and oversized policies.

CI independently recomputes the expected hashes in the browser evaluator and compares
them with `out/_headers` before exercising Chromium. The deployed smoke checker rejects
the old broad inline-script policy and requires SHA-256 sources. The integrated build
was uploaded to [preview befd705a](https://befd705a.caitlyn-holland-vip.pages.dev) for
the three-browser acceptance run. Revert the integration and template changes together
through a reviewed PR if a future deployment requires restoring the compatibility policy;
do not copy old build hashes into a new export.
The preview does not establish the behavior of additional transformations configured
only for the production custom domain. These checks are deployment acceptance
conditions, not evidence of an existing exploitable vulnerability. The canonical action remains
[issue #175](https://github.com/jwh3times/caitlyn-holland-vip/issues/175); this document
records the design evidence rather than maintaining a parallel task list.
