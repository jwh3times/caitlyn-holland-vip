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
Hosted mode derives the expected allowlist from the deployed HTML at the export's
document paths, because an independent Cloudflare build can emit different script
contents from a local build of the same commit. It then compares that expectation
with the actual response policy; it does not assume the returned policy is correct.

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

### Accepted compatibility policy (2026-09-09)

The owner selected the documented compatibility exception rather than hash-policy
adoption or suppression of Cloudflare features. This aligns with the owner-supplied
2026-09-05 holland.vip review guidance: describe inline allowance as an accepted
limitation with its actual rationale; retain browser-validated `base-uri`,
`object-src 'none'`, and `form-action`; evaluate generated hashes if stronger script
restrictions are desired; do not add a runtime server or per-request nonces solely
to satisfy generic CSP advice. Caitlyn's H-03 finding was Low; no exploitable XSS
was found in that review. That finding is not a guarantee against future XSS.
Decision and implementation evidence belong on
[issue #175](https://github.com/jwh3times/caitlyn-holland-vip/issues/175).

The accepted shape matches the [root site's script and connection allowlists](https://github.com/jwh3times/holland-vip/blob/main/public/_headers):
`script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com` and
`connect-src 'self' https://cloudflareinsights.com`. The same-origin connection
source covers `/cdn-cgi/rum`. Other Caitlyn directives remain unchanged, including
`base-uri 'self'`, `object-src 'none'`, `form-action 'self'`, and framing controls.
The rationale is compatibility with Next.js bootstrap/hydration, the pre-paint
theme initializer, Cloudflare JSD, and Analytics. Static export does not force
this exception: the hash experiments establish feasibility and its tradeoffs.
Unapproved inline scripts can execute under this accepted policy.

Production builds copy `public/_headers` unchanged and run the read-only
[export validator](../../scripts/validate-export-headers.mjs). CI and smoke verify
the explicit compatibility policy, reject stale hashes/nonces and script overrides,
and retain the non-conflicting hardening checks. The browser evaluator's
`--policy=compatibility` mode checks this policy and explicitly demonstrates the
inline-execution limitation. Its default remains a research-only hash candidate,
computed from completed HTML without changing the production export.

The [Cache Response Rule experiment](cloudflare-hostname-script-exclusion.md#cache-response-rule-measured-outcome-2026-09-09)
passed but was declined for production because it suppresses JSD/Analytics and
potentially other transformations. It remains durable research. No Cloudflare
zone, DNS, WAF, bot, or Analytics configuration change is part of this policy
decision. A future Analytics opt-out is a separate Web Analytics decision, not a
CSP block. Revisit hash-based CSP for both sites together if the root adopts it.

### Historical hash integration (PR #190)

A global hash union is locally feasible for this export and avoids route-specific
header matching. This evaluation supports a post-export generation design with a
hard failure if the final line exceeds 2,000 characters. Hashes must be regenerated
from every final build rather than copied from this measurement.

PR #190 made `npm run build` run [scripts/generate-csp.mjs at that release](https://github.com/jwh3times/caitlyn-holland-vip/blob/e13b4fb82e087cd98d57c35b70123f2748a9cfdb/scripts/generate-csp.mjs)
after Next.js finishes. It hashes browser-visible inline script text across all HTML
documents, requires the homepage and 404 export, and writes a global union into
`out/_headers`. The source `public/_headers` is a restrictive template with only
`script-src 'self'`; generation leaves that template unchanged. Validation errors,
including a complete header line longer than 2,000 characters, fail the build before
the generated header is written. Unit tests cover exact hashing, deduplication,
nested/error pages, changed content, invalid templates, and oversized policies.

That integration's CI independently recomputed hashes in the browser evaluator and compared
them with `out/_headers` before exercising Chromium. Its smoke checker rejected
the broad inline-script policy and required SHA-256 sources. The integrated build
was uploaded to [preview befd705a](https://befd705a.caitlyn-holland-vip.pages.dev) for
the three-browser acceptance run. Revert the integration and template changes together
through a reviewed PR if a future deployment requires restoring the compatibility policy;
do not copy old build hashes into a new export.
The preview does not establish the behavior of additional transformations configured
only for the production custom domain. These checks are deployment acceptance
conditions, not evidence of an existing exploitable vulnerability. The canonical action remains
[issue #175](https://github.com/jwh3times/caitlyn-holland-vip/issues/175); this document
records the design evidence rather than maintaining a parallel task list.

## Response-transformation isolation experiment (2026-09-08)

Cloudflare documents that an origin `Cache-Control: no-transform` directive prevents
[JavaScript Detections injection](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/)
and [automatic Web Analytics injection](https://developers.cloudflare.com/web-analytics/faq/).
It also [disables edge compression of uncompressed origin responses](https://developers.cloudflare.com/cache/concepts/cache-control/).
This is a per-response alternative to changing the zone-wide bot setting, not proof
that every Pages response preserves the directive.

The Pages preview experiment retained `public, max-age=0, must-revalidate` and added
`no-transform`. The homepage had no analytics injection. Applying it to every resource
increased measured homepage-plus-referenced-script/style transfer from 210,748 bytes
(Brotli control) to 697,098 bytes (uncompressed candidate). These are cold HTTP payload
measurements, not Core Web Vitals or identical-build benchmarks.

Generating exact exceptions for emitted `/_next/static/` JavaScript, CSS, and fonts
restored asset compression: the refined preview transferred 243,748 bytes in that
measurement. HTML remained uncompressed. Each exception detaches Cache-Control and
restores `public, max-age=0, must-revalidate`; it does not change CSP. Exact exported
paths avoid exempting unknown asset-like paths that serve fallback HTML. The generator
checks the 100-rule limit as well as every 2,000-character line limit.

The refined [preview 6b7ede93](https://6b7ede93.caitlyn-holland-vip.pages.dev) **failed
fallback-header acceptance**: `/missing-csp-fixture` and missing paths under
`/_next/static/` returned HTTP 404 with `Cache-Control: no-store`, without
`no-transform`. Direct `/404` returned HTTP 200 with the directive. An additional
[explicit-detachment/path-override probe](https://5e4873f0.caitlyn-holland-vip.pages.dev)
still returned only `no-store` on unknown-path 404s. The browser evaluator and smoke
checker rejected that missing protection. A passing pages.dev browser check cannot
establish whether custom-domain JSD is injected before or after that header replacement.
Do not infer that this experiment is production-ready or that a live rollout fixes 404s.

The evaluator now also exercises the actual `app/error.tsx` boundary and its reset
button by fault-injecting the external navigation chunk inside an isolated browser
context. It leaves HTML, CSP, inline scripts, and the error component unchanged; no
crash route or test switch is shipped. The probe requires the error heading, clears
the render fault, clicks Try Again, and checks recovered theme controls and CSP
violations. Chromium, Firefox, and WebKit passed in both themes on the initial
[preview 9b4a4f83](https://9b4a4f83.caitlyn-holland-vip.pages.dev), before the stronger
fallback-header assertions exposed the limitation above. That result demonstrates
error-boundary compatibility, not completed transformation-isolation acceptance.

A custom-domain preview can distinguish the remaining serving-layer behavior without
moving production traffic. Cloudflare documents the required project binding and
proxied branch CNAME in its [custom branch alias guide](https://developers.cloudflare.com/pages/how-to/custom-branch-aliases/).
Any such test must verify injection on a control deployment first: a hostname without
the production feature configuration cannot establish compatibility.

The subsequent owner-provisioned custom-domain test directly reproduced the failure
on the candidate: Chromium, Firefox, and WebKit had no unexpected CSP violations on
the homepage, but `/missing-csp-fixture` returned 404 with `Cache-Control: no-store`
and blocked both injected JSD inline code and the analytics beacon. A missing asset-like
URL also blocked the beacon. This disproves candidate compatibility; a separate control
rollout is unnecessary to reject a candidate already exhibiting the actual failure.
The no-transform-only Pages approach is not an accepted remediation for this deployment.
