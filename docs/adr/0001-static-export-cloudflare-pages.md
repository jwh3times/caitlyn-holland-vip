# Static export to Cloudflare Pages

The site builds with `output: "export"` (`next.config.ts`) and deploys to Cloudflare Pages, which serves the generated `out/` directory. We chose a static export over a Node-hosted Next.js deployment because the site is entirely presentational — there is nothing to render per request — and a prebuilt bundle on a CDN is cheaper, faster, and has no runtime to keep patched.

## Consequences

- No API routes, no `getServerSideProps`, no server actions, no middleware. Every route must be known at build time.
- No runtime environment variables. Anything configurable is baked in at build time.
- Images are `unoptimized` — Next's image optimizer needs a server.
- Security headers cannot come from `next.config.ts`, because static export ignores `headers()`. They are served by Cloudflare from `public/_headers`.
- Anything added under `app/` ships. There is no such thing as a route that exists locally but not in production.
