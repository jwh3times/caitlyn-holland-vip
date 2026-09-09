# Hostname-scoped Cloudflare script exclusion

Primary-source review: 2026-09-09. This records platform capabilities and the
acceptance criteria for a static-export CSP decision, not a deployment approval or
an inventory of live Cloudflare settings. Work status belongs to
[issue #175](https://github.com/jwh3times/caitlyn-holland-vip/issues/175).

## Conclusion

The owner declined production transformation suppression on 2026-09-09 and selected
the [accepted compatibility CSP](static-export-hash-csp.md#accepted-compatibility-policy-2026-09-09)
to preserve Cloudflare JSD and Analytics. The successful Cache Response Rule and
failed alternatives below remain evidence, not rollout instructions. No Cloudflare
configuration change is authorized by this document.

An HTML-only **Cache Response Rule adding `no-transform`** passed a subsequent
temporary custom-host experiment, including true Pages 404s. The response-buffering
experiment below failed. These are distinct mechanisms; neither result establishes
universal behavior across Cloudflare products. Production approval and status remain
on issue #175.

## Cache Response Rule measured outcome (2026-09-09)

Cloudflare supports setting individual cache directives on origin responses through
`set_cache_control`. With `cloudflare_only: false`, the modification is also sent
to visitors. [Available settings](https://developers.cloudflare.com/cache/how-to/cache-response-rules/settings/)

The test combined an exact temporary-host condition with
`any(http.response.headers["content-type"][*] contains "text/html")`, and set only
`no-transform` with `operation: "set"` and `cloudflare_only: false`.
Browser readback preserved existing directives: 200s gained `no-transform` beside
`public, max-age=0, must-revalidate`; genuine 404s returned `no-store, no-transform`.
The deployed build and CSP remained unchanged throughout the experiment.

Control reproduced JSD/Analytics injection and CSP violations. Candidate and repeat
each passed 15 header/page checks across Chromium, Firefox, and WebKit: homepage,
unknown-path 404, asset-like missing-path HTML 404, `/404`, and `/404.html` (the last
two resolve to 200). Neither injected script remained and no unexpected CSP
violation occurred. Six real error-boundary recovery checks and six light/dark
theme/mobile-menu checks passed per candidate run. The repeat additionally blocked
all 15 synthetic unapproved inline scripts.

HTML retained Brotli compression, contrary to the predicted loss; all 11 sampled
JS/CSS assets retained Brotli and their existing cache policy. Do not generalize
this measured compression behavior to other deployments. Email-obfuscation
suppression was not independently established by the post-load DOM check.
No separate Analytics rule was needed. After removal, the original headers and
injection returned in all browsers. Test DNS, rule, and Pages binding were removed;
production header controls stayed unchanged. This experiment supports a separately
approved production test, not automatic production acceptance.

## Earlier response-inspection proposal

Cloudflare documents a hostname-scoped **response inspection exclusion**, not a
dedicated hostname-scoped JavaScript Detections (JSD) switch: a Configuration Rule
can set `response_body_buffering` to `none`. This is a candidate for investigation,
not a verified fix for Pages fallback responses. It is narrower geographically
(one hostname) than a zone-wide toggle, but broader functionally than disabling
only JSD. [Configuration Rules settings](https://developers.cloudflare.com/rules/configuration-rules/settings/#response-body-buffering)

The prior [Pages experiment](static-export-hash-csp.md#response-transformation-isolation-experiment-2026-09-08)
found that unknown-path 404 responses lost `no-transform` and still received
blocked injected scripts. Repeating that header-only design is not evidence of
a remedy.

## Configuration Rule capability and scope

### Measured Pages outcome (2026-09-09)

An owner-authorized temporary custom-host experiment tested the existing deployed
build without changing its code or headers. The Free-plan dashboard accepted
`response_body_buffering: none`. API readback confirmed that this was the sole
action parameter, and Cloudflare Trace confirmed that the exact-host rule matched
the test request but not the production hostnames.

The setting **did not suppress JSD or the browser-visible Analytics beacon**.
Chromium, Firefox, and WebKit reproduced the same CSP violations before the rule,
with the rule, on a repeat run, and after rollback. The homepage, real unknown-path
404, and `/404` and `/404.html` aliases retained both violations; an asset-like
missing path retained the beacon violation but had no JSD loader in either case.
The aliases returned 200 and were not counted as genuine 404 coverage.

Mobile navigation and theme persistence passed in light/dark configurations in
all three browsers. The real error boundary was triggered and recovered, but its
final zero-CSP-violation assertion failed on the injected scripts. All 11 sampled
JS/CSS assets retained Brotli compression and their existing cache policy. Unknown
paths retained `Cache-Control: no-store`.

Raw HTTP and browser observations differed for Analytics, so absence in a
non-browser fetch is not evidence of browser compatibility. These measurements
reject this single-setting approach for the tested Pages deployment; they do not
establish the internal Cloudflare cause or universal behavior on other products.
The test rule, DNS record, and Pages binding were removed. No production rollout
was performed. See issue #175 for the canonical experiment record.

Configuration Rules match incoming request properties including hostname. An
exact-host expression does not depend on whether a path exists:

```text
http.host eq "caitlyn.holland.vip"
```

The product is documented on Free, Pro, Business, and Enterprise plans, with
10, 25, 50, and 300 rules respectively. Later matching configuration changes can
override earlier ones. Product availability does not prove unused quota, write
permissions, or acceptance of a particular setting on this zone.
[Configuration Rules overview](https://developers.cloudflare.com/rules/configuration-rules/)

The proposed action fragment is:

```json
{
  "action": "set_config",
  "action_parameters": {
    "response_body_buffering": "none"
  }
}
```

Configuration Rules use the zone-level `http_config_settings` phase. Existing
rules must be inspected and preserved; replacing the ruleset with this fragment
would not be a safe installation procedure.
[Configuration Rules API procedure](https://developers.cloudflare.com/rules/configuration-rules/create-api/)

Cloudflare defines `none` as response streaming without inspection and warns of
effects on security functionality that analyzes response bodies. The settings
reference does not state a separate plan restriction for this setting. It also
defines **request** body buffering independently: this proposal does not change
request inspection.
[Response Body Buffering settings](https://developers.cloudflare.com/rules/configuration-rules/settings/#response-body-buffering)

Cloudflare's response-inspection guide identifies challenge injection and Web
Analytics among body-changing features and recommends a narrow Configuration Rule
with buffering disabled when isolating inspection. It warns that security,
optimization, and analytics features can stop functioning for matching responses.
Unlike `no-transform`, this also removes read-only inspection.
[Response body inspection](https://developers.cloudflare.com/rules/configuration-rules/response-body-inspection/)

**Inference, not tested behavior:** a request-side exact-host rule should also
match unknown paths whose eventual response is 404, without depending on Pages
preserving Cache-Control. The cited documentation does not expressly guarantee
JSD suppression on Pages fallback responses. A real custom-domain test remains
necessary before calling this an accepted fix. The broader security tradeoff is
explicit in the [body-buffering release notice](https://developers.cloudflare.com/changelog/post/2026-01-27-body-buffering-settings/).

## Why a WAF Skip rule is not the answer

The documented WAF Skip options cover selected rules, phases, and named security
products; they do not expose a JSD-injection option. Super Bot Fight Mode rules
can be skipped, but Bot Fight Mode cannot. Skipping enforcement is not documented
as stopping response injection, so adding a broad Skip rule would weaken unrelated
checks without establishing this requirement.
[Available skip options](https://developers.cloudflare.com/waf/custom-rules/skip/options/)

JSD's dedicated selective mechanism is manual script/API installation, for which
Cloudflare recommends disabling automatic zone-wide injection first. That requires
coordination with other sites, not just a Caitlyn exclusion. The same documentation
supports nonces and origin `no-transform`, and states the detection signal is
factored into bot scoring. Consequently, finding no custom rules that explicitly
consume `js_detection.passed` is not proof of zero indirect security impact.
Bot Fight Mode customers cannot independently disable its automatic JSD; other
bot product configurations differ. No live entitlement is inferred here.
[JavaScript Detections](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/)

## Web Analytics is independently configurable

For proxied sites, Web Analytics rules can include or exclude specific hostnames
and paths. A matching Configuration Rule that disables analytics takes precedence
over an analytics rule enabling it. This offers a dedicated analytics decision
without changing JSD.
[Web Analytics rules](https://developers.cloudflare.com/web-analytics/configuration-options/rules/)

The configuration property is `disable_rum: true`.
[Disable Real User Monitoring](https://developers.cloudflare.com/rules/configuration-rules/settings/#disable-real-user-monitoring-rum)
The separate RUM API represents rules with `host`, `paths`, and `inclusive` fields.
[RUM API](https://developers.cloudflare.com/api/resources/rum/)

Pages also has project-level automatic beacon installation on deployment; source
HTML and project analytics configuration must therefore be distinguished from
zone-side injection. A response-inspection exclusion does not promise to remove
a beacon already present in the origin HTML.
[Web Analytics setup](https://developers.cloudflare.com/web-analytics/get-started/)

## Decision and validation criteria

Each candidate requires an explicitly approved, exact-host experiment, not a
production change justified solely by documentation.
These are project acceptance conditions derived from the capabilities and risks
above:

- Verify actual zone entitlement, existing Configuration Rules, and affected
  response-inspection features before any mutation. Absence of custom WAF rules
  is not an inventory of these other products.
- Test on a custom hostname in the same zone. Demonstrate injection on a control
  first, then change only the candidate setting. Keep request inspection and
  other hostnames unchanged.
- Check the homepage, real unknown-path 404s, asset-like missing paths, exported
  fallback aliases, and browser error recovery in Chromium, Firefox, and WebKit.
- Compare raw HTML and CSP violations separately for JSD and analytics; verify
  asset compression and cache behavior rather than extrapolating from the failed
  `no-transform` experiment.
- Treat an unavailable setting or retained fallback injection as a rejected
  candidate. Do not compensate with a broad WAF Skip or a silent zone-wide change.
- Remove test rules/resources afterward; retain the hash CSP decision separately
  from the owner's analytics and Cloudflare inspection decisions.
